using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using ShinobiRift.Api.Services;

namespace ShinobiRift.Api.Middleware
{
    public class SessionAuthMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<SessionAuthMiddleware> _logger;

        public SessionAuthMiddleware(
            RequestDelegate next,
            ILogger<SessionAuthMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, IUserSessionManager sessionManager, IPlayFabService playFabService)
        {
            _logger.LogInformation("Request path: {Path}", context.Request.Path);

            // Allow access to static files
            if (context.Request.Path.StartsWithSegments("/test.html") ||
                context.Request.Path.StartsWithSegments("/lib") ||
                context.Request.Path.StartsWithSegments("/css") ||
                context.Request.Path.StartsWithSegments("/js"))
            {
                _logger.LogInformation("Allowing access to static file: {Path}", context.Request.Path);
                await _next(context);
                return;
            }

            // Skip auth for swagger
            if (context.Request.Path.StartsWithSegments("/swagger"))
            {
                _logger.LogInformation("Allowing access to Swagger");
                await _next(context);
                return;
            }

            // For SignalR hub connections and negotiation
            if (context.Request.Path.StartsWithSegments("/hubs/game"))
            {
                var userId = context.Request.Headers["X-User-Id"].ToString();
                var sessionTicket = context.Request.Headers["X-Session-Token"].ToString();

                _logger.LogInformation("SignalR request - UserId: {UserId}, HasSessionTicket: {HasSessionTicket}", 
                    userId, !string.IsNullOrEmpty(sessionTicket));

                if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(sessionTicket))
                {
                    _logger.LogWarning("Missing authentication headers for SignalR connection");
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsJsonAsync(new { message = "Authentication required for SignalR connection" });
                    return;
                }

                try
                {
                    var isValidSession = await playFabService.ValidateSessionTicketAsync(sessionTicket);
                    if (!isValidSession)
                    {
                        _logger.LogWarning("Invalid PlayFab session ticket for user {UserId}", userId);
                        context.Response.StatusCode = 401;
                        await context.Response.WriteAsJsonAsync(new { message = "Invalid session ticket" });
                        return;
                    }

                    _logger.LogInformation("Valid PlayFab session for user {UserId}", userId);

                    var claims = new List<Claim>
                    {
                        new Claim(ClaimTypes.NameIdentifier, userId),
                        new Claim("SessionToken", sessionTicket)
                    };

                    var identity = new ClaimsIdentity(claims, "SignalR");
                    context.User = new ClaimsPrincipal(identity);

                    await _next(context);
                    return;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error validating PlayFab session for user {UserId}", userId);
                    context.Response.StatusCode = 500;
                    await context.Response.WriteAsJsonAsync(new { message = "Error validating session" });
                    return;
                }
            }

            // For API endpoints
            var apiUserId = context.Request.Headers["X-User-Id"].ToString();
            var apiSessionTicket = context.Request.Headers["X-Session-Token"].ToString();

            _logger.LogInformation("API request - UserId: {UserId}, HasSessionTicket: {HasSessionTicket}",
                apiUserId, !string.IsNullOrEmpty(apiSessionTicket));

            if (string.IsNullOrEmpty(apiUserId) || string.IsNullOrEmpty(apiSessionTicket))
            {
                _logger.LogWarning("Missing authentication headers for API request");
                context.Response.StatusCode = 401;
                await context.Response.WriteAsJsonAsync(new { message = "Authentication required" });
                return;
            }

            try
            {
                // Get user's activity state
                var activityState = await sessionManager.GetUserActivityStateAsync(apiUserId);
                _logger.LogInformation("User {UserId} activity state: {State}", apiUserId, activityState);

                // If user is offline (no activity in last 15 minutes), require re-authentication
                if (activityState == Models.UserActivityState.Offline)
                {
                    _logger.LogWarning("Session expired for user {UserId}", apiUserId);
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsJsonAsync(new { message = "Session expired" });
                    return;
                }

                // Add claims for downstream use
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, apiUserId),
                    new Claim("SessionToken", apiSessionTicket)
                };

                var identity = new ClaimsIdentity(claims, "SessionAuth");
                context.User = new ClaimsPrincipal(identity);

                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error authenticating user {UserId}", apiUserId);
                context.Response.StatusCode = 500;
                await context.Response.WriteAsJsonAsync(new { message = "An error occurred during authentication" });
            }
        }
    }

    public static class SessionAuthMiddlewareExtensions
    {
        public static IApplicationBuilder UseSessionAuth(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<SessionAuthMiddleware>();
        }
    }
}
