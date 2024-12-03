using PlayFab;
using PlayFab.ServerModels;
using ShinobiRift.Api.Configuration;
using ShinobiRift.Api.Models;

namespace ShinobiRift.Api.Services
{
    public interface IPlayFabService
    {
        Task<PlayFabLoginResult> LoginWithDiscordAsync(DiscordUser discordUser);
        Task<bool> ValidateSessionTicketAsync(string sessionTicket);
        Task<GetPlayerCombinedInfoResult> GetPlayerInfoAsync(string playFabId);
        Task<IEnumerable<PlayerProfile>> GetAllPlayersAsync();
        Task<AuthenticateSessionTicketResult> GetUserInfoFromSessionTicketAsync(string sessionTicket);
    }

    public class PlayFabService : IPlayFabService
    {
        private readonly string _titleId;
        private readonly string _developerSecretKey;
        private readonly ILogger<PlayFabService> _logger;

        public PlayFabService(AppSettings appSettings, ILogger<PlayFabService> logger)
        {
            _titleId = appSettings.PlayFab.TitleId;
            _developerSecretKey = appSettings.PlayFab.DeveloperSecretKey;
            _logger = logger;

            _logger.LogInformation("Initializing PlayFab with TitleId: {TitleId}", _titleId);
            PlayFab.PlayFabSettings.staticSettings.TitleId = _titleId;
            PlayFab.PlayFabSettings.staticSettings.DeveloperSecretKey = _developerSecretKey;
        }

        public async Task<PlayFabLoginResult> LoginWithDiscordAsync(DiscordUser discordUser)
        {
            try
            {
                _logger.LogInformation("Starting PlayFab login for Discord user {DiscordId}", discordUser.Id);

                // First, try to get the user by their Discord ID
                var existingPlayFabId = await GetPlayFabIdFromDiscordIdAsync(discordUser.Id);
                
                if (existingPlayFabId != null)
                {
                    _logger.LogInformation("Found existing user with Discord ID {DiscordId}, PlayFabId: {PlayFabId}", 
                        discordUser.Id, existingPlayFabId);
                    return await LoginExistingUserAsync(discordUser.Id, existingPlayFabId);
                }

                // If user doesn't exist, create a new account
                _logger.LogInformation("No existing user found, creating new user for Discord ID {DiscordId}", discordUser.Id);
                return await CreateUserWithDiscordAsync(discordUser);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during PlayFab login for Discord user {DiscordId}", discordUser.Id);
                throw;
            }
        }

        private async Task<string?> GetPlayFabIdFromDiscordIdAsync(string discordId)
        {
            try
            {
                _logger.LogInformation("Looking up PlayFab ID for Discord ID {DiscordId}", discordId);

                var request = new GetPlayFabIDsFromGenericIDsRequest
                {
                    GenericIDs = new List<GenericServiceId>
                    {
                        new GenericServiceId
                        {
                            ServiceName = "Discord",
                            UserId = discordId
                        }
                    }
                };

                var response = await PlayFabServerAPI.GetPlayFabIDsFromGenericIDsAsync(request);
                
                if (response?.Result?.Data == null || response.Result.Data.Count == 0)
                {
                    _logger.LogInformation("No existing PlayFab account found for Discord ID {DiscordId}", discordId);
                    return null;
                }

                var playFabId = response.Result.Data[0].PlayFabId;
                _logger.LogInformation("Found PlayFab ID {PlayFabId} for Discord ID {DiscordId}", playFabId, discordId);
                return playFabId;
            }
            catch (PlayFabException ex)
            {
                _logger.LogError(ex, "PlayFab error getting user by Discord ID {DiscordId}. Error: {Error}", 
                    discordId, ex.Message);
                throw;
            }
        }

        private async Task<PlayFabLoginResult> LoginExistingUserAsync(string discordId, string playFabId)
        {
            try
            {
                _logger.LogInformation("Logging in existing user with PlayFabId: {PlayFabId}", playFabId);

                // Login with server custom ID
                var loginRequest = new LoginWithServerCustomIdRequest
                {
                    CreateAccount = false,
                    ServerCustomId = $"discord_{discordId}",
                    InfoRequestParameters = new GetPlayerCombinedInfoRequestParams
                    {
                        GetPlayerProfile = true,
                        GetUserData = true
                    }
                };

                var loginResponse = await PlayFabServerAPI.LoginWithServerCustomIdAsync(loginRequest);

                if (loginResponse?.Result == null)
                {
                    _logger.LogError("PlayFab login response or result is null for PlayFabId {PlayFabId}", playFabId);
                    throw new Exception("PlayFab login response is null");
                }

                return new PlayFabLoginResult
                {
                    PlayFabId = playFabId,
                    SessionTicket = "server_session"
                };
            }
            catch (PlayFabException ex)
            {
                _logger.LogError(ex, "PlayFab error logging in existing user {PlayFabId}. Error: {Error}", 
                    playFabId, ex.Message);
                throw;
            }
        }

