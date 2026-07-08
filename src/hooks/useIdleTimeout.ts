import { useEffect, useRef, useCallback } from "react";

type IdleCallback = () => void;

/**
 * Hook that calls `onIdle` after `timeoutMs` of inactivity.
 * Resets the timer on any user interaction (mouse move, key press, click, scroll, touch).
 */
export function useIdleTimeout(
  onIdle: IdleCallback,
  timeoutMs: number = 30 * 60 * 1000 // default 30 minutes
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef<IdleCallback>(onIdle);

  // Keep callback ref up to date without re-binding listeners
  callbackRef.current = onIdle;

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      callbackRef.current();
    }, timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    const events: string[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "keypress",
      "click",
      "scroll",
      "touchstart",
      "touchmove",
    ];

    // Start the timer
    resetTimer();

    // Bind all events
    for (const event of events) {
      window.addEventListener(event, resetTimer);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      for (const event of events) {
        window.removeEventListener(event, resetTimer);
      }
    };
  }, [resetTimer]);

  return {
    /** Manually reset the idle timer */
    resetTimer,
  };
}