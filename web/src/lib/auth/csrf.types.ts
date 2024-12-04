export interface CsrfToken {
  token: string;
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
}

export interface CsrfConfig {
  headerName: 'X-CSRF-Token';
  cookieName: 'csrf_token';
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'];
  tokenLength: 32;
  expiryTime: 3600;
}

export interface CsrfService {
  generateToken(sessionId: string): Promise<CsrfToken>;
  validateToken(sessionId: string, token: string): Promise<boolean>;
  refreshToken(oldToken: CsrfToken): Promise<CsrfToken>;
}
