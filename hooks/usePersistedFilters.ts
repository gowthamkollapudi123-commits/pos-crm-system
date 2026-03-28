/**
 * usePersistedFilters Hook
 *
 * Persists filter state to sessionStorage keyed by page name.
 * Restores filters on mount and clears on explicit reset.
 *
 * Requirements: 28.9, 28.10
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook that persists filter state to sessionStorage.
 *
 * @param pageKey  - Unique key identifying the page (e.g. "customers", "products")
 * @param defaults - Default filter values used on first load and after reset
 * @returns [filters, setFilters, resetFilters]
 */
export function usePersistedFilters<T extends Record<string, unknown>>(
  pageKey: string,
  defaults: T
): [T, (updater: T | ((prev: T) => T)) => void, () => void] {
  const storageKey = `filters:${pageKey}`;

  const [filters, setFiltersState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaults;
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        return { ...defaults, ...JSON.parse(stored) } as T;
      }
    } catch {
      // Ignore parse errors
    }
    return defaults;
  });

  // Persist to sessionStorage whenever filters change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(filters));
    } catch {
      // Ignore storage errors (e.g. private browsing quota)
    }
  }, [filters, storageKey]);

  const setFilters = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setFiltersState((prev) =>
        typeof updater === 'function' ? (updater as (prev: T) => T)(prev) : updater
      );
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFiltersState(defaults);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        // Ignore
      }
    }
  }, [defaults, storageKey]);

  return [filters, setFilters, resetFilters];
}
