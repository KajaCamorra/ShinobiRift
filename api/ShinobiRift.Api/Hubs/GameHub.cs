using Microsoft.AspNetCore.SignalR;
using ShinobiRift.Api.Models;
using ShinobiRift.Api.Services;
using System.Threading.Tasks;

namespace ShinobiRift.Api.Hubs
{
    public class GameHub : Hub
    {
        private readonly IUserSessionManager _sessionManager;
        private readonly ILogger<GameHub> _logger;

        public GameHub(IUserSessionManager sessionManager, ILogger<GameHub> logger)
        {
            _sessionManager = sessionManager;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.GetHttpContext()?.Request.Headers["X-User-Id"].ToString();
            if (string.IsNullOrEmpty(userId))
            {
                throw new HubException("User ID is required");
            }

            await _sessionManager.HandleConnectionAsync(userId, Context.ConnectionId);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.GetHttpContext()?.Request.Headers["X-User-Id"].ToString();
            if (!string.IsNullOrEmpty(userId))
            {
                await _sessionManager.HandleDisconnectionAsync(userId, Context.ConnectionId);
            }

            await base.OnDisconnectedAsync(exception);
        }

        public async Task UpdateActivity(string userId)
        {
            await _sessionManager.UpdateUserActivityAsync(userId);
        }

        public async Task JoinGroup(string groupName)
        {
            var userId = Context.GetHttpContext()?.Request.Headers["X-User-Id"].ToString();
            if (string.IsNullOrEmpty(userId))
            {
                throw new HubException("User ID is required");
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            await _sessionManager.AddUserToGroupAsync(userId, groupName);
        }

        public async Task LeaveGroup(string groupName)
        {
            var userId = Context.GetHttpContext()?.Request.Headers["X-User-Id"].ToString();
            if (string.IsNullOrEmpty(userId))
            {
                throw new HubException("User ID is required");
            }

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
            await _sessionManager.RemoveUserFromGroupAsync(userId, groupName);
        }

        public async Task SendToGroup(string groupName, string message)
        {
            var userId = Context.GetHttpContext()?.Request.Headers["X-User-Id"].ToString();
            if (string.IsNullOrEmpty(userId))
            {
                throw new HubException("User ID is required");
            }

            await Clients.Group(groupName).SendAsync("ReceiveMessage", userId, message);
            await _sessionManager.UpdateUserActivityAsync(userId);
        }

        public async Task GetOnlineUsers()
        {
            var onlineUsers = await _sessionManager.GetOnlineUsersAsync();
            await Clients.Caller.SendAsync("OnlineUsers", onlineUsers);
        }
    }
}
