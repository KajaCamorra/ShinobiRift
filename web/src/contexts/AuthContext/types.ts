export interface AuthUser {
  id: string;
  displayName: string;
  playfabId: string;
}

export interface LoginResult {
  data: {
    SessionTicket: string;
    PlayFabId: string;
    InfoResultPayload?: {
      PlayerProfile?: {
        DisplayName?: string;
      };
    };
  };
  discordId?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
  login: (result: LoginResult) => Promise<void>;
  logout: () => Promise<void>;
  debugLogin?: () => Promise<void>;
}
