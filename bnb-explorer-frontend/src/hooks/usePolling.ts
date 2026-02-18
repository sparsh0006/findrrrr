"use client";

import { useEffect, useRef } from "react";

/**
 * Calls `callback` immediately, then repeats every `intervalMs`.
 * Stops when the component unmounts.
 */
export function usePolling(callback: () => void, intervalMs: number) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    savedCallback.current();
    const id = setInterval(() => savedCallback.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
