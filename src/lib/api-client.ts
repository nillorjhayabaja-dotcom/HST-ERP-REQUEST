import { getAccessToken, getRefreshToken, refreshAccessToken, clearAuth } from "./auth-helper";
import { isTokenExpired } from "./token";
import { emitAuthLogout } from "./auth-events";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Tracks whether a token refresh is currently in progress.
 * Prevents multiple concurrent refresh attempts.
 */
let refreshPromise: Promise<boolean> | null = null;

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Attempts to refresh the token.
   * Uses a shared promise to avoid multiple simultaneous refresh attempts.
   */
  private async attemptTokenRefresh(): Promise<boolean> {
    if (!getRefreshToken()) return false;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    return refreshPromise;
  }

  /**
   * Handle a 401 response: attempt refresh, then force logout if it fails.
   */
  private async handleUnauthorized(): Promise<void> {
    const refreshed = await this.attemptTokenRefresh();
    if (!refreshed) {
      clearAuth();
      emitAuthLogout();
    }
  }

  private async request<T>(method: string, endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      // Proactive token check: if the token is already expired, try to refresh first
      const token = getAccessToken();
      if (token && isTokenExpired(token)) {
        const refreshed = await this.attemptTokenRefresh();
        if (!refreshed) {
          clearAuth();
          emitAuthLogout();
          return { error: 'Session expired', status: 401 };
        }
      }

      const headers = this.getAuthHeaders();

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          // Try silent refresh; if it works, retry logic would need recursion.
          // For simplicity, handleUnauthorized will emit a logout event if refresh fails.
          await this.handleUnauthorized();
          // Even if refresh succeeded, the original request still failed.
          // The caller should retry. Return the error so they know.
        }
        return { error: data?.error || 'Request failed', status: response.status };
      }

      return { data, status: response.status };
    } catch (error) {
      return { error: (error as Error).message, status: 500 };
    }
  }

  /**
   * Execute a request with automatic retry on 401 if token refresh succeeds.
   */
  private async requestWithRetry<T>(method: string, endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const result = await this.request<T>(method, endpoint, body);

    // If we got a 401 and the token has since been refreshed (i.e., new token exists),
    // retry the request once automatically.
    if (result.status === 401) {
      const token = getAccessToken();
      if (token && !isTokenExpired(token)) {
        return this.request<T>(method, endpoint, body);
      }
    }

    return result;
  }

  get<T>(endpoint: string) {
    return this.requestWithRetry<T>('GET', endpoint);
  }

  post<T>(endpoint: string, body?: any) {
    return this.requestWithRetry<T>('POST', endpoint, body);
  }

  put<T>(endpoint: string, body?: any) {
    return this.requestWithRetry<T>('PUT', endpoint, body);
  }

  delete<T>(endpoint: string) {
    return this.requestWithRetry<T>('DELETE', endpoint);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
