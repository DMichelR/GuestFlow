"use client";

import { useRef, useEffect, useCallback } from "react";

// Returns a stable debounced function. The returned function identity only
// changes when `delay` changes. The latest `callback` is always invoked by
// using a ref, so callers can pass inline callbacks without causing
// unnecessary re-creations that would break effect dependencies.
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay = 400
): (...args: Args) => void {
  const callbackRef = useRef<(...args: Args) => void>(callback);
  const timer = useRef<number | null>(null);

  // Keep the latest callback in a ref so the debounced function can remain
  // stable while calling the most recent callback implementation.
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timer.current) {
        window.clearTimeout(timer.current);
      }
    };
  }, []);

  const debounced = useCallback(
    (...args: Args) => {
      if (timer.current) {
        window.clearTimeout(timer.current);
      }
      timer.current = window.setTimeout(() => {
        callbackRef.current(...args);
      }, delay) as unknown as number;
    },
    [delay]
  );

  return debounced;
}
