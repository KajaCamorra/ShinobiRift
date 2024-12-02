'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PlayFabClient } from 'playfab-sdk';
import { useRouter } from 'next/navigation';
import { AuthContextType, AuthUser, LoginResult } from './types';
import { useToast } from '../ToastContext';

const DEBUG = true;
const DEBUG_USER_ID = process.env.NEXT_PUBLIC_DEBUG_USER_CUSTOM_ID;
const SESSION_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour
const SESSION_STORAGE_KEY = 'playfab_session';
const RESTORE_TIMEOUT = 500; // Match the game layout timeout

if (!PlayFabClient.IsClientLoggedIn() && process.env.NEXT_PUBLIC_PLAYFAB_TITLE_ID) {
  PlayFabClient.settings.titleId = process.env.NEXT_PUBLIC_PLAYFAB_TITLE_ID;
  console.log('[Auth Context] PlayFab initialized with title ID:', process.env.NEXT_PUBLIC_PLAYFAB_TITLE_ID);
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface StoredSession {
  playFabId: string;
  sessionTicket: string;
  displayName?: string;
  discordId?: string;
  timestamp: string;
}

// Helper function to ensure consistent CustomID formatting
const formatCustomId = (discordId: string | undefined, playFabId: string): string => {
  if (discordId) {
    // If the discordId already has the prefix, use it as is
    if (discordId.startsWith('discord_')) {
      console.log('[Auth Context] Using prefixed Discord ID:', discordId);
      return discordId;
    }
    // Otherwise, add the prefix
    const formattedId = `discord_${discordId}`;
    console.log('[Auth Context] Formatted Discord ID:', formattedId);
    return formattedId;
  }
  console.log('[Auth Context] Using PlayFab ID:', playFabId);
  return playFabId;
};

const setCookie = (name: string, value: string, days = 3) => {
  console.log(`[Auth Context] Setting cookie ${name} with value length:`, value?.length || 0);
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Lax`;
  
  // Verify cookie was set
  const verificationCookie = getCookie(name);
  console.log(`[Auth Context] Verifying cookie ${name} was set:`, {
    wasSet: !!verificationCookie,
    length: verificationCookie?.length || 0
  });
};

const getCookie = (name: string): string | null => {
  console.log(`[Auth Context] Getting cookie ${name}`);
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift() || null;
    console.log(`[Auth Context] Cookie ${name} found with length:`, cookieValue?.length || 0);
    return cookieValue;
  }
  console.log(`[Auth Context] Cookie ${name} not found`);
  return null;
};

const deleteCookie = (name: string) => {
  console.log(`[Auth Context] Deleting cookie ${name}`);
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  
  // Verify cookie was deleted
  const verificationCookie = getCookie(name);
  console.log(`[Auth Context] Verifying cookie ${name} was deleted:`, !verificationCookie);
};

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  console.log('\n[Auth Context] ==================== Provider Render ====================');
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const loginAttemptRef = useRef(false);
  const restorationTimeoutRef = useRef<NodeJS.Timeout>();
  const { showToast } = useToast();
  const router = useRouter();

  const clearSession = useCallback(() => {
    console.log('\n[Auth Context] ==================== Clear Session ====================');
    console.log('[Auth Context] Clearing session data');
    
    localStorage.removeItem(SESSION_STORAGE_KEY);
    deleteCookie('playfab_session');
    setUser(null);
    setError(null);
    loginAttemptRef.current = false;
    
    // Only redirect to landing if we're initialized and not already there
    if (isInitialized) {
      const currentPath = window.location.pathname;
      console.log('[Auth Context] Current path:', currentPath);
      
      if (currentPath !== '/' && currentPath !== '/login') {
        console.log('[Auth Context] Redirecting to landing page');
        router.replace('/');
      }
    }
  }, [router, isInitialized]);

  const setSessionData = useCallback((sessionTicket: string, userData: AuthUser, discordId?: string) => {
    console.log('\n[Auth Context] ==================== Set Session Data ====================');
    console.log('[Auth Context] Setting session data for user:', userData.id);
    
    const sessionData: StoredSession = {
      playFabId: userData.playfabId,
      sessionTicket: sessionTicket,
      displayName: userData.displayName,
      discordId: discordId,
      timestamp: new Date().toISOString()
    };

    // Set localStorage first
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    console.log('[Auth Context] Session data saved to localStorage');
    
    // Then set cookie
    setCookie('playfab_session', sessionTicket);
    
    // Finally update state
    setUser(userData);
    
    // Verify all data was set correctly
    const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    const sessionCookie = getCookie('playfab_session');
    
    console.log('[Auth Context] Session data verification:', {
      hasLocalStorage: !!storedSession,
      hasCookie: !!sessionCookie,
      userState: !!userData
    });
  }, []);

  const restoreSession = useCallback(async (): Promise<boolean> => {
    if (loginAttemptRef.current) {
      console.log('[Auth Context] Login attempt already in progress, skipping');
      return false;
    }

    console.log('\n[Auth Context] ==================== Restore Session ====================');
    console.log('[Auth Context] Starting session restoration');

    loginAttemptRef.current = true;

    // Clear any existing restoration timeout
    if (restorationTimeoutRef.current) {
      clearTimeout(restorationTimeoutRef.current);
    }

    // Set a new restoration timeout
    restorationTimeoutRef.current = setTimeout(() => {
      console.log('[Auth Context] Session restoration timeout reached');
      loginAttemptRef.current = false;
    }, RESTORE_TIMEOUT);

    const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    const sessionCookie = getCookie('playfab_session');

    console.log('[Auth Context] Current session state:', {
      hasLocalStorage: !!savedSession,
      hasCookie: !!sessionCookie,
      currentPath: window.location.pathname
    });

    if (!savedSession) {
      console.log('[Auth Context] No saved session in localStorage');
      loginAttemptRef.current = false;
      clearSession();
      return false;
    }

    try {
      const session: StoredSession = JSON.parse(savedSession);
      console.log('[Auth Context] Parsed session data:', {
        playFabId: session.playFabId,
        hasSessionTicket: !!session.sessionTicket,
        displayName: session.displayName,
        hasDiscordId: !!session.discordId,
        timestamp: session.timestamp
      });

      const now = new Date();
      const sessionTime = new Date(session.timestamp);
      const sessionAge = now.getTime() - sessionTime.getTime();
      console.log('[Auth Context] Session age:', {
        ageInHours: sessionAge / (1000 * 60 * 60),
        isExpired: sessionAge > 3 * 24 * 60 * 60 * 1000
      });
      
      if (sessionAge > 3 * 24 * 60 * 60 * 1000) {
        console.log('[Auth Context] Session expired');
        loginAttemptRef.current = false;
        clearSession();
        return false;
      }

      // Format the CustomId properly for PlayFab
      const customId = formatCustomId(session.discordId, session.playFabId);
      console.log('[Auth Context] Attempting PlayFab login with formatted ID:', customId);

      const result = await new Promise((resolve, reject) => {
        PlayFabClient.LoginWithCustomID({
          CustomId: customId,
          CreateAccount: false,
          InfoRequestParameters: {
            GetUserAccountInfo: true,
            GetPlayerProfile: true,
            GetUserInventory: false,
            GetUserVirtualCurrency: false,
            GetUserData: false,
            GetPlayerStatistics: false,
            GetTitleData: false,
            GetUserReadOnlyData: false,
            GetCharacterList: false,
            GetCharacterInventories: false
          }
        }, (error, result) => {
          if (error) {
            console.log('[Auth Context] PlayFab login error:', error);
            reject(error);
          } else {
            console.log('[Auth Context] PlayFab login success:', {
              playFabId: result.data.PlayFabId,
              hasSessionTicket: !!result.data.SessionTicket
            });
            resolve(result);
          }
        });
      });

      const loginResult = result as any;
      if (!loginResult?.data?.SessionTicket) {
        throw new Error('Session restoration failed: No session ticket');
      }

      const userData: AuthUser = {
        id: loginResult.data.PlayFabId,
        displayName: loginResult.data.InfoResultPayload?.PlayerProfile?.DisplayName || session.displayName || 'Player',
        playfabId: loginResult.data.PlayFabId
      };

      console.log('[Auth Context] Setting restored session data');
      setSessionData(loginResult.data.SessionTicket, userData, session.discordId);
      
      console.log('[Auth Context] Session restoration complete');
      loginAttemptRef.current = false;
      return true;
    } catch (error) {
      console.error('[Auth Context] Session restoration failed:', error);
      loginAttemptRef.current = false;
      clearSession();
      return false;
    }
  }, [clearSession, setSessionData]);

  // Initial session restoration
  useEffect(() => {
    console.log('\n[Auth Context] ==================== Initial Session Restoration ====================');
    console.log('[Auth Context] Starting initial session restoration');
    
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const restored = await restoreSession();
        console.log('[Auth Context] Initial session restoration result:', restored);
      } catch (error) {
        console.error('[Auth Context] Initial session restoration failed:', error);
        clearSession();
      } finally {
        if (mounted) {
          console.log('[Auth Context] Setting initialized state');
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (restorationTimeoutRef.current) {
        clearTimeout(restorationTimeoutRef.current);
      }
      console.log('[Auth Context] Cleanup: Component unmounted');
    };
  }, [restoreSession, clearSession]);

  // Periodic session check
  useEffect(() => {
    if (!isInitialized) return;

    console.log('\n[Auth Context] ==================== Setting Up Session Check ====================');
    console.log('[Auth Context] Initializing periodic session check');

    let sessionCheckInterval: NodeJS.Timeout;
    let isCheckingSession = false;
    
    const checkSession = async () => {
      if (isCheckingSession || window.location.pathname === '/login' || window.location.pathname === '/') {
        return;
      }

      console.log('[Auth Context] Performing periodic session check');
      isCheckingSession = true;

      try {
        const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
        const sessionCookie = getCookie('playfab_session');
        
        console.log('[Auth Context] Session check state:', {
          hasLocalStorage: !!savedSession,
          hasCookie: !!sessionCookie,
          currentPath: window.location.pathname
        });

        if (!savedSession || !sessionCookie) {
          console.log('[Auth Context] Missing session data during check');
          clearSession();
          return;
        }

        const restored = await restoreSession();
        if (!restored) {
          console.log('[Auth Context] Session restoration failed during check');
          clearSession();
        }
      } catch (error) {
        console.error('[Auth Context] Session check failed:', error);
        clearSession();
      } finally {
        isCheckingSession = false;
      }
    };

    sessionCheckInterval = setInterval(checkSession, SESSION_CHECK_INTERVAL);
    console.log('[Auth Context] Session check interval set:', SESSION_CHECK_INTERVAL);

    return () => {
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
        console.log('[Auth Context] Cleanup: Session check interval cleared');
      }
    };
  }, [isInitialized, clearSession, restoreSession]);

  const login = useCallback(async (loginResult: LoginResult) => {
    console.log('\n[Auth Context] ==================== Login ====================');
    console.log('[Auth Context] Processing login result:', {
      playFabId: loginResult.data.PlayFabId,
      hasDiscordId: !!loginResult.discordId
    });
    
    setLoading(true);
    setError(null);

    try {
      const userData: AuthUser = {
        id: loginResult.data.PlayFabId,
        displayName: loginResult.data.InfoResultPayload?.PlayerProfile?.DisplayName || 'Player',
        playfabId: loginResult.data.PlayFabId
      };

      // Store the formatted CustomId
      if (loginResult.discordId) {
        console.log('[Auth Context] Setting session with Discord ID:', loginResult.discordId);
      }
      
      setSessionData(loginResult.data.SessionTicket, userData, loginResult.discordId);
      showToast('Successfully logged in!', 'success');
      
      console.log('[Auth Context] Navigating to game page');
      router.replace('/game');
    } catch (err) {
      console.error('[Auth Context] Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(new Error(errorMessage));
      showToast('Login failed', 'error');
      clearSession();
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast, router, clearSession, setSessionData]);

  const debugLogin = useCallback(async () => {
    if (!DEBUG) {
      throw new Error('Debug login is only available in development mode');
    }

    if (!DEBUG_USER_ID) {
      throw new Error('Debug user ID not configured in environment variables');
    }

    setLoading(true);
    setError(null);

    try {
      if (DEBUG) {
        console.log('[Auth Context] Attempting debug login with ID:', DEBUG_USER_ID);
      }

      const result = await new Promise((resolve, reject) => {
        PlayFabClient.LoginWithCustomID({
          CustomId: DEBUG_USER_ID,
          CreateAccount: true,
          InfoRequestParameters: {
            GetUserAccountInfo: true,
            GetPlayerProfile: true,
            GetUserInventory: false,
            GetUserVirtualCurrency: false,
            GetUserData: false,
            GetPlayerStatistics: false,
            GetTitleData: false,
            GetUserReadOnlyData: false,
            GetCharacterList: false,
            GetCharacterInventories: false
          }
        }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      });

      const loginResult = result as any;
      
      if (!loginResult?.data?.SessionTicket) {
        throw new Error('Debug login failed: No session ticket');
      }

      const userData: AuthUser = {
        id: loginResult.data.PlayFabId,
        displayName: loginResult.data.InfoResultPayload?.PlayerProfile?.DisplayName || 'Debug User',
        playfabId: loginResult.data.PlayFabId
      };

      setSessionData(loginResult.data.SessionTicket, userData, DEBUG_USER_ID);
      showToast('Successfully logged in with debug account!', 'success');
      router.replace('/game');
    } catch (err) {
      console.error('[Auth Context] Debug login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Debug login failed';
      setError(new Error(errorMessage));
      showToast('Debug login failed', 'error');
      clearSession();
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast, router, clearSession, setSessionData]);

  const logout = useCallback(async () => {
    console.log('\n[Auth Context] ==================== Logout ====================');
    console.log('[Auth Context] Processing logout');
    clearSession();
    showToast('Successfully logged out', 'success');
  }, [clearSession, showToast]);

  const value = useMemo(() => ({
    user,
    loading,
    error,
    login,
    logout,
    ...(DEBUG ? { debugLogin } : {})
  }), [user, loading, error, login, logout, debugLogin]);

  console.log('[Auth Context] Current state:', {
    hasUser: !!user,
    loading,
    hasError: !!error,
    isInitialized
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
