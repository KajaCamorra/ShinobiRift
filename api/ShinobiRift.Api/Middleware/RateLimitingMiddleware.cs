using System.Collections.Concurrent;
using StackExchange.Redis;

namespace ShinobiRift.Api.Middleware
{
    public class RateLimitingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RateLimitingMiddleware> _logger;
        private readonly IConnectionMultiplexer _redis;
        private const int MAX_REQUESTS = 100;
        private const int WINDOW_MINUTES = 1;

        public RateLimitingMiddleware(
            RequestDelegate next,
            ILogger<RateLimitingMiddleware> logger,
            IConnectionMultiplexer redis)
        {
            _next = next;
            _logger = logger;
            _redis = redis;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var key = GetClientKey(context);
            var db = _redis.GetDatabase();
            var windowKey = $"ratelimit:{key}:{DateTime.UtcNow:yyyyMMddHHmm}";

            var currentCount = await db.StringIncrementAsync(windowKey);
            if (currentCount == 1)
            {
                await db.KeyExpireAsync(windowKey, TimeSpan.FromMinutes(WINDOW_MINUTES));
            }

            context.Response.Headers.Add("X-RateLimit-Limit", MAX_REQUESTS.ToString());
            context.Response.Headers.Add("X-RateLimit-Remaining", Math.Max(0, MAX_REQUESTS - currentCount).ToString());
            context.Response.Headers.Add("X-RateLimit-Reset", GetResetTime().ToString());

            if (currentCount > MAX_REQUESTS)
            {
                _logger.LogWarning("Rate limit exceeded for client {ClientKey}", key);
                context.Response.StatusCode = 429; // Too Many Requests
                await context.Response.WriteAsJsonAsync(new { message = "Too many requests. Please try again later." });
                return;
            }

            await _next(context);
        }

        private string GetClientKey(HttpContext context)
        {
            return context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? context.Request.Headers["X-User-Id"].ToString()
                ?? context.Connection.RemoteIpAddress?.ToString()
                ?? "anonymous";
        }

        private static long GetResetTime()
        {
            var now = DateTime.UtcNow;
            var nextWindow = now.AddMinutes(1).AddSeconds(-now.Second).AddMilliseconds(-now.Millisecond);
            return ((DateTimeOffset)nextWindow).ToUnixTimeSeconds();
        }
    }

    public static class RateLimitingMiddlewareExtensions
    {
        public static IApplicationBuilder UseRateLimiting(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<RateLimitingMiddleware>();
        }
    }
}
