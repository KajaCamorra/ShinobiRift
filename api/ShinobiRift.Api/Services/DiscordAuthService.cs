using System.Net.Http.Headers;
using System.Text.Json;
using ShinobiRift.Api.Configuration;
using ShinobiRift.Api.Models;

namespace ShinobiRift.Api.Services
{
    public interface IDiscordAuthService
    {
        Task<DiscordUser> GetUserInfoAsync(string code);
    }

    public class DiscordAuthService : IDiscordAuthService
    {
        private readonly HttpClient _httpClient;
        private readonly DiscordSettings _settings;
        private readonly ILogger<DiscordAuthService> _logger;

        public DiscordAuthService(
            HttpClient httpClient,
            AppSettings appSettings,
            ILogger<DiscordAuthService> logger)
        {
            _httpClient = httpClient;
            _settings = appSettings.Discord;
            _logger = logger;
        }

        public async Task<DiscordUser> GetUserInfoAsync(string code)
        {
            try
            {
                _logger.LogInformation("Starting Discord OAuth token exchange...");
                _logger.LogDebug("Using Discord settings: ClientId: {ClientId}, RedirectUri: {RedirectUri}", 
                    _settings.ClientId, _settings.RedirectUri);

                // Exchange code for access token
                var tokenResponse = await ExchangeCodeAsync(code);
                var tokenData = JsonDocument.Parse(tokenResponse);
                var accessToken = tokenData.RootElement.GetProperty("access_token").GetString();

                if (string.IsNullOrEmpty(accessToken))
                {
                    _logger.LogError("Failed to get access token from Discord response");
                    throw new Exception("Failed to get access token from Discord");
                }

                _logger.LogInformation("Successfully obtained Discord access token");

                // Get user info
                _logger.LogInformation("Fetching Discord user info...");
                _httpClient.DefaultRequestHeaders.Authorization = 
                    new AuthenticationHeaderValue("Bearer", accessToken);

                var response = await _httpClient.GetAsync("https://discord.com/api/users/@me");
                var content = await response.Content.ReadAsStringAsync();

                _logger.LogDebug("Discord API response: {StatusCode}", response.StatusCode);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Discord API error: {StatusCode} - {Content}", 
                        response.StatusCode, content);
                    throw new Exception("Failed to get user info from Discord");
                }

                var user = JsonSerializer.Deserialize<DiscordUser>(content);

                if (user == null)
                {
                    _logger.LogError("Failed to deserialize Discord user info: {Content}", content);
                    throw new Exception("Failed to deserialize Discord user info");
                }

                _logger.LogInformation("Successfully retrieved Discord user info for user {UserId}", user.Id);
                return user;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting Discord user info");
                throw;
            }
        }

        private async Task<string> ExchangeCodeAsync(string code)
        {
            try
            {
                _logger.LogInformation("Exchanging OAuth code for access token...");

                var parameters = new Dictionary<string, string>
                {
                    { "client_id", _settings.ClientId },
                    { "client_secret", _settings.ClientSecret },
                    { "grant_type", "authorization_code" },
                    { "code", code },
                    { "redirect_uri", _settings.RedirectUri }
                };

                var response = await _httpClient.PostAsync(
                    "https://discord.com/api/oauth2/token",
                    new FormUrlEncodedContent(parameters));

                var content = await response.Content.ReadAsStringAsync();

                _logger.LogDebug("Discord token exchange response: {StatusCode}", response.StatusCode);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Discord token exchange error: {StatusCode} - {Content}", 
                        response.StatusCode, content);
                    throw new Exception($"Discord token exchange failed: {content}");
                }

                _logger.LogInformation("Successfully exchanged OAuth code for access token");
                return content;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exchanging OAuth code");
                throw;
            }
        }
    }
}
