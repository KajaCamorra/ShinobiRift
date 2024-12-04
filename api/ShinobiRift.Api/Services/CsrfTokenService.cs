using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Caching.Distributed;
using ShinobiRift.Api.Models;

namespace ShinobiRift.Api.Services
{
    public interface ICsrfTokenService
    {
        Task<string> GenerateTokenAsync(string sessionId);
        Task<bool> ValidateTokenAsync(string sessionId, string token);
        Task<string> RefreshTokenAsync(string sessionId, string oldToken);
        Task InvalidateTokenAsync(string sessionId);
    }

    public class CsrfTokenService : ICsrfTokenService
    {
        private readonly ILogger<CsrfTokenService> _logger;
        private readonly IDistributedCache _cache;
        private readonly IUserSessionManager _sessionManager;
        private const int TOKEN_LENGTH = 32; // 32 bytes = 256 bits
        private const string TOKEN_PREFIX = "csrf:";
        private const string OLD_TOKEN_PREFIX = "csrf:old:";
        private const int GRACE_PERIOD_SECONDS = 30; // Grace period for old tokens

        public CsrfTokenService(
            ILogger<CsrfTokenService> logger,
            IDistributedCache cache,
            IUserSessionManager sessionManager)
        {
            _logger = logger;
            _cache = cache;
            _sessionManager = sessionManager;
        }

        public async Task<string> GenerateTokenAsync(string sessionId)
        {
            try
            {
                if (string.IsNullOrEmpty(sessionId))
                {
                    throw new ArgumentException("Session ID is required", nameof(sessionId));
                }

                // Get session expiration from session data
                var sessionJson = await _cache.GetStringAsync($"session:{sessionId}");
                if (string.IsNullOrEmpty(sessionJson))
                {
                    throw new InvalidOperationException("Session not found");
                }

                // Generate cryptographically secure random token
                var tokenBytes = new byte[TOKEN_LENGTH];
                using (var rng = RandomNumberGenerator.Create())
                {
                    rng.GetBytes(tokenBytes);
                }

                // Convert to URL-safe base64 string
                var token = Convert.ToBase64String(tokenBytes)
                    .Replace('+', '-')
                    .Replace('/', '_')
                    .TrimEnd('=');

                // Store token with session binding
                var options = new DistributedCacheEntryOptions
                {
                    AbsoluteExpiration = DateTimeOffset.UtcNow.AddDays(7) // Match session expiration
                };

                await _cache.SetStringAsync(
                    $"{TOKEN_PREFIX}{sessionId}",
                    token,
                    options);

                _logger.LogInformation("Generated new CSRF token for session {SessionId}", sessionId);
                return token;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating CSRF token for session {SessionId}", sessionId);
                throw;
            }
        }

        public async Task<bool> ValidateTokenAsync(string sessionId, string token)
        {
            try
            {
                if (string.IsNullOrEmpty(sessionId) || string.IsNullOrEmpty(token))
                {
                    return false;
                }

                // First verify session is still active
                var activityState = await _sessionManager.GetUserActivityStateAsync(sessionId);
                if (activityState == UserActivityState.Offline)
                {
                    _logger.LogWarning("Attempted to validate CSRF token for inactive session {SessionId}", sessionId);
                    return false;
                }

                // Get current token
                var currentToken = await _cache.GetStringAsync($"{TOKEN_PREFIX}{sessionId}");
                if (currentToken != null && CryptoHelper.ConstantTimeEquals(token, currentToken))
                {
                    return true;
                }

                // Check if there's an old token during rotation
                var oldToken = await _cache.GetStringAsync($"{OLD_TOKEN_PREFIX}{sessionId}");
                if (oldToken != null && CryptoHelper.ConstantTimeEquals(token, oldToken))
                {
                    _logger.LogInformation("Validated request using old token during rotation for session {SessionId}", sessionId);
                    return true;
                }

                _logger.LogWarning("Invalid CSRF token for session {SessionId}", sessionId);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating CSRF token for session {SessionId}", sessionId);
                return false;
            }
        }

        public async Task<string> RefreshTokenAsync(string sessionId, string oldToken)
        {
            try
            {
                var isValid = await ValidateTokenAsync(sessionId, oldToken);
                if (!isValid)
                {
                    throw new InvalidOperationException("Invalid token provided for refresh");
                }

                // Store the old token with a grace period
                var oldTokenOptions = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(GRACE_PERIOD_SECONDS)
                };

                await _cache.SetStringAsync(
                    $"{OLD_TOKEN_PREFIX}{sessionId}",
                    oldToken,
                    oldTokenOptions);

                _logger.LogInformation(
                    "Stored old token with {GracePeriod} second grace period for session {SessionId}",
                    GRACE_PERIOD_SECONDS,
                    sessionId);

                // Generate new token
                var newToken = await GenerateTokenAsync(sessionId);

                // Use distributed lock to handle concurrent requests
                var lockKey = $"lock:{TOKEN_PREFIX}{sessionId}";
                var lockValue = Guid.NewGuid().ToString();
                var lockExpiry = TimeSpan.FromSeconds(10);

                try
                {
                    // Acquire lock
                    var lockAcquired = await _cache.GetStringAsync(lockKey) == null &&
                        await _cache.GetStringAsync(lockKey) == lockValue;

                    if (!lockAcquired)
                    {
                        _logger.LogWarning("Failed to acquire lock for token rotation on session {SessionId}", sessionId);
                        throw new InvalidOperationException("Concurrent token rotation in progress");
                    }

                    await _cache.SetStringAsync(
                        lockKey,
                        lockValue,
                        new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = lockExpiry });

                    // Store new token
                    return newToken;
                }
                finally
                {
                    // Release lock if we acquired it
                    var currentLockValue = await _cache.GetStringAsync(lockKey);
                    if (currentLockValue == lockValue)
                    {
                        await _cache.RemoveAsync(lockKey);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing CSRF token for session {SessionId}", sessionId);
                throw;
            }
        }

        public async Task InvalidateTokenAsync(string sessionId)
        {
            try
            {
                // Remove both current and old tokens
                await _cache.RemoveAsync($"{TOKEN_PREFIX}{sessionId}");
                await _cache.RemoveAsync($"{OLD_TOKEN_PREFIX}{sessionId}");
                _logger.LogInformation("Invalidated CSRF tokens for session {SessionId}", sessionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating CSRF token for session {SessionId}", sessionId);
                throw;
            }
        }
    }

    internal static class CryptoHelper
    {
        public static bool ConstantTimeEquals(string a, string b)
        {
            if (a == null || b == null || a.Length != b.Length)
                return false;

            var aBytes = Encoding.UTF8.GetBytes(a);
            var bBytes = Encoding.UTF8.GetBytes(b);

            uint difference = (uint)aBytes.Length ^ (uint)bBytes.Length;
            for (int i = 0; i < aBytes.Length && i < bBytes.Length; i++)
            {
                difference |= (uint)(aBytes[i] ^ bBytes[i]);
            }

            return difference == 0;
        }
    }
}
