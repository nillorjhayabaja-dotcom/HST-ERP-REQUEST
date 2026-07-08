import { useEffect, useRef, useCallback } from "react";
import { getAccessToken, getRefreshToken, refreshAccessToken, clearAuth } from "@/lib/auth-helper";
import { isTokenExpired, isTokenExpiringSoon } from "@/lib/token";
import { emitAuthLogout } from "@/lib/auth-events";

const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
const TOKEN_EXPIRY_MARGIN = 10 * 60 * 1000; // Refresh if expiring within 10 minutes

/**
 * Hook that automatically refreshes the authentication token before it expires.
 *
 * Features:
 * - Proactive token refresh when token is expiring soon
 * - Periodic token health checks
 * - Automatic logout if refresh fails
 * - Prevents session expiration during active use
 */
export function useTokenRefresh() {
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRefreshingRef = useRef(false);

  const performTokenRefresh = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current) {
      return false;
    }

    const token = getAccessToken();
    const refreshToken = getRefreshToken();

    if (!token || !refreshToken) {
      return false;
    }

    // If token is already expired, try to refresh
    if (isTokenExpired(token)) {
      isRefreshingRef.current = true;
      try {
        const success = await refreshAccessToken();
        if (!success) {
          clearAuth();
          emitAuthLogout();
          return false;
        }
        return true;
      } finally {
        isRefreshingRef.current = false;
      }
    }

    // If token is expiring soon, proactively refresh
    if (isTokenExpiringSoon(token, TOKEN_EXPIRY_MARGIN / 1000)) {
      isRefreshingRef.current = true;
      try {
        const success = await refreshAccessToken();
        if (!success) {
          // Don't logout immediately if token is still valid, just log the issue
          console.warn("Token refresh failed, but current token is still valid");
          return true;
        }
        return true;
      } finally {
        isRefreshingRef.current = false;
      }
    }

    return true;
  }, []);

  useEffect(() => {
    // Initial check on mount
    performTokenRefresh();

    // Set up periodic token health check
    refreshTimerRef.current = setInterval(() => {
      performTokenRefresh();
    }, TOKEN_REFRESH_INTERVAL);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [performTokenRefresh]);

  return {
    /** Manually trigger a token refresh */
    refreshToken: performTokenRefresh,
  };
}
