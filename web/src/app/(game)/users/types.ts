export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastActive: number;
  profileUrl: string;
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
  setUsers: (users: User[]) => void;
}

export interface FilterPanelProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
}
