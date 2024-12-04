using ShinobiRift.Api.Services;

namespace ShinobiRift.Api.Middleware
{
    public class RateLimitingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RateLimitingMiddleware> _logger;
        private readonly IRateLimitService _rateLimitService;
        private readonly string _environment;

        public RateLimitingMiddleware(
            RequestDelegate next,
            ILogger<RateLimitingMiddleware> logger,
            IRateLimitService rateLimitService,
            IConfiguration configuration)
        {
            _next = next;
            _logger = logger;
            _rateLimitService = rateLimitService;
            _environment = configuration.GetValue<string>("Environment", "Development");
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var key = new RateLimitKey
            {
                Type = context.User?.Identity?.IsAuthenticated == true ? "userId" : "ip",
                Value = GetClientIdentifier(context),
                Environment = _environment,
                IsCsrf = false // Regular API request
            };

            var result = await _rateLimitService.IsAllowedAndRecord(key);

            context.Response.Headers.Add("X-RateLimit-Remaining", result.Remaining.ToString());
            context.Response.Headers.Add("X-RateLimit-Reset", result.ResetTime.ToString());

            if (!result.Allowed)
            {
                _logger.LogWarning("Rate limit exceeded for client {ClientKey}", key.Value);
                context.Response.StatusCode = 429; // Too Many Requests
                await context.Response.WriteAsJsonAsync(new { message = "Too many requests. Please try again later." });
                return;
            }

            await _next(context);
        }

        private string GetClientIdentifier(HttpContext context)
        {
            if (context.User?.Identity?.IsAuthenticated == true)
            {
                return context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                    ?? "anonymous";
            }

            return context.Connection.RemoteIpAddress?.ToString() ?? "anonymous";
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
