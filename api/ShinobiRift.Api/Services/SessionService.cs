using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using ShinobiRift.Api.Models;
using ShinobiRift.Api.Configuration;

namespace ShinobiRift.Api.Services
{
    public interface ISessionService
    {
        Task<AuthSession?> GetSessionAsync(string sessionId);
        Task SaveSessionAsync(AuthSession session);
        Task RemoveSessionAsync(string sessionId);
        Task UpdateLastActiveAsync(string sessionId);
    }

    public class SessionService : ISessionService
    {
        private readonly IDistributedCache _cache;
        private readonly SessionSettings _settings;
        private readonly ILogger<SessionService> _logger;

        public SessionService(
            IDistributedCache cache,
            AppSettings appSettings,
            ILogger<SessionService> logger)
        {
            _cache = cache;
            _settings = appSettings.Session;
            _logger = logger;
        }

        public async Task<AuthSession?> GetSessionAsync(string sessionId)
        {
            try
            {
                var sessionJson = await _cache.GetStringAsync($"session:{sessionId}");
                if (string.IsNullOrEmpty(sessionJson))
                {
                    return null;
                }

                var session = JsonSerializer.Deserialize<AuthSession>(sessionJson);
                
                // Check if session is expired
                if (session != null && session.Expires <= DateTimeOffset.UtcNow)
                {
                    await RemoveSessionAsync(sessionId);
                    return null;
                }

                return session;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting session {SessionId}", sessionId);
                return null;
            }
        }

        public async Task SaveSessionAsync(AuthSession session)
        {
            try
            {
                // Don't save expired sessions
                if (session.Expires <= DateTimeOffset.UtcNow)
                {
                    _logger.LogWarning("Attempted to save expired session {SessionId}", session.SessionId);
                    return;
                }

                var sessionJson = JsonSerializer.Serialize(session);
                var options = new DistributedCacheEntryOptions
                {
                    AbsoluteExpiration = session.Expires
                };

                await _cache.SetStringAsync(
                    $"session:{session.SessionId}",
                    sessionJson,
                    options);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving session {SessionId}", session.SessionId);
                throw;
            }
        }

        public async Task RemoveSessionAsync(string sessionId)
        {
            try
            {
                await _cache.RemoveAsync($"session:{sessionId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing session {SessionId}", sessionId);
                throw;
            }
        }

        public async Task UpdateLastActiveAsync(string sessionId)
        {
            try
            {
                var session = await GetSessionAsync(sessionId);
                if (session != null)
                {
                    session.LastActive = DateTimeOffset.UtcNow;
                    await SaveSessionAsync(session);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating last active for session {SessionId}", sessionId);
                throw;
            }
        }
    }
}
