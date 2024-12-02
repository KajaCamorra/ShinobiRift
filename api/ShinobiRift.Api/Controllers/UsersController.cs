using Microsoft.AspNetCore.Mvc;
using ShinobiRift.Api.Models;
using ShinobiRift.Api.Services;

namespace ShinobiRift.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserSessionManager _sessionManager;
        private readonly ILogger<UsersController> _logger;

        public UsersController(
            IUserSessionManager sessionManager,
            ILogger<UsersController> logger)
        {
            _sessionManager = sessionManager;
            _logger = logger;
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
