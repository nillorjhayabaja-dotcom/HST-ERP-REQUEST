/**
 * Auth event system for cross-component communication.
 * Allows any component to listen for forced logout events.
 */

type AuthEventListener = () => void;

const listeners: Set<AuthEventListener> = new Set();

/**
 * Subscribe to forced logout events.
 * Returns an unsubscribe function.
 */
export function onAuthLogout(callback: AuthEventListener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Emit a forced logout event to all subscribers.
 */
export function emitAuthLogout(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // ignore individual listener errors
    }
  }
}
