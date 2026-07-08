import { apiClient } from "./api-client";
import { isTokenExpired, decodeToken } from "./token";

export interface AuthUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  roles: string[];
}

export interface AuthResult {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

/**
 * Store auth tokens in localStorage.
 */
function storeTokens(token: string, refreshToken: string) {
  localStorage.setItem("auth_token", token);
  localStorage.setItem("refresh_token", refreshToken);

  // Store token expiry for proactive checks
  const decoded = decodeToken(token);
  if (decoded?.exp) {
    localStorage.setItem("auth_token_expires_at", String(decoded.exp * 1000));
  }
}

/**
 * Clear all auth data from localStorage.
 */
export function clearAuth() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("auth_token_expires_at");
}

/**
 * Get the stored access token.
 */
export function getAccessToken(): string | null {
  return localStorage.getItem("auth_token");
}

/**
 * Get the stored refresh token.
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem("refresh_token");
}

/**
 * Check if the user has a valid (non-expired) token stored.
 */
export function isAuthenticated(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  return !isTokenExpired(token);
}

/**
 * Attempt to refresh the access token using the refresh token.
 * Returns true on success, false on failure.
 */
export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}/auth/refresh-token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }
    );

    if (!response.ok) return false;

    const data = await response.json();
    if (data.token && data.refreshToken) {
      storeTokens(data.token, data.refreshToken);
      return true;
    }
    // Some endpoints only return token (not both)
    if (data.token) {
      storeTokens(data.token, refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const response = await apiClient.post<AuthResult>("/auth/signin", { email, password });
  if (response.error) throw new Error(response.error);
  const data = response.data!;
  storeTokens(data.token, data.refreshToken);
  return data;
}

export async function signOut(): Promise<void> {
  try {
    await apiClient.post("/auth/signout");
  } catch {
    // ignore
  }
  clearAuth();
}

export async function getProfile(): Promise<AuthUser> {
  const response = await apiClient.get<AuthUser>("/auth/profile");
  if (response.error) throw new Error(response.error);
  return response.data!;
}
