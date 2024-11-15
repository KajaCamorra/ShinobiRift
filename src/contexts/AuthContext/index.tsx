"use client";  // Add this at the top to mark as client component

import { createContext, useContext, useState, useCallback } from 'react';
import { PlayFabClient } from 'playfab-sdk';
import { AuthContextType, AuthUser } from './types';

// Initialize PlayFab
if (!PlayFabClient.IsClientLoggedIn() && process.env.NEXT_PUBLIC_PLAYFAB_TITLE_ID) {
  PlayFabClient.settings.titleId = process.env.NEXT_PUBLIC_PLAYFAB_TITLE_ID;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const login = useCallback(async (loginResult: any) => {
    setIsLoading(true);
    setError(null);

    try {
      // Store PlayFab session ticket
      const sessionTicket = loginResult.data.SessionTicket;
      localStorage.setItem('playfab_session', sessionTicket);

      // Create user object
      const user: AuthUser = {
        id: loginResult.data.PlayFabId,
        displayName: loginResult.data.InfoResultPayload?.PlayerProfile?.DisplayName || 'Player',
        playfabId: loginResult.data.PlayFabId
      };

      setUser(user);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Authentication failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      localStorage.removeItem('playfab_session');
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Logout failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
