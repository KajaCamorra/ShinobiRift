import { useState, useEffect, useMemo } from 'react';
import { User, UserFilters, SortConfig, UseUsersResult, UserActivityState } from '../app/(game)/users/types';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useAuth } from '@/hooks/useAuth';

const DEFAULT_FILTERS: UserFilters = {
  search: '',
  status: 'all'
};

const DEFAULT_SORT: SortConfig = {
  key: 'displayName',
  direction: 'asc'
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5253';

export const useUsers = (): UseUsersResult => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<UserFilters>(DEFAULT_FILTERS);
  const [sortConfig, setSortConfig] = useState<SortConfig>(DEFAULT_SORT);
  const { user: currentUser, loading: authLoading } = useAuth();

  // Fetch initial user list
  useEffect(() => {
    const fetchUsers = async () => {
      if (authLoading || !currentUser?.id || !currentUser?.sessionTicket) {
        return;
      }

      try {
        console.log('Fetching users with auth:', {
          userId: currentUser.id,
          hasSessionTicket: !!currentUser.sessionTicket
        });

        const response = await fetch(`${API_URL}/api/users`, {
          headers: {
            'X-User-Id': currentUser.id,
            'X-Session-Token': currentUser.sessionTicket,
            'Accept': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch users:', {
            status: response.status,
            statusText: response.statusText,
            errorText
          });
          throw new Error(`Failed to fetch users: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Received users data:', data);

        const mappedUsers = data.map((user: any) => ({
          id: user.userId,
          displayName: user.displayName || 'Unknown Player',
          username: user.username || user.displayName || 'Unknown Player',
          avatarUrl: user.avatarUrl || '',
          profileUrl: `/users/${user.userId}`,
          isOnline: user.activityState !== UserActivityState.Offline,
          activityState: user.activityState || UserActivityState.Offline,
          lastActive: user.lastActive ? new Date(user.lastActive).getTime() : Date.now()
        }));

        console.log('Mapped users:', mappedUsers);
        setUsers(mappedUsers);

        // Only after successfully fetching users, try to connect to SignalR
        const connection = new HubConnectionBuilder()
          .withUrl(`${API_URL}/hubs/game?userId=${currentUser.id}&sessionToken=${currentUser.sessionTicket}`)
          .configureLogging(LogLevel.Debug)
          .withAutomaticReconnect()
          .build();

        connection.onclose(error => {
          console.log('SignalR Connection closed:', error);
        });

        connection.onreconnecting(error => {
          console.log('SignalR Reconnecting:', error);
        });

        connection.onreconnected(connectionId => {
          console.log('SignalR Reconnected:', connectionId);
        });

        try {
          await connection.start();
          console.log('SignalR Connected');

          // Get initial online users
          await connection.invoke('GetOnlineUsers');

          // Set up event handlers
          connection.on('OnlineUsers', (onlineUsers: any[]) => {
            console.log('Received online users:', onlineUsers);
            setUsers(prevUsers => {
              const updatedUsers = [...prevUsers];
              onlineUsers.forEach(onlineUser => {
                const index = updatedUsers.findIndex(u => u.id === onlineUser.userId);
                if (index !== -1) {
                  updatedUsers[index] = {
                    ...updatedUsers[index],
                    isOnline: true,
                    activityState: onlineUser.activityState,
                    lastActive: new Date(onlineUser.lastActive).getTime()
                  };
                }
              });
              return updatedUsers;
            });
          });

          connection.on('UserActivityUpdated', (userId: string, activityState: UserActivityState) => {
            console.log('User activity updated:', { userId, activityState });
            setUsers(prevUsers => 
              prevUsers.map(user => 
                user.id === userId 
                  ? {
                      ...user,
                      isOnline: activityState !== UserActivityState.Offline,
                      activityState,
                      lastActive: Date.now()
                    }
                  : user
              )
            );
          });

          return () => {
            connection.stop();
          };
        } catch (err) {
          console.error('SignalR Connection Error:', err);
          // Don't set error state for SignalR connection issues
          // Just log it and continue - the app can still function without real-time updates
        }

      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch users'));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser?.id, currentUser?.sessionTicket, authLoading]);

  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(user => 
        user.displayName.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status !== 'all') {
      result = result.filter(user => {
        switch (filters.status) {
          case 'active':
            return user.activityState === UserActivityState.Active;
          case 'online':
            return user.activityState === UserActivityState.Online;
          case 'offline':
            return user.activityState === UserActivityState.Offline;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        return sortConfig.direction === 'asc'
          ? (aValue === bValue ? 0 : aValue ? -1 : 1)
          : (aValue === bValue ? 0 : aValue ? 1 : -1);
      }

      const modifier = sortConfig.direction === 'asc' ? 1 : -1;
      return aValue > bValue ? modifier : -modifier;
    });

    return result;
  }, [users, filters, sortConfig]);

  return {
    users: filteredAndSortedUsers,
    loading: loading || authLoading,
    error,
    filters,
    setFilters,
    sortConfig,
    setSortConfig
  };
};
