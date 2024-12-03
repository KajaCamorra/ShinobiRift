namespace ShinobiRift.Api.Configuration
{
    public class AppSettings
    {
        public RedisSettings Redis { get; set; } = new();
        public PlayFabSettings PlayFab { get; set; } = new();
        public SessionSettings Session { get; set; } = new();
        public DiscordSettings Discord { get; set; } = new();
        public TokenSettings Tokens { get; set; } = new();
        public string[] AllowedOrigins { get; set; } = new[] { "http://localhost:3000" };
    }

    public class RedisSettings
    {
        public string ConnectionString { get; set; } = string.Empty;
        public string InstanceName { get; set; } = "ShinobiRift:";
        public string ChannelPrefix { get; set; } = "ShinobiRift";
    }

    public class PlayFabSettings
    {
        public string TitleId { get; set; } = string.Empty;
        public string DeveloperSecretKey { get; set; } = string.Empty;
    }

    public class SessionSettings
    {
        public int ActiveThresholdMinutes { get; set; } = 5;
        public int OnlineThresholdMinutes { get; set; } = 15;
        public int SessionExpirationDays { get; set; } = 3;
    }

    public class DiscordSettings
    {
        public string ClientId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
        public string RedirectUri { get; set; } = string.Empty;
        public string[] Scopes { get; set; } = new[] { "identify", "email" };
    }

    public class TokenSettings
    {
        public string SecretKey { get; set; } = string.Empty;
        public string Issuer { get; set; } = "ShinobiRift";
        public string Audience { get; set; } = "ShinobiRift";
        public int SessionTokenExpirationMinutes { get; set; } = 4320; // 3 days
        public int AccessTokenExpirationMinutes { get; set; } = 60; // 1 hour
    }
}
