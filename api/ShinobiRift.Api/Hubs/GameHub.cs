using Microsoft.AspNetCore.SignalR;
using ShinobiRift.Api.Models;
using ShinobiRift.Api.Services;
using System.Threading.Tasks;

namespace ShinobiRift.Api.Hubs
{
    public class GameHub : Hub
    {
        private readonly IUserSessionManager _sessionManager;
        private readonly IPlayFabService _playFabService;
        private readonly ILogger<GameHub> _logger;

        public GameHub(
            IUserSessionManager sessionManager,
            IPlayFabService playFabService,
            ILogger<GameHub> logger)
        {
            _sessionManager = sessionManager;
            _playFabService = playFabService;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            try
            {
                var context = Context.GetHttpContext();
                if (context == null)
                {
                    _logger.LogError("HTTP context is null");
                    throw new HubException("HTTP context is required");
                }

                // Get auth from query string
                var userId = context.Request.Query["userId"].ToString();
                var sessionTicket = context.Request.Query["sessionToken"].ToString();

                _logger.LogInformation("Hub connection attempt - UserId: {UserId}, HasSessionTicket: {HasSessionTicket}, Query: {@Query}",
                    userId, 
                    !string.IsNullOrEmpty(sessionTicket),
                    context.Request.Query.ToDictionary(x => x.Key, x => x.Value.ToString()));

                if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(sessionTicket))
                {
                    _logger.LogWarning("Missing required authentication - UserId: {UserId}, HasSessionTicket: {HasSessionTicket}",
                        userId, !string.IsNullOrEmpty(sessionTicket));
                    throw new HubException("User ID and session ticket are required");
                }

                // Validate session ticket
                var isValidSession = await _playFabService.ValidateSessionTicketAsync(sessionTicket);
                if (!isValidSession)
                {
                    _logger.LogWarning("Invalid session ticket for user {UserId}", userId);
                    throw new HubException("Invalid session ticket");
                }

                await _sessionManager.HandleConnectionAsync(userId, Context.ConnectionId);
                await base.OnConnectedAsync();

                _logger.LogInformation("Hub connection successful for user {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in OnConnectedAsync");
                throw;
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            try
            {
                var context = Context.GetHttpContext();
                if (context != null)
                {
                    var userId = context.Request.Query["userId"].ToString();
                    if (!string.IsNullOrEmpty(userId))
                    {
                        _logger.LogInformation("Hub disconnection for user {UserId}", userId);
                        await _sessionManager.HandleDisconnectionAsync(userId, Context.ConnectionId);
                    }
                }

                await base.OnDisconnectedAsync(exception);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in OnDisconnectedAsync");
                throw;
            }
        }

        public async Task UpdateActivity()
        {
            try
            {
                var context = Context.GetHttpContext();
                if (context == null)
                {
                    throw new HubException("HTTP context is required");
                }

                var userId = context.Request.Query["userId"].ToString();
                if (string.IsNullOrEmpty(userId))
                {
                    throw new HubException("User ID is required");
                }

                await _sessionManager.UpdateUserActivityAsync(userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in UpdateActivity");
                throw;
            }
        }

        public async Task GetOnlineUsers()
        {
            try
            {
                var onlineUsers = await _sessionManager.GetOnlineUsersAsync();
                await Clients.Caller.SendAsync("OnlineUsers", onlineUsers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetOnlineUsers");
                throw;
            }
        }
    }
}
