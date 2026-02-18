"use client";

import { useState, useEffect } from "react";

/**
 * Returns a debounced version of `value` that only updates
 * after `delayMs` of inactivity.
 */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
