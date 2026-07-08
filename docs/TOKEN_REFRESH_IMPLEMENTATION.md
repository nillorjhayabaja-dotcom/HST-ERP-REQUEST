# Token Expiration and Auto-Refresh Implementation

## Overview

This document describes the improved token expiration and automatic refresh mechanism implemented to prevent user session timeouts during active use.

## Features Implemented

### 1. Automatic Token Refresh (`useTokenRefresh` hook)

**Location:** `src/hooks/useTokenRefresh.ts`

**Features:**
- **Proactive Token Refresh:** Automatically refreshes the access token before it expires (10 minutes before expiry)
- **Periodic Health Checks:** Checks token status every 5 minutes
- **Concurrent Request Protection:** Prevents multiple simultaneous refresh attempts
- **Graceful Degradation:** If refresh fails but token is still valid, continues operation
- **Automatic Logout:** Forces logout only if token is expired AND refresh fails

**Configuration:**
```typescript
const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
const TOKEN_EXPIRY_MARGIN = 10 * 60 * 1000; // Refresh if expiring within 10 minutes
```

### 2. Session Warning Dialog

**Location:** `src/components/session-warning-dialog.tsx`

**Features:**
- **30-Minute Idle Timeout:** Automatically logs out after 30 minutes of inactivity
- **5-Minute Warning:** Shows a warning dialog 5 minutes before logout
- **Countdown Timer:** Displays remaining time in MM:SS format
- **User Choice:** Allows users to extend session or sign out
- **Activity Detection:** Resets timer on any user interaction (mouse, keyboard, touch, scroll)

**User Interactions Monitored:**
- `mousemove`
- `mousedown`
- `keydown`
- `keypress`
- `click`
- `scroll`
- `touchstart`
- `touchmove`

### 3. Integration Points

**Modified Files:**
- `src/routes/_authenticated/route.tsx` - Added `useTokenRefresh` hook and `SessionWarningDialog` component

## How It Works

### Token Refresh Flow

1. **On App Mount:** Immediately checks token status and refreshes if needed
2. **Every 5 Minutes:** Performs a health check on the current token
3. **Before Expiry:** If token expires within 10 minutes, proactively refreshes it
4. **On API Request:** If token is expired, attempts refresh before making the request
5. **On 401 Response:** Attempts silent refresh, forces logout only if refresh fails

### Idle Timeout Flow

1. **User Activity:** Any interaction resets the 30-minute timer
2. **At 25 Minutes:** Warning dialog appears with 5-minute countdown
3. **User Choice:**
   - "Stay Signed In" - Resets timer and continues session
   - "Sign Out" - Immediately logs out
4. **At 30 Minutes:** Automatic logout if no action taken

## Benefits

### For Users:
- ✅ **No More Interrupted Sessions:** Token refreshes automatically during active use
- ✅ **Seamless Experience:** No need to re-login during long work sessions
- ✅ **Security:** Still enforces 30-minute inactivity timeout
- ✅ **Warning System:** Users get advance notice before logout

### For Administrators:
- ✅ **No Backend Changes Required:** Works with existing refresh token endpoint
- ✅ **Reduced Support Tickets:** Fewer "I got logged out" complaints
- ✅ **Better Security:** Balances convenience with security
- ✅ **Configurable:** Easy to adjust timeouts and intervals

## Technical Details

### Token Refresh Strategy

The implementation uses a **dual-layer approach**:

1. **Proactive Refresh:** Refreshes tokens before they expire to prevent any interruption
2. **Reactive Refresh:** Handles expired tokens on API requests with automatic retry

### Concurrency Control

Uses a shared promise pattern to prevent multiple simultaneous refresh requests:

```typescript
let refreshPromise: Promise<boolean> | null = null;

if (!refreshPromise) {
  refreshPromise = refreshAccessToken().finally(() => {
    refreshPromise = null;
  });
}
```

### Memory Management

- Properly cleans up intervals and timers on component unmount
- Uses refs to maintain stable references across renders
- No memory leaks from event listeners

## Configuration

### Adjusting Timeouts

To modify the timeout values, edit the constants in the respective files:

**Token Refresh Intervals** (`src/hooks/useTokenRefresh.ts`):
```typescript
const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // Health check frequency
const TOKEN_EXPIRY_MARGIN = 10 * 60 * 1000; // When to refresh before expiry
```