        private async Task<PlayFabLoginResult> CreateUserWithDiscordAsync(DiscordUser discordUser)
        {
            try
            {
                _logger.LogInformation("Creating new PlayFab account for Discord user {DiscordId}", discordUser.Id);

                // Create account with server custom ID
                var loginRequest = new LoginWithServerCustomIdRequest
                {
                    CreateAccount = true,
                    ServerCustomId = $"discord_{discordUser.Id}",
                    InfoRequestParameters = new GetPlayerCombinedInfoRequestParams
                    {
                        GetPlayerProfile = true,
                        GetUserData = true
                    }
                };

                _logger.LogInformation("Sending login request to PlayFab for new user");
                var loginResponse = await PlayFabServerAPI.LoginWithServerCustomIdAsync(loginRequest);
                
                if (loginResponse?.Result == null)
                {
                    _logger.LogError("PlayFab login response or result is null for new Discord user {DiscordId}", discordUser.Id);
                    throw new Exception("PlayFab login response is null");
                }

                var playFabId = loginResponse.Result.PlayFabId;
                _logger.LogInformation("Created new PlayFab account {PlayFabId} for Discord user {DiscordId}", 
                    playFabId, discordUser.Id);

                // Link Discord ID
                var linkRequest = new AddGenericIDRequest
                {
                    PlayFabId = playFabId,
                    GenericId = new GenericServiceId
                    {
                        ServiceName = "Discord",
                        UserId = discordUser.Id
                    }
                };

                _logger.LogInformation("Linking Discord ID {DiscordId} to PlayFab ID {PlayFabId}", 
                    discordUser.Id, playFabId);
                await PlayFabServerAPI.AddGenericIDAsync(linkRequest);

                // Update player display name and other info
                var updateRequest = new UpdateUserDataRequest
                {
                    PlayFabId = playFabId,
                    Data = new Dictionary<string, string>
                    {
                        { "DiscordId", discordUser.Id },
                        { "DiscordUsername", discordUser.Username },
                        { "DiscordEmail", discordUser.Email }
                    }
                };

                _logger.LogInformation("Updating user data for PlayFab ID {PlayFabId}", playFabId);
                await PlayFabServerAPI.UpdateUserDataAsync(updateRequest);

                return new PlayFabLoginResult
                {
                    PlayFabId = playFabId,
                    SessionTicket = "server_session"
                };
            }
            catch (PlayFabException ex)
            {
                _logger.LogError(ex, "PlayFab error creating user for Discord ID {DiscordId}. Error: {Error}", 
                    discordUser.Id, ex.Message);
                throw;
            }
        }

        public async Task<bool> ValidateSessionTicketAsync(string sessionTicket)
        {
            try
            {
                // For server-side sessions, we don't need to validate
                if (sessionTicket == "server_session")
                    return true;

                var request = new AuthenticateSessionTicketRequest
                {
                    SessionTicket = sessionTicket
                };

                var response = await PlayFabServerAPI.AuthenticateSessionTicketAsync(request);
                return response?.Result?.IsSessionTicketExpired != true;
            }
            catch (PlayFabException ex)
            {
                _logger.LogError(ex, "PlayFab error validating session ticket");
                return false;
            }
        }

        public async Task<AuthenticateSessionTicketResult> GetUserInfoFromSessionTicketAsync(string sessionTicket)
        {
            try
            {
                var request = new AuthenticateSessionTicketRequest
                {
                    SessionTicket = sessionTicket
                };

                var response = await PlayFabServerAPI.AuthenticateSessionTicketAsync(request);
                
                if (response?.Result == null)
                {
                    throw new Exception("PlayFab authentication response is null");
                }

                return response.Result;
            }
            catch (PlayFabException ex)
            {
                _logger.LogError(ex, "PlayFab error getting user info from session ticket");
                throw;
            }
        }

        public async Task<GetPlayerCombinedInfoResult> GetPlayerInfoAsync(string playFabId)
        {
            try
            {
                var request = new GetPlayerCombinedInfoRequest
                {
                    PlayFabId = playFabId,
                    InfoRequestParameters = new GetPlayerCombinedInfoRequestParams
                    {
                        GetPlayerProfile = true,
                        GetUserData = true,
                        GetUserReadOnlyData = true
                    }
                };

                var response = await PlayFabServerAPI.GetPlayerCombinedInfoAsync(request);
                
                if (response?.Result == null)
                {
                    throw new Exception("PlayFab player info response is null");
                }

                return response.Result;
            }
            catch (PlayFabException ex)
            {
                _logger.LogError(ex, "PlayFab error getting player info for PlayFab ID {PlayFabId}", playFabId);
                throw;
            }
        }

        public async Task<IEnumerable<PlayerProfile>> GetAllPlayersAsync()
        {
            try
            {
                var request = new GetPlayersInSegmentRequest
                {
                    SegmentId = "AllPlayers",
                    MaxBatchSize = 100 // Adjust based on your needs
                };

                var response = await PlayFabServerAPI.GetPlayersInSegmentAsync(request);
                
                if (response?.Result?.PlayerProfiles == null)
                {
                    throw new Exception("PlayFab player profiles response is null");
                }

                return response.Result.PlayerProfiles;
            }
            catch (PlayFabException ex)
            {
                _logger.LogError(ex, "PlayFab error getting all players");
                throw;
            }
        }
    }

    public class PlayFabLoginResult
    {
        public string PlayFabId { get; set; } = string.Empty;
        public string SessionTicket { get; set; } = string.Empty;
    }
}
