import { useState, useMemo } from 'react';
import { User, UserFilters, SortConfig, UseUsersResult } from '../app/(game)/users/types';

const DEFAULT_FILTERS: UserFilters = {
  search: '',
  status: 'all'
};

const DEFAULT_SORT: SortConfig = {
  key: 'displayName',
  direction: 'asc'
};

export const useUsers = (): UseUsersResult => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<UserFilters>(DEFAULT_FILTERS);
  const [sortConfig, setSortConfig] = useState<SortConfig>(DEFAULT_SORT);

  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(user => 
        user.displayName.toLowerCase().includes(searchLower) ||
        user.username.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status !== 'all') {
      result = result.filter(user => {
        const lastActiveThreshold = Date.now() - 5 * 60 * 1000; // 5 minutes
        switch (filters.status) {
          case 'online':
            return user.isOnline;
          case 'offline':
            return !user.isOnline;
          case 'active':
            return user.lastActive > lastActiveThreshold;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      // For boolean values (isOnline)
      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        return sortConfig.direction === 'asc'
          ? (aValue === bValue ? 0 : aValue ? -1 : 1)
          : (aValue === bValue ? 0 : aValue ? 1 : -1);
      }

      // For numbers and strings
      const modifier = sortConfig.direction === 'asc' ? 1 : -1;
      return aValue > bValue ? modifier : -modifier;
    });

    return result;
  }, [users, filters, sortConfig]);

  return {
    users: filteredAndSortedUsers,
    loading,
    error,
    filters,
    setFilters,
    sortConfig,
    setSortConfig,
    setUsers
  };
};
