namespace ShinobiRift.Api.Configuration
{
    public class AppSettings
    {
        public RedisSettings Redis { get; set; } = new();
        public PlayFabSettings PlayFab { get; set; } = new();
        public SessionSettings Session { get; set; } = new();
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
}
