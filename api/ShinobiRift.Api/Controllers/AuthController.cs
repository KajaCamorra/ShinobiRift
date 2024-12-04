using Microsoft.AspNetCore.Mvc;
using ShinobiRift.Api.Models;
using ShinobiRift.Api.Services;
using ShinobiRift.Api.Configuration;

namespace ShinobiRift.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class AuthController : ControllerBase
    {
        private readonly IDiscordAuthService _discordAuth;
        private readonly IPlayFabService _playFab;
        private readonly ITokenService _tokenService;
        private readonly ISessionService _sessionService;
        private readonly ICsrfTokenService _csrfTokenService;
        private readonly SessionSettings _sessionSettings;
        private readonly ILogger<AuthController> _logger;
        private readonly IWebHostEnvironment _environment;

        public AuthController(
            IDiscordAuthService discordAuth,
            IPlayFabService playFab,
            ITokenService tokenService,
            ISessionService sessionService,
            ICsrfTokenService csrfTokenService,
            AppSettings appSettings,
            ILogger<AuthController> logger,
            IWebHostEnvironment environment)
        {
            _discordAuth = discordAuth;
            _playFab = playFab;
            _tokenService = tokenService;
            _sessionService = sessionService;
            _csrfTokenService = csrfTokenService;
            _sessionSettings = appSettings.Session;
            _logger = logger;
            _environment = environment;
        }

        private CookieOptions GetSecureCookieOptions()
        {
            var isDevelopment = _environment.IsDevelopment();
            return new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = isDevelopment ? SameSiteMode.None : SameSiteMode.Strict,
                Path = "/",
                Expires = DateTimeOffset.UtcNow.AddDays(_sessionSettings.SessionExpirationDays)
            };
        }

        [HttpPost("login")]
        [ProducesResponseType(typeof(TokenResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<TokenResponse>> Login([FromBody] AuthenticateRequest request)
        {
            try
            {
                _logger.LogInformation("Starting login process with Discord code");

                var discordUser = await _discordAuth.GetUserInfoAsync(request.DiscordCode);
                _logger.LogInformation("Got Discord user info for user {UserId}", discordUser.Id);

                var playFabResult = await _playFab.LoginWithDiscordAsync(discordUser);
                _logger.LogInformation("PlayFab authentication successful for user {PlayFabId}", playFabResult.PlayFabId);

                var sessionId = Guid.NewGuid().ToString();
                _logger.LogInformation("Generating tokens for session {SessionId}", sessionId);
                var sessionToken = _tokenService.GenerateSessionToken(sessionId, playFabResult.PlayFabId);
                var accessToken = _tokenService.GenerateAccessToken(sessionId, playFabResult.PlayFabId);

                var session = new AuthSession
                {
                    SessionId = sessionId,
                    UserId = playFabResult.PlayFabId,
                    PlayFabId = playFabResult.PlayFabId,
                    PlayFabSessionTicket = playFabResult.SessionTicket,
                    SessionToken = sessionToken,
                    AccessToken = accessToken,
                    Created = DateTimeOffset.UtcNow,
                    Expires = DateTimeOffset.UtcNow.AddDays(_sessionSettings.SessionExpirationDays),
                    LastActive = DateTimeOffset.UtcNow,
                    AuthSource = AuthSource.Discord
                };

                _logger.LogInformation("Saving session to Redis...");
                await _sessionService.SaveSessionAsync(session);
                _logger.LogInformation("Session saved successfully");

                _logger.LogInformation("Setting session cookie...");
                Response.Cookies.Append("session_token", sessionToken, GetSecureCookieOptions());

                // Generate CSRF token after session is saved
                _logger.LogInformation("Generating CSRF token...");
                var csrfToken = await _csrfTokenService.GenerateTokenAsync(sessionId);
                Response.Cookies.Append("csrf_token", csrfToken, GetSecureCookieOptions());

                var response = new TokenResponse
                {
                    SessionToken = sessionToken,
                    AccessToken = accessToken,
                    ExpiresIn = _sessionSettings.SessionExpirationDays * 24 * 60 * 60,
                    PlayFabId = playFabResult.PlayFabId,
                    DisplayName = discordUser.Username
                };

                _logger.LogInformation("Login process completed successfully");
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login process");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("refresh")]
        [ProducesResponseType(typeof(TokenResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<TokenResponse>> RefreshSession([FromBody] RefreshSessionRequest request)
        {
            try
            {
                _logger.LogInformation("Starting session refresh...");

                if (!_tokenService.ValidateSessionToken(request.SessionToken, out var sessionId, out var userId))
                {
                    _logger.LogWarning("Invalid session token during refresh");
                    return Unauthorized("Invalid session token");
                }

                var session = await _sessionService.GetSessionAsync(sessionId!);
                if (session == null)
                {
                    _logger.LogWarning("Session not found: {SessionId}", sessionId);
                    return Unauthorized("Session not found");
                }

                if (session.Expires <= DateTimeOffset.UtcNow)
                {
                    _logger.LogWarning("Session expired: {SessionId}", sessionId);
                    await _sessionService.RemoveSessionAsync(sessionId!);
                    await _csrfTokenService.InvalidateTokenAsync(sessionId!);
                    return Unauthorized("Session expired");
                }

                var isValidPlayFabSession = await _playFab.ValidateSessionTicketAsync(session.PlayFabSessionTicket);
                if (!isValidPlayFabSession)
                {
                    _logger.LogWarning("PlayFab session expired: {SessionId}", sessionId);
                    await _sessionService.RemoveSessionAsync(sessionId!);
                    await _csrfTokenService.InvalidateTokenAsync(sessionId!);
                    return Unauthorized("PlayFab session expired");
                }

                var newSessionToken = _tokenService.GenerateSessionToken(sessionId!, userId!);
                var newAccessToken = _tokenService.GenerateAccessToken(sessionId!, userId!);

                session.SessionToken = newSessionToken;
                session.AccessToken = newAccessToken;
                session.LastActive = DateTimeOffset.UtcNow;

                await _sessionService.SaveSessionAsync(session);

                // Generate new CSRF token
                var newCsrfToken = await _csrfTokenService.GenerateTokenAsync(sessionId!);

                Response.Cookies.Append("session_token", newSessionToken, GetSecureCookieOptions());
                Response.Cookies.Append("csrf_token", newCsrfToken, GetSecureCookieOptions());

                return Ok(new TokenResponse
                {
                    SessionToken = newSessionToken,
                    AccessToken = newAccessToken,
                    ExpiresIn = (int)(session.Expires - DateTimeOffset.UtcNow).TotalSeconds,
                    PlayFabId = session.PlayFabId,
                    DisplayName = session.UserId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing session");
                return StatusCode(500, "An error occurred while refreshing the session");
            }
        }

        [HttpPost("logout")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Logout()
        {
            try
            {
                _logger.LogInformation("Starting logout process...");
                var sessionToken = Request.Cookies["session_token"];
                if (!string.IsNullOrEmpty(sessionToken) && 
                    _tokenService.ValidateSessionToken(sessionToken, out var sessionId, out _))
                {
                    _logger.LogInformation("Removing session and CSRF token: {SessionId}", sessionId);
                    await _sessionService.RemoveSessionAsync(sessionId!);
                    await _csrfTokenService.InvalidateTokenAsync(sessionId!);
                }

                Response.Cookies.Delete("session_token", GetSecureCookieOptions());
                Response.Cookies.Delete("csrf_token", GetSecureCookieOptions());

                _logger.LogInformation("Logout completed successfully");
                return Ok(new { message = "Logged out successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during logout");
                return StatusCode(500, "An error occurred during logout");
            }
        }
    }
}
