import * as jose from 'jose';

interface JWTPayload {
  userId: string;
  userRole: string[];
  sessionId: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

const ACCESS_TOKEN_KEY = 'access_token';

// In-memory token storage (primary)
let accessTokenMemory: string | null = null;

/**
 * Get JWT public key from environment variables
 */
export const getPublicKey = (): string => {
  const publicKey = import.meta.env.VITE_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error('VITE_PUBLIC_KEY not found in environment variables');
  }
  return publicKey;
};

/**
 * Get reset password secret from environment variables
 */
export const getResetPasswordSecret = (): string => {
  const secret = import.meta.env.VITE_RESET_PASSWORD_SECRET;
  if (!secret) {
    throw new Error(
      'VITE_RESET_PASSWORD_SECRET not found in environment variables'
    );
  }
  return secret;
};

/**
 * Verify JWT token signature and return decoded payload
 */
export const verifyToken = async (token: string): Promise<JWTPayload> => {
  try {
    const publicKey = getPublicKey();
    const key = await jose.importSPKI(publicKey, 'RS256');
    const { payload } = await jose.jwtVerify(token, key);
    return payload as JWTPayload;
  } catch (error) {
    throw new Error(`Token verification failed: ${error}`);
  }
};

/**
 * Verify reset password token signature using RESET_PASSWORD_SECRET
 */
export const verifyResetToken = async (token: string): Promise<JWTPayload> => {
  try {
    const secret = getResetPasswordSecret();
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret);

    const { payload } = await jose.jwtVerify(token, secretKey);
    return payload as JWTPayload;
  } catch (error) {
    throw new Error(`Reset token verification failed: ${error}`);
  }
};

/**
 * Decode JWT token without verification (faster, but less secure)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    const payload = jose.decodeJwt(token);
    return payload as JWTPayload;
  } catch {
    return null;
  }
};

/**
 * Get access token from memory (primary) or sessionStorage (fallback)
 */
export const getAccessToken = (): string | null => {
  if (accessTokenMemory) return accessTokenMemory;
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Set access token in both memory and sessionStorage
 */
export const setAccessToken = (token: string | null): void => {
  accessTokenMemory = token;
  if (token) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

/**
 * Clear access token from memory and sessionStorage
 */
export const clearAccessToken = (): void => {
  accessTokenMemory = null;
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
};

/**
 * Verify token signature and check if valid for use
 * Returns false if token is invalid, expired, or verification fails
 */
export const isTokenValid = async (): Promise<boolean> => {
  const token = getAccessToken();
  if (!token) return false;

  try {
    const payload = await verifyToken(token);
    if (!payload || !payload.exp) return false;

    const currentTime = Math.floor(Date.now() / 1000);
    // Add 5 second buffer to refresh before actual expiry
    return payload.exp - 5 >= currentTime;
  } catch {
    return false;
  }
};

/**
 * Extract user data from decoded token payload
 */
export const extractUserFromToken = (
  payload: JWTPayload | null
): { userId: string; userRole: string[]; sessionId: string } => {
  return {
    userId: payload?.userId || '',
    userRole: payload?.userRole || [],
    sessionId: payload?.sessionId || '',
  };
};
