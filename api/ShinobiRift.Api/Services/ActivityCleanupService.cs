using StackExchange.Redis;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Caching.Distributed;

namespace ShinobiRift.Api.Services
{
    public class ActivityCleanupService : BackgroundService
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly IDistributedCache _cache;
        private readonly ILogger<ActivityCleanupService> _logger;
        private const string ONLINE_USERS_KEY = "online_users";
        private const int CLEANUP_INTERVAL_MINUTES = 5;
        private const int OFFLINE_THRESHOLD_MINUTES = 15;

        public ActivityCleanupService(
            IConnectionMultiplexer redis,
            IDistributedCache cache,
            ILogger<ActivityCleanupService> logger)
        {
            _redis = redis;
            _cache = cache;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await PerformCleanup();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error during activity cleanup");
                }

                await Task.Delay(TimeSpan.FromMinutes(CLEANUP_INTERVAL_MINUTES), stoppingToken);
            }
        }

        private async Task PerformCleanup()
        {
            var db = _redis.GetDatabase();
            var now = DateTime.UtcNow;
            var offlineThreshold = now.AddMinutes(-OFFLINE_THRESHOLD_MINUTES).Ticks;

            // Remove users who haven't been active for more than the offline threshold
            await db.SortedSetRemoveRangeByScoreAsync(
                ONLINE_USERS_KEY,
                double.NegativeInfinity,
                offlineThreshold
            );

            _logger.LogInformation("Completed activity cleanup at {time}", DateTime.UtcNow);
        }
    }
}
