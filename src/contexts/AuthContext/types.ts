export interface AuthUser {
    id: string;
    displayName: string;
    playfabId?: string;
  }
  
  export interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    error: Error | null;
    login: (credentials: any) => Promise<void>;
    logout: () => Promise<void>;
  }
  