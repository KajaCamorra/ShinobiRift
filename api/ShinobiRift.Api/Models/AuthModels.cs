using System.Text.Json.Serialization;

namespace ShinobiRift.Api.Models
{
    public enum AuthSource
    {
        Discord,
        Google,
        Facebook,
        PlayFabDev
    }

    public class DiscordUser
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("username")]
        public string Username { get; set; } = string.Empty;

        [JsonPropertyName("discriminator")]
        public string Discriminator { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("avatar")]
        public string? Avatar { get; set; }
    }

    public class AuthSession
    {
        public string SessionId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string PlayFabId { get; set; } = string.Empty;
        public string PlayFabSessionTicket { get; set; } = string.Empty;
        public string SessionToken { get; set; } = string.Empty;
        public string AccessToken { get; set; } = string.Empty;
        public DateTimeOffset Created { get; set; }
        public DateTimeOffset Expires { get; set; }
        public DateTimeOffset LastActive { get; set; }
        public AuthSource AuthSource { get; set; }
    }

    public class TokenResponse
    {
        public string SessionToken { get; set; } = string.Empty;
        public string AccessToken { get; set; } = string.Empty;
        public int ExpiresIn { get; set; }
        public string PlayFabId { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
    }

    public class AuthenticateRequest
    {
        public string DiscordCode { get; set; } = string.Empty;
    }

    public class RefreshSessionRequest
    {
        public string SessionToken { get; set; } = string.Empty;
    }

    public class CookieConfig
    {
        public static CookieOptions GetSecureCookieOptions(DateTimeOffset expires)
        {
            return new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Path = "/",
                Expires = expires,
                MaxAge = TimeSpan.FromDays(3) // 3 days in seconds
            };
        }
    }
}
