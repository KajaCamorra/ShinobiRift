using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using ShinobiRift.Api.Services;

namespace ShinobiRift.Api.Middleware
{
    public class CsrfMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<CsrfMiddleware> _logger;
        private readonly string[] _ignoredMethods = new[] { "GET", "HEAD", "OPTIONS" };
        private const string CSRF_HEADER = "X-CSRF-Token";
        private const string CSRF_COOKIE = "csrf_token";
        private const int COOKIE_EXPIRY_DAYS = 7;

        public CsrfMiddleware(
            RequestDelegate next,
            ILogger<CsrfMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(
            HttpContext context,
            ICsrfTokenService csrfTokenService)
        {
            try
            {
                // Skip CSRF check for ignored methods
                if (_ignoredMethods.Contains(context.Request.Method))
                {
                    await _next(context);
                    return;
                }

                // Skip CSRF check for paths that don't require auth
                if (context.Request.Path.StartsWithSegments("/swagger") ||
                    context.Request.Path.StartsWithSegments("/test.html") ||
                    context.Request.Path.StartsWithSegments("/lib") ||
                    context.Request.Path.StartsWithSegments("/css") ||
                    context.Request.Path.StartsWithSegments("/js") ||
                    // Allow login endpoints to bypass CSRF (they'll generate tokens)
                    context.Request.Path.StartsWithSegments("/api/auth/login") ||
                    context.Request.Path.StartsWithSegments("/api/auth/discord"))
                {
                    await _next(context);
                    return;
                }

                var sessionId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(sessionId))
                {
                    _logger.LogWarning("No session ID found for CSRF validation");
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await context.Response.WriteAsJsonAsync(new { message = "Invalid session for CSRF validation" });
                    return;
                }

                // For token refresh requests, generate new token
                if (context.Request.Path.StartsWithSegments("/api/auth/refresh"))
                {
                    var newToken = await csrfTokenService.GenerateTokenAsync(sessionId);
                    SetCsrfCookie(context, newToken);
                    await _next(context);
                    return;
                }

                // For all other protected requests, validate token
                var csrfToken = context.Request.Headers[CSRF_HEADER].ToString();
                if (string.IsNullOrEmpty(csrfToken))
                {
                    _logger.LogWarning("Missing CSRF token in request headers");
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await context.Response.WriteAsJsonAsync(new { message = "CSRF token required" });
                    return;
                }

                var isValid = await csrfTokenService.ValidateTokenAsync(sessionId, csrfToken);
                if (!isValid)
                {
                    _logger.LogWarning("Invalid CSRF token for session {SessionId}", sessionId);
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await context.Response.WriteAsJsonAsync(new { message = "Invalid CSRF token" });
                    return;
                }

                // For logout requests, invalidate the token after successful validation
                if (context.Request.Path.StartsWithSegments("/api/auth/logout"))
                {
                    await csrfTokenService.InvalidateTokenAsync(sessionId);
                    RemoveCsrfCookie(context);
                }

                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing CSRF validation");
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                await context.Response.WriteAsJsonAsync(new { message = "An error occurred during CSRF validation" });
            }
        }

        private void SetCsrfCookie(HttpContext context, string token)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(COOKIE_EXPIRY_DAYS),
                Path = "/"
            };

            context.Response.Cookies.Append(CSRF_COOKIE, token, cookieOptions);
        }

        private void RemoveCsrfCookie(HttpContext context)
        {
            context.Response.Cookies.Delete(CSRF_COOKIE, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Path = "/"
            });
        }
    }

    public static class CsrfMiddlewareExtensions
    {
        public static IApplicationBuilder UseCsrfProtection(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<CsrfMiddleware>();
        }
    }
}
