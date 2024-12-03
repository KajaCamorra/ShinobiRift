import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

interface UseSharedSessionOptions {
  onRefreshNeeded?: () => Promise<void>;
}

interface SessionState {
  sessionToken: string | null;
  accessToken: string | null;
  expiresAt: number | null;
}

interface SessionMessage {
  type: 'UPDATE_SESSION' | 'LOGOUT' | 'REQUEST_REFRESH';
  payload?: SessionState;
}

export function useSharedSession(options: UseSharedSessionOptions = {}) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const { user, login, logout } = useAuth();

  const initializeChannel = useCallback(() => {
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('BroadcastChannel is not supported in this browser');
      return;
    }

    try {
      channelRef.current = new BroadcastChannel('session-sync');

      channelRef.current.onmessage = (event: MessageEvent<SessionMessage>) => {
        const { type, payload } = event.data;

        switch (type) {
          case 'UPDATE_SESSION':
            if (payload) {
              // Only update if the session state is different
              if (payload.sessionToken !== user?.sessionToken) {
                if (payload.sessionToken && payload.accessToken) {
                  login({
                    sessionToken: payload.sessionToken,
                    accessToken: payload.accessToken,
                    expiresIn: payload.expiresAt ? Math.floor((payload.expiresAt - Date.now()) / 1000) : 0,
                    playfabId: user?.playfabId || '',
                    displayName: user?.displayName || ''
                  });
                } else {
                  logout();
                }
              }
            }
            break;

          case 'LOGOUT':
            logout();
            break;

          case 'REQUEST_REFRESH':
            if (options.onRefreshNeeded) {
              options.onRefreshNeeded();
            }
            break;
        }
      };

      // Send initial session state
      if (user) {
        channelRef.current.postMessage({
          type: 'UPDATE_SESSION',
          payload: {
            sessionToken: user.sessionToken,
            accessToken: user.accessToken,
            expiresAt: Date.now() + 3 * 24 * 60 * 60 * 1000 // 3 days
          }
        });
      }

      // Handle page unload
      const handleUnload = () => {
        channelRef.current?.close();
      };

      window.addEventListener('beforeunload', handleUnload);

      return () => {
        window.removeEventListener('beforeunload', handleUnload);
      };
    } catch (error) {
      console.error('Error initializing broadcast channel:', error);
    }
  }, [user, login, logout, options.onRefreshNeeded]);

  useEffect(() => {
    const cleanup = initializeChannel();
    return () => {
      cleanup?.();
      channelRef.current?.close();
    };
  }, [initializeChannel]);

  const updateSession = useCallback((sessionToken: string, accessToken: string, expiresIn: number) => {
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'UPDATE_SESSION',
        payload: {
          sessionToken,
          accessToken,
          expiresAt: Date.now() + expiresIn * 1000
        }
      });
    }
  }, []);

  const clearSession = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'LOGOUT' });
    }
  }, []);

  return {
    updateSession,
    clearSession
  };
}
