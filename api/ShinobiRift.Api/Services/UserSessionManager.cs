using StackExchange.Redis;
using ShinobiRift.Api.Models;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace ShinobiRift.Api.Services
{
    public class UserSessionManager : IUserSessionManager
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly IDistributedCache _cache;
        private readonly ILogger<UserSessionManager> _logger;
        private const string ONLINE_USERS_KEY = "online_users";
        private const string USER_GROUPS_KEY = "user_groups";
        private const int ACTIVE_THRESHOLD_MINUTES = 5;
        private const int ONLINE_THRESHOLD_MINUTES = 15;

        public UserSessionManager(
            IConnectionMultiplexer redis,
            IDistributedCache cache,
            ILogger<UserSessionManager> logger)
        {
            _redis = redis;
            _cache = cache;
            _logger = logger;
        }

        public async Task HandleConnectionAsync(string userId, string connectionId)
        {
            try
            {
                var db = _redis.GetDatabase();
                var timestamp = DateTime.UtcNow.Ticks;

                // Store user session with connection ID
                var session = new UserSession
                {
                    UserId = userId,
                    ConnectionId = connectionId,
                    LastActive = DateTime.UtcNow,
                    ActivityState = UserActivityState.Active
                };

                var sessionJson = JsonSerializer.Serialize(session);
                await _cache.SetStringAsync(
                    $"session:{userId}",
                    sessionJson,
                    new DistributedCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(3)
                    }
                );

                // Add to sorted set of online users with timestamp as score
                await db.SortedSetAddAsync(ONLINE_USERS_KEY, userId, timestamp);

                _logger.LogInformation($"User {userId} connected with connection {connectionId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error handling connection for user {userId}");
                throw;
            }
        }

        public async Task HandleDisconnectionAsync(string userId, string connectionId)
        {
            try
            {
                var db = _redis.GetDatabase();
                
                // Update the session but don't remove it (allow for reconnection)
                var sessionJson = await _cache.GetStringAsync($"session:{userId}");
                if (sessionJson != null)
                {
                    var session = JsonSerializer.Deserialize<UserSession>(sessionJson);
                    if (session != null && session.ConnectionId == connectionId)
                    {
                        session.ConnectionId = null;
                        session.LastActive = DateTime.UtcNow;
                        session.ActivityState = UserActivityState.Online;
                        
                        await _cache.SetStringAsync(
                            $"session:{userId}",
                            JsonSerializer.Serialize(session),
                            new DistributedCacheEntryOptions
                            {
                                AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(3)
                            }
                        );
                    }
                }

                _logger.LogInformation($"User {userId} disconnected from connection {connectionId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error handling disconnection for user {userId}");
                throw;
            }
        }

        public async Task UpdateUserActivityAsync(string userId)
        {
            try
            {
                var db = _redis.GetDatabase();
                var timestamp = DateTime.UtcNow.Ticks;

                // Update timestamp in sorted set
                await db.SortedSetAddAsync(ONLINE_USERS_KEY, userId, timestamp);

                // Update session
                var sessionJson = await _cache.GetStringAsync($"session:{userId}");
                if (sessionJson != null)
                {
                    var session = JsonSerializer.Deserialize<UserSession>(sessionJson);
                    if (session != null)
                    {
                        session.LastActive = DateTime.UtcNow;
                        session.ActivityState = UserActivityState.Active;

                        await _cache.SetStringAsync(
                            $"session:{userId}",
                            JsonSerializer.Serialize(session),
                            new DistributedCacheEntryOptions
                            {
                                AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(3)
                            }
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating activity for user {userId}");
                throw;
            }
        }

        public async Task AddUserToGroupAsync(string userId, string groupName)
        {
            try
            {
                var db = _redis.GetDatabase();
                await db.SetAddAsync($"{USER_GROUPS_KEY}:{userId}", groupName);
                _logger.LogInformation($"Added user {userId} to group {groupName}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error adding user {userId} to group {groupName}");
                throw;
            }
        }

        public async Task RemoveUserFromGroupAsync(string userId, string groupName)
        {
            try
            {
                var db = _redis.GetDatabase();
                await db.SetRemoveAsync($"{USER_GROUPS_KEY}:{userId}", groupName);
                _logger.LogInformation($"Removed user {userId} from group {groupName}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error removing user {userId} from group {groupName}");
                throw;
            }
        }

        public async Task<IEnumerable<UserSession>> GetOnlineUsersAsync()
        {
            try
            {
                var db = _redis.GetDatabase();
                var now = DateTime.UtcNow;
                var activeThreshold = now.AddMinutes(-ACTIVE_THRESHOLD_MINUTES).Ticks;
                var onlineThreshold = now.AddMinutes(-ONLINE_THRESHOLD_MINUTES).Ticks;

                // Get all users active within the online threshold
                var onlineUsers = await db.SortedSetRangeByScoreAsync(
                    ONLINE_USERS_KEY,
                    onlineThreshold,
                    double.PositiveInfinity
                );

                var sessions = new List<UserSession>();
                foreach (var userId in onlineUsers)
                {
                    var sessionJson = await _cache.GetStringAsync($"session:{userId}");
                    if (sessionJson != null)
                    {
                        var session = JsonSerializer.Deserialize<UserSession>(sessionJson);
                        if (session != null)
                        {
                            sessions.Add(session);
                        }
                    }
                }

                return sessions;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting online users");
                throw;
            }
        }

        public async Task<UserActivityState> GetUserActivityStateAsync(string userId)
        {
            try
            {
                var db = _redis.GetDatabase();
                var score = await db.SortedSetScoreAsync(ONLINE_USERS_KEY, userId);
                
                if (!score.HasValue)
                    return UserActivityState.Offline;

                var timestamp = new DateTime((long)score.Value);
                var timeSinceLastActivity = DateTime.UtcNow - timestamp;

                if (timeSinceLastActivity.TotalMinutes <= ACTIVE_THRESHOLD_MINUTES)
                    return UserActivityState.Active;
                if (timeSinceLastActivity.TotalMinutes <= ONLINE_THRESHOLD_MINUTES)
                    return UserActivityState.Online;
                
                return UserActivityState.Offline;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting activity state for user {userId}");
                throw;
            }
        }
    }
}
