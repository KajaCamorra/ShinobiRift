export interface RateLimitConfig {
  windowSeconds: number;      // Time window for rate limiting
  maxAttempts: number;       // Maximum attempts within window
  blockDuration: number;     // Duration of blocking after limit exceeded
}

export interface RateLimitKey {
  type: 'ip' | 'userId' | 'custom';
  value: string;
  environment: string;       // Development or production identifier
}

export interface RateLimitResponse {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}
