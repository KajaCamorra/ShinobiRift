using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using ShinobiRift.Api.Configuration;
using ShinobiRift.Api.Models;

namespace ShinobiRift.Api.Services
{
    public interface ITokenService
    {
        string GenerateSessionToken(string sessionId, string userId);
        string GenerateAccessToken(string sessionId, string userId);
        bool ValidateSessionToken(string token, out string? sessionId, out string? userId);
        bool ValidateAccessToken(string token, out string? sessionId, out string? userId);
    }

    public class TokenService : ITokenService
    {
        private readonly TokenSettings _settings;
        private readonly SigningCredentials _signingCredentials;
        private readonly TokenValidationParameters _validationParameters;

        public TokenService(AppSettings appSettings)
        {
            _settings = appSettings.Tokens;

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.SecretKey));
            _signingCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            _validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _settings.Issuer,
                ValidAudience = _settings.Audience,
                IssuerSigningKey = key,
                ClockSkew = TimeSpan.Zero
            };
        }

        public string GenerateSessionToken(string sessionId, string userId)
        {
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Jti, sessionId),
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim("token_type", "session")
            };

            return GenerateToken(claims, TimeSpan.FromMinutes(_settings.SessionTokenExpirationMinutes));
        }

        public string GenerateAccessToken(string sessionId, string userId)
        {
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Jti, sessionId),
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim("token_type", "access"),
                new Claim("signalr_allowed", "true")
            };

            return GenerateToken(claims, TimeSpan.FromMinutes(_settings.AccessTokenExpirationMinutes));
        }

        private string GenerateToken(Claim[] claims, TimeSpan expiration)
        {
            var token = new JwtSecurityToken(
                issuer: _settings.Issuer,
                audience: _settings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.Add(expiration),
                signingCredentials: _signingCredentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public bool ValidateSessionToken(string token, out string? sessionId, out string? userId)
        {
            return ValidateToken(token, "session", out sessionId, out userId);
        }

        public bool ValidateAccessToken(string token, out string? sessionId, out string? userId)
        {
            return ValidateToken(token, "access", out sessionId, out userId);
        }

        private bool ValidateToken(string token, string expectedTokenType, out string? sessionId, out string? userId)
        {
            sessionId = null;
            userId = null;

            try
            {
                var handler = new JwtSecurityTokenHandler();
                var principal = handler.ValidateToken(token, _validationParameters, out var validatedToken);

                var tokenType = principal.Claims.FirstOrDefault(c => c.Type == "token_type")?.Value;
                if (tokenType != expectedTokenType)
                {
                    return false;
                }

                sessionId = principal.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;
                userId = principal.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

                return !string.IsNullOrEmpty(sessionId) && !string.IsNullOrEmpty(userId);
            }
            catch
            {
                return false;
            }
        }
    }
}
