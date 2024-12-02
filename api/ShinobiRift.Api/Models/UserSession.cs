using System;

namespace ShinobiRift.Api.Models
{
    public class UserSession
    {
        public string UserId { get; set; } = string.Empty;
        public string PlayFabSessionTicket { get; set; } = string.Empty;
        public DateTime LastActive { get; set; }
        public string? ConnectionId { get; set; }
        public UserActivityState ActivityState { get; set; }
        public Dictionary<string, object> Preferences { get; set; } = new();

        public UserSession()
        {
            LastActive = DateTime.UtcNow;
            ActivityState = UserActivityState.Active;
        }
    }

    public enum UserActivityState
    {
        Active,     // Last activity < 5 minutes ago
        Online,     // Last activity between 5-15 minutes ago
        Offline     // Last activity > 15 minutes ago
    }
}
