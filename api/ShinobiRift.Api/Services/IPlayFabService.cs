namespace ShinobiRift.Api.Services
{
    public interface IPlayFabService
    {
        Task<bool> ValidateSessionTicketAsync(string sessionTicket);
        Task<string> GetPlayFabIdFromSessionTicketAsync(string sessionTicket);
        Task UpdatePlayerStatisticsAsync(string playFabId, string statisticName, int value);
        Task<bool> IsValidTitlePlayerAsync(string playFabId);
    }
}
