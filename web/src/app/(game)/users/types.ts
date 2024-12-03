export enum UserActivityState {
  Active = 'Active',
  Online = 'Online',
  Offline = 'Offline'
}

export interface User {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  profileUrl: string;
  isOnline: boolean;
  activityState: UserActivityState;
  lastActive: number;
}

export interface UserFilters {
  search: string;
  status: 'all' | 'active' | 'online' | 'offline';
}

export interface SortConfig {
  key: keyof User;
  direction: 'asc' | 'desc';
}

export interface UseUsersResult {
  users: User[];
  loading: boolean;
  error: Error | null;
  filters: UserFilters;
  setFilters: (filters: UserFilters) => void;
  sortConfig: SortConfig;
  setSortConfig: (config: SortConfig) => void;
}

export const getActivityStateColor = (state: UserActivityState): string => {
  switch (state) {
    case UserActivityState.Active:
      return "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"; // Bright green with glow
    case UserActivityState.Online:
      return "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"; // Neon teal with glow
    case UserActivityState.Offline:
    default:
      return "bg-gray-400"; // Gray for offline
  }
};

export const getActivityStateText = (state: UserActivityState, lastActive: number): string => {
  const now = Date.now();
  const timeSinceLastActive = now - lastActive;
  const minutes = Math.floor(timeSinceLastActive / 60000);

  switch (state) {
    case UserActivityState.Active:
      return "Active now";
    case UserActivityState.Online:
      return `Online (${minutes} min ago)`;
    case UserActivityState.Offline:
      if (minutes < 60) {
        return `Offline (${minutes} min ago)`;
      } else {
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
          return `Offline (${hours}h ago)`;
        } else {
          const days = Math.floor(hours / 24);
          return `Offline (${days}d ago)`;
        }
      }
  }
};
