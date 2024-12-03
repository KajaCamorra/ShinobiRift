using Microsoft.AspNetCore.Mvc;
using ShinobiRift.Api.Models;
using ShinobiRift.Api.Services;
using PlayFab.ServerModels;

namespace ShinobiRift.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserSessionManager _sessionManager;
        private readonly IPlayFabService _playFabService;
        private readonly ILogger<UsersController> _logger;

        public UsersController(
            IUserSessionManager sessionManager,
            IPlayFabService playFabService,
            ILogger<UsersController> logger)
        {
            _sessionManager = sessionManager;
            _playFabService = playFabService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetUsers()
        {
            try
            {
                _logger.LogInformation("Getting users list");

                // Get all users from PlayFab
                var users = await _playFabService.GetAllPlayersAsync();
                _logger.LogInformation("Retrieved {Count} users from PlayFab", users.Count());

                var onlineUsers = await _sessionManager.GetOnlineUsersAsync();
                _logger.LogInformation("Retrieved {Count} online users from Redis", onlineUsers.Count());

                var onlineUsersDict = onlineUsers.ToDictionary(u => u.UserId);

                var result = users.Select(async user => {
                    var activityState = await _sessionManager.GetUserActivityStateAsync(user.PlayerId);
                    var isOnline = onlineUsersDict.TryGetValue(user.PlayerId, out var session);

                    _logger.LogInformation("User {UserId} status: {ActivityState}, IsOnline: {IsOnline}", 
                        user.PlayerId, activityState, isOnline);

                    return new {
                        UserId = user.PlayerId,
                        DisplayName = user.DisplayName ?? "Unknown Player",
                        Username = user.DisplayName ?? "Unknown Player",
                        AvatarUrl = string.Empty,
                        ActivityState = activityState,
                        LastActive = isOnline && session != null ? session.LastActive : DateTimeOffset.UtcNow.AddDays(-1),
                        IsOnline = isOnline
                    };
                });

                var finalResult = await Task.WhenAll(result);

                // If no users found, add a test user
                if (!finalResult.Any())
                {
                    _logger.LogInformation("No users found, adding test user");
                    finalResult = new[] {
                        new {
                            UserId = "TestUser1",
                            DisplayName = "Test User",
                            Username = "Test User",
                            AvatarUrl = string.Empty,
                            ActivityState = UserActivityState.Active,
                            LastActive = DateTimeOffset.UtcNow,
                            IsOnline = true
                        }
                    };
                }

                _logger.LogInformation("Returning {Count} users with activity states", finalResult.Length);
                return Ok(finalResult);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users");
                return StatusCode(500, "An error occurred while retrieving users");
            }
        }

        [HttpGet("online")]
        public async Task<ActionResult<IEnumerable<UserSession>>> GetOnlineUsers()
        {
            try
            {
                var users = await _sessionManager.GetOnlineUsersAsync();
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting online users");
                return StatusCode(500, "An error occurred while retrieving online users");
            }
        }

        [HttpGet("{userId}/activity-state")]
        public async Task<ActionResult<UserActivityState>> GetUserActivityState(string userId)
        {
            try
            {
                var state = await _sessionManager.GetUserActivityStateAsync(userId);
                return Ok(state);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user activity state for user {UserId}", userId);
                return StatusCode(500, "An error occurred while retrieving user activity state");
            }
        }

        [HttpPost("{userId}/update-activity")]
        public async Task<IActionResult> UpdateActivity(string userId)
        {
            try
            {
                await _sessionManager.UpdateUserActivityAsync(userId);
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating activity for user {UserId}", userId);
                return StatusCode(500, "An error occurred while updating user activity");
            }
        }
    }
}
