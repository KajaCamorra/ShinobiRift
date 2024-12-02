using ShinobiRift.Api.Models;

namespace ShinobiRift.Api.Services
{
    public interface IUserSessionManager
    {
        Task HandleConnectionAsync(string userId, string connectionId);
        Task HandleDisconnectionAsync(string userId, string connectionId);
        Task UpdateUserActivityAsync(string userId);
        Task AddUserToGroupAsync(string userId, string groupName);
        Task RemoveUserFromGroupAsync(string userId, string groupName);
        Task<IEnumerable<UserSession>> GetOnlineUsersAsync();
        Task<UserActivityState> GetUserActivityStateAsync(string userId);
    }
}
