    /**
 * Client-side JWT token utilities.
 * Decodes tokens to check expiration without needing the secret.
 */

export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Decode a JWT token's payload client-side (no signature verification).
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Get the token's expiration time as a Date.
 */
export function getTokenExpiry(token: string): Date | null {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return null;
  return new Date(decoded.exp * 1000);
}

/**
 * Check if the token is expired.
 */
export function isTokenExpired(token: string): boolean {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  return Date.now() >= expiry.getTime();
}

/**
 * Check if the token will expire within the given margin (in seconds).
 */
export function isTokenExpiringSoon(token: string, marginSeconds: number = 60): boolean {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  return Date.now() + marginSeconds * 1000 >= expiry.getTime();
}

/**
 * Get the number of seconds until the token expires. Returns 0 if already expired or invalid.
 */
export function getSecondsUntilExpiry(token: string): number {
  const expiry = getTokenExpiry(token);
  if (!expiry) return 0;
  const diff = expiry.getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
}