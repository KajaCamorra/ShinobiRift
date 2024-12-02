using PlayFab;
using PlayFab.ServerModels;
using PFSettings = PlayFab.PlayFabSettings;

namespace ShinobiRift.Api.Services
{
    public class PlayFabService : IPlayFabService
    {
        private readonly ILogger<PlayFabService> _logger;
        private readonly Configuration.AppSettings _settings;

        public PlayFabService(
            ILogger<PlayFabService> logger,
            Configuration.AppSettings settings)
        {
            _logger = logger;
            _settings = settings;

            PFSettings.staticSettings.TitleId = settings.PlayFab.TitleId;
            PFSettings.staticSettings.DeveloperSecretKey = settings.PlayFab.DeveloperSecretKey;
        }

        public async Task<bool> ValidateSessionTicketAsync(string sessionTicket)
        {
            try
            {
                var request = new AuthenticateSessionTicketRequest
                {
                    SessionTicket = sessionTicket
                };

                var result = await PlayFabServerAPI.AuthenticateSessionTicketAsync(request);
                return result.Result.IsSessionTicketExpired != true;
            }
            catch (PlayFabException ex)
            {
                _logger.LogError(ex, "Error validating PlayFab session ticket");
                return false;
            }
        }

        public async Task<string> GetPlayFabIdFromSessionTicketAsync(string sessionTicket)
        {
            try
            {
                var request = new AuthenticateSessionTicketRequest
                {
                    SessionTicket = sessionTicket
                };

                var result = await PlayFabServerAPI.AuthenticateSessionTicketAsync(request);
                return result.Result.UserInfo.PlayFabId;
            }
            catch (PlayFabException ex)
            {
                _logger.LogError(ex, "Error getting PlayFab ID from session ticket");
                throw;
            }
        }

        public async Task UpdatePlayerStatisticsAsync(string playFabId, string statisticName, int value)
        {
            try
            {
                var request = new UpdatePlayerStatisticsRequest
                {
                    PlayFabId = playFabId,
                    Statistics = new List<StatisticUpdate>
                    {
                        new StatisticUpdate
                        {
                            StatisticName = statisticName,
                            Value = value
                        }
                    }
                };

                await PlayFabServerAPI.UpdatePlayerStatisticsAsync(request);
            }
            catch (PlayFabException ex)
            {
                _logger.LogError(ex, "Error updating player statistics for PlayFab ID: {PlayFabId}", playFabId);
                throw;
            }
        }

        public async Task<bool> IsValidTitlePlayerAsync(string playFabId)
        {
            try
            {
                var request = new GetUserAccountInfoRequest
                {
                    PlayFabId = playFabId
                };

                var result = await PlayFabServerAPI.GetUserAccountInfoAsync(request);
                return result.Result.UserInfo.TitleInfo.TitlePlayerAccount != null;
            }
            catch (PlayFabException ex)
            {
                _logger.LogError(ex, "Error validating title player for PlayFab ID: {PlayFabId}", playFabId);
                return false;
            }
        }
    }
}
