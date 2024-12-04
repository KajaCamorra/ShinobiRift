"use client";

import React, { createContext, useCallback, useEffect, useState } from 'react';
import { AuthContextType, AuthUser, LoginResult, CsrfValidationError } from './types';
import { useSharedSession } from '../../hooks/useSharedSession';
import { useActivityTracking } from '../../hooks/useActivityTracking';

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  refreshTokens: async () => {},
});

const USER_STORAGE_KEY = 'auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { updateSession, clearSession } = useSharedSession({
    onRefreshNeeded: async () => {
      try {
        await refreshTokens();
      } catch (err) {
        console.error('Failed to refresh tokens:', err);
        await logout();
      }
    }
  });

  // Initialize activity tracking
  useActivityTracking({
    updateInterval: 5 * 60 * 1000, // 5 minutes
    inactivityThreshold: 15 * 60 * 1000, // 15 minutes
  });

  // Load user from storage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log('Loaded stored user:', parsedUser);
        setUser(parsedUser);
        updateSession(parsedUser.sessionToken, parsedUser.accessToken, 3 * 24 * 60 * 60); // 3 days
      } else {
        console.log('No stored user found');
      }
    } catch (err) {
      console.error('Failed to parse stored user:', err);
      localStorage.removeItem(USER_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, [updateSession]);

  const refreshTokens = useCallback(async () => {
    if (!user?.sessionToken) {
      throw new Error('No session token available');
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for CSRF cookie handling
        body: JSON.stringify({
          sessionToken: user.sessionToken,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new CsrfValidationError('CSRF validation failed during token refresh');
        }
        throw new Error('Failed to refresh tokens');
      }

      const result = await response.json();
      
      const updatedUser: AuthUser = {
        ...user,
        sessionToken: result.sessionToken,
        accessToken: result.accessToken,
      };

      setUser(updatedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      updateSession(result.sessionToken, result.accessToken, result.expiresIn);
      setError(null);
    } catch (err) {
      console.error('Token refresh error:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh tokens'));
      throw err;
    }
  }, [user, updateSession]);

  const login = useCallback(async (result: LoginResult) => {
    try {
      const newUser: AuthUser = {
        id: result.playfabId,
        displayName: result.displayName,
        playfabId: result.playfabId,
        sessionToken: result.sessionToken,
        accessToken: result.accessToken,
      };

      console.log('Setting new user:', newUser);
      setUser(newUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      updateSession(result.sessionToken, result.accessToken, result.expiresIn);
      setError(null);

      // Verify the session cookie is set
      const cookies = document.cookie.split(';');
      const hasSessionCookie = cookies.some(cookie => cookie.trim().startsWith('session_token='));
      if (!hasSessionCookie) {
        console.warn('Session cookie not found after login');
      } else {
        console.log('Session cookie verified');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err : new Error('Failed to login'));
      throw err;
    }
  }, [updateSession]);

  const logout = useCallback(async () => {
    try {
      if (user?.sessionToken) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important for CSRF cookie handling
        });
      }

      console.log('Logging out user');
      setUser(null);
      localStorage.removeItem(USER_STORAGE_KEY);
      clearSession();
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err instanceof Error ? err : new Error('Failed to logout'));
      throw err;
    }
  }, [user, clearSession]);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    refreshTokens,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
