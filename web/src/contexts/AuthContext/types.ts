export interface AuthUser {
  id: string;
  displayName: string;
  playfabId: string;
  sessionToken: string;
  accessToken: string;
}

export interface TokenResponse {
  sessionToken: string;
  accessToken: string;
  expiresIn: number;
}

export interface LoginResult {
  sessionToken: string;
  accessToken: string;
  expiresIn: number;
  playfabId: string;
  displayName: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
  login: (result: LoginResult) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  debugLogin?: () => Promise<void>;
}
