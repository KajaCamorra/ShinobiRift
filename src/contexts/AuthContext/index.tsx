// src/contexts/AuthContext/index.tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PlayFabClient } from 'playfab-sdk';
import { AuthContextType, AuthUser } from './types';
import { useToast } from '@/contexts/ToastContext';

if (!PlayFabClient.IsClientLoggedIn() && process.env.NEXT_PUBLIC_PLAYFAB_TITLE_ID) {
  PlayFabClient.settings.titleId = process.env.NEXT_PUBLIC_PLAYFAB_TITLE_ID;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { showToast } = useToast();

  const clearSession = useCallback(() => {
    localStorage.removeItem('playfab_session');
    document.cookie = 'playfab_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setUser(null);
  }, []);

  const login = useCallback(async (loginResult: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const sessionTicket = loginResult.data.SessionTicket;
      localStorage.setItem('playfab_session', sessionTicket);
      
      const user: AuthUser = {
        id: loginResult.data.PlayFabId,
        displayName: loginResult.data.InfoResultPayload?.PlayerProfile?.DisplayName || 'Player',
        playfabId: loginResult.data.PlayFabId
      };

      setUser(user);
      showToast('Successfully logged in!', 'success');
      window.location.href = '/game';
    } catch (err) {
      setError(err as Error);
      showToast('Login failed', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const logout = useCallback(async () => {
    clearSession();
    showToast('Successfully logged out', 'success');
    window.location.href = '/';
  }, [clearSession, showToast]);

  // Single session check on mount
  useEffect(() => {
    const checkSession = async () => {
      const sessionTicket = localStorage.getItem('playfab_session');
      
      if (!sessionTicket) {
        clearSession();
        setIsLoading(false);
        return;
      }

      try {
        const result = await new Promise((resolve, reject) => {
          PlayFabClient.GetPlayerProfile({}, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
        });

        // @ts-ignore
        if (result.data) {
          setUser({
            // @ts-ignore
            id: result.data.PlayerProfile.PlayerId,
            // @ts-ignore
            displayName: result.data.PlayerProfile.DisplayName || 'Player',
            // @ts-ignore
            playfabId: result.data.PlayerProfile.PlayerId
          });
        } else {
          clearSession();
        }
      } catch (error) {
        console.error('Session check failed:', error);
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}