**Idle Timeout** (`src/components/session-warning-dialog.tsx`):
```typescript
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_LOGOUT = 5 * 60 * 1000; // 5 minutes warning
```

## Testing

### Manual Testing Steps

1. **Token Refresh Test:**
   - Log in to the application
   - Wait 20-25 minutes (or temporarily reduce `TOKEN_EXPIRY_MARGIN` to 1 minute for testing)
   - Verify the token refreshes automatically without logout
   - Check browser DevTools Network tab for refresh token API calls

2. **Idle Timeout Test:**
   - Log in to the application
   - Remain idle for 25 minutes
   - Verify warning dialog appears
   - Click "Stay Signed In" and verify timer resets
   - Remain idle for another 5 minutes
   - Verify automatic logout

3. **Activity Reset Test:**
   - Log in to the application
   - Wait 20 minutes
   - Move mouse or press any key
   - Verify timer resets and warning appears at 25 minutes again

### Automated Testing Considerations

- Mock `localStorage` for token storage
- Mock `fetch` for API calls
- Use Jest fake timers for timeout testing
- Test edge cases: expired token, network failures, concurrent refreshes

## Browser Compatibility

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Uses standard Web APIs (localStorage, fetch, setInterval)
- ✅ No external dependencies beyond React
- ✅ Works with SSR disabled (as configured in the route)

## Security Considerations

1. **Token Storage:** Tokens stored in localStorage (consider httpOnly cookies for enhanced security)
2. **Refresh Token Rotation:** Backend should implement refresh token rotation
3. **HTTPS Only:** Ensure production uses HTTPS to prevent token interception
4. **XSS Protection:** Implement proper CSP headers to prevent XSS attacks
5. **Token Expiry:** Backend should enforce reasonable token expiry times (15-30 minutes)

## Future Enhancements

Potential improvements for future iterations:

1. **Configurable Timeouts:** Allow users/admins to adjust timeout values
2. **Activity Score:** Weight different activities (typing = more active than scrolling)
3. **Multiple Tab Support:** Sync idle timer across browser tabs
4. **Network Status Detection:** Pause refresh attempts when offline
5. **Analytics:** Track session duration and timeout events
6. **Biometric Authentication:** Option to use biometrics instead of password after timeout
7. **Remember Me:** Extended timeout option for trusted devices

## Troubleshooting

### Token Not Refreshing

1. Check browser console for errors
2. Verify refresh token endpoint is working (`/auth/refresh-token`)
3. Check network tab for failed API calls
4. Ensure tokens are stored in localStorage

### Users Still Getting Logged Out

1. Verify `useTokenRefresh` hook is mounted in `_authenticated` layout
2. Check if backend token expiry is shorter than refresh margin
3. Ensure no errors in token refresh API calls
4. Verify refresh token hasn't expired on backend

### Warning Dialog Not Appearing

1. Check if `SessionWarningDialog` component is rendered
2. Verify `useIdleTimeout` hook is working
3. Check for JavaScript errors in console
4. Ensure dialog z-index is high enough

## Related Files

- `src/hooks/useTokenRefresh.ts` - Token refresh hook
- `src/hooks/useIdleTimeout.ts` - Idle timeout detection
- `src/components/session-warning-dialog.tsx` - Warning UI component
- `src/routes/_authenticated/route.tsx` - Integration point
- `src/lib/auth-helper.ts` - Authentication utilities
- `src/lib/api-client.ts` - API client with refresh logic
- `src/lib/token.ts` - Token utility functions

## Backend Requirements

The backend must have a working refresh token endpoint:

**Endpoint:** `POST /api/auth/refresh-token`

**Request:**
```json
{
  "refreshToken": "string"
}
```

**Response (Success):**
```json
{
  "token": "new-access-token",
  "refreshToken": "new-refresh-token" // optional
}
```

**Response (Failure):**
```json
{
  "error": "Invalid refresh token"
}
```

**Status Codes:**
- `200` - Success
- `401` - Invalid or expired refresh token

## Conclusion

This implementation provides a robust, user-friendly token management system that:
- Prevents session interruption during active use
- Maintains security through inactivity timeouts
- Provides clear user feedback
- Requires no backend changes
- Is fully configurable and maintainable