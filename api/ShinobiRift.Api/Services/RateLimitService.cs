using StackExchange.Redis;
using System.Text.Json;

namespace ShinobiRift.Api.Services
{
    public class RateLimitConfig
    {
        public int WindowSeconds { get; set; }
        public int MaxAttempts { get; set; }
        public int BlockDuration { get; set; }
        public bool FailClosed { get; set; } = true;  // Default to fail-closed for safety
        
        // Separate limits for CSRF
        public int CsrfWindowSeconds { get; set; }
        public int CsrfMaxAttempts { get; set; }
        public int CsrfBlockDuration { get; set; }
    }

    public class RateLimitKey
    {
        public string Type { get; set; }
        public string Value { get; set; }
        public string Environment { get; set; }
        public bool IsCsrf { get; set; }
    }

    public class RateLimitResult
    {
        public bool Allowed { get; set; }
        public int Remaining { get; set; }
        public long ResetTime { get; set; }
    }

    public interface IRateLimitService
    {
        Task<RateLimitResult> IsAllowedAndRecord(RateLimitKey key);
        Task ClearLimit(RateLimitKey key);
    }

    public class RateLimitService : IRateLimitService
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly ILogger<RateLimitService> _logger;
        private readonly RateLimitConfig _config;

        public RateLimitService(
            IConnectionMultiplexer redis,
            ILogger<RateLimitService> logger,
            IConfiguration configuration)
        {
            _redis = redis;
            _logger = logger;
            _config = new RateLimitConfig
            {
                WindowSeconds = configuration.GetValue<int>("RateLimit:WindowSeconds", 300),
                MaxAttempts = configuration.GetValue<int>("RateLimit:MaxAttempts", 5),
                BlockDuration = configuration.GetValue<int>("RateLimit:BlockDuration", 900),
                FailClosed = configuration.GetValue<bool>("RateLimit:FailClosed", true),
                
                // CSRF-specific limits
                CsrfWindowSeconds = configuration.GetValue<int>("RateLimit:CsrfWindowSeconds", 60),
                CsrfMaxAttempts = configuration.GetValue<int>("RateLimit:CsrfMaxAttempts", 3),
                CsrfBlockDuration = configuration.GetValue<int>("RateLimit:CsrfBlockDuration", 300)
            };
        }

        private string GetRedisKey(RateLimitKey key)
        {
            var prefix = key.IsCsrf ? "ratelimit:csrf" : "ratelimit";
            return $"{prefix}:{key.Environment}:{key.Type}:{key.Value}";
        }

        private string GetBlockKey(RateLimitKey key)
        {
            var prefix = key.IsCsrf ? "ratelimit:csrf:block" : "ratelimit:block";
            return $"{prefix}:{key.Environment}:{key.Type}:{key.Value}";
        }

        private async Task<long> GetRedisTime(IDatabase db)
        {
            try
            {
                var result = (RedisValue[])(await db.ExecuteAsync("TIME"));
                return long.Parse(result[0].ToString()); // Redis TIME returns [seconds, microseconds]
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get Redis TIME, falling back to local time");
                return DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            }
        }

        public async Task<RateLimitResult> IsAllowedAndRecord(RateLimitKey key)
        {
            try
            {
                var db = _redis.GetDatabase();
                var redisKey = GetRedisKey(key);
                var blockKey = GetBlockKey(key);

                // Get configuration values based on request type
                var maxAttempts = key.IsCsrf ? _config.CsrfMaxAttempts : _config.MaxAttempts;
                var windowSeconds = key.IsCsrf ? _config.CsrfWindowSeconds : _config.WindowSeconds;
                var blockDuration = key.IsCsrf ? _config.CsrfBlockDuration : _config.BlockDuration;

                // Check if blocked using transaction
                var tran = db.CreateTransaction();
                var blockExistsTask = tran.KeyExistsAsync(blockKey);
                var blockTtlTask = tran.KeyTimeToLiveAsync(blockKey);
                
                if (!await tran.ExecuteAsync())
                {
                    throw new RedisException("Failed to execute block check transaction");
                }

                if (await blockExistsTask)
                {
                    var ttl = await blockTtlTask;
                    return new RateLimitResult
                    {
                        Allowed = false,
                        Remaining = 0,
                        ResetTime = await GetRedisTime(db) + (long)(ttl?.TotalSeconds ?? 0)
                    };
                }

                // Use transaction for atomic check and increment
                tran = db.CreateTransaction();
                var getTask = tran.StringGetAsync(redisKey);
                var incrTask = tran.StringIncrementAsync(redisKey);
                var timeTask = GetRedisTime(db);

                if (!await tran.ExecuteAsync())
                {
                    throw new RedisException("Failed to execute rate limit transaction");
                }

                var currentAttempts = (int)(await incrTask);
                var redisTime = await timeTask;

                // Set expiry if this is the first attempt
                if (currentAttempts == 1)
                {
                    await db.KeyExpireAsync(redisKey, TimeSpan.FromSeconds(windowSeconds));
                }

                // Block if limit exceeded
                if (currentAttempts >= maxAttempts)
                {
                    await db.StringSetAsync(
                        blockKey,
                        "blocked",
                        TimeSpan.FromSeconds(blockDuration)
                    );
                    
                    _logger.LogWarning(
                        "Rate limit exceeded for {Type} key {Key}. Blocking for {Duration} seconds",
                        key.IsCsrf ? "CSRF" : "API",
                        JsonSerializer.Serialize(key),
                        blockDuration
                    );

                    return new RateLimitResult
                    {
                        Allowed = false,
                        Remaining = 0,
                        ResetTime = redisTime + blockDuration
                    };
                }

                return new RateLimitResult
                {
                    Allowed = true,
                    Remaining = maxAttempts - currentAttempts,
                    ResetTime = redisTime + windowSeconds
                };
            }
            catch (RedisConnectionException ex)
            {
                _logger.LogError(ex, "Redis connection error during rate limit check");
                return new RateLimitResult
                {
                    // If FailClosed is true, deny requests when Redis is unavailable
                    Allowed = !_config.FailClosed,
                    Remaining = 0,
                    ResetTime = DateTimeOffset.UtcNow.AddSeconds(
                        key.IsCsrf ? _config.CsrfWindowSeconds : _config.WindowSeconds
                    ).ToUnixTimeSeconds()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during rate limit check");
                return new RateLimitResult
                {
                    Allowed = !_config.FailClosed,
                    Remaining = 0,
                    ResetTime = DateTimeOffset.UtcNow.AddSeconds(
                        key.IsCsrf ? _config.CsrfWindowSeconds : _config.WindowSeconds
                    ).ToUnixTimeSeconds()
                };
            }
        }

        public async Task ClearLimit(RateLimitKey key)
        {
            try
            {
                var db = _redis.GetDatabase();
                var redisKey = GetRedisKey(key);
                var blockKey = GetBlockKey(key);

                await db.KeyDeleteAsync(new RedisKey[] { redisKey, blockKey });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing rate limit for key {Key}", JsonSerializer.Serialize(key));
                throw;
            }
        }
    }
}
