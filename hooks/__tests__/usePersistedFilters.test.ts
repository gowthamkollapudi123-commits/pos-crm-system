/**
 * usePersistedFilters Hook Tests
 *
 * Requirements: 28.9, 28.10
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedFilters } from '../usePersistedFilters';

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

const defaults = { search: '', segment: '', page: 1 };

describe('usePersistedFilters', () => {
  beforeEach(() => {
    sessionStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with defaults when no stored value exists', () => {
      const { result } = renderHook(() =>
        usePersistedFilters('customers', defaults)
      );
      expect(result.current[0]).toEqual(defaults);
    });

    it('should restore filters from sessionStorage on mount', () => {
      const stored = { search: 'john', segment: 'VIP', page: 2 };
      sessionStorageMock.getItem.mockReturnValueOnce(JSON.stringify(stored));

      const { result } = renderHook(() =>
        usePersistedFilters('customers', defaults)
      );
      expect(result.current[0]).toEqual(stored);
    });

    it('should merge stored values with defaults for missing keys', () => {
      const stored = { search: 'jane' };
      sessionStorageMock.getItem.mockReturnValueOnce(JSON.stringify(stored));

      const { result } = renderHook(() =>
        usePersistedFilters('customers', defaults)
      );
      expect(result.current[0].search).toBe('jane');
      expect(result.current[0].segment).toBe('');
      expect(result.current[0].page).toBe(1);
    });

    it('should use defaults when stored JSON is invalid', () => {
      sessionStorageMock.getItem.mockReturnValueOnce('invalid-json{');

      const { result } = renderHook(() =>
        usePersistedFilters('customers', defaults)
      );
      expect(result.current[0]).toEqual(defaults);
    });
  });

  describe('setFilters', () => {
    it('should update filter state', () => {
      const { result } = renderHook(() =>
        usePersistedFilters('customers', defaults)
      );

      act(() => {
        result.current[1]({ search: 'alice', segment: 'VIP', page: 1 });
      });

      expect(result.current[0].search).toBe('alice');
      expect(result.current[0].segment).toBe('VIP');
    });

    it('should persist updated filters to sessionStorage', () => {
      const { result } = renderHook(() =>
        usePersistedFilters('customers', defaults)
      );

      act(() => {
        result.current[1]({ search: 'bob', segment: '', page: 1 });
      });

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'filters:customers',
        JSON.stringify({ search: 'bob', segment: '', page: 1 })
      );
    });

    it('should support functional updater', () => {
      const { result } = renderHook(() =>
        usePersistedFilters('customers', defaults)
      );

      act(() => {
        result.current[1]((prev) => ({ ...prev, page: prev.page + 1 }));
      });

      expect(result.current[0].page).toBe(2);
    });
  });

  describe('resetFilters', () => {
    it('should reset filters to defaults', () => {
      const { result } = renderHook(() =>
        usePersistedFilters('customers', defaults)
      );

      act(() => {
        result.current[1]({ search: 'test', segment: 'VIP', page: 3 });
      });

      act(() => {
        result.current[2]();
      });

      expect(result.current[0]).toEqual(defaults);
    });

    it('should remove the key from sessionStorage on reset', () => {
      const { result } = renderHook(() =>
        usePersistedFilters('customers', defaults)
      );

      act(() => {
        result.current[2]();
      });

      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('filters:customers');
    });
  });

  describe('page key isolation', () => {
    it('should use different storage keys for different pages', () => {
      const { result: r1 } = renderHook(() =>
        usePersistedFilters('customers', defaults)
      );
      const { result: r2 } = renderHook(() =>
        usePersistedFilters('products', defaults)
      );

      act(() => {
        r1.current[1]({ search: 'customer-search', segment: '', page: 1 });
      });

      act(() => {
        r2.current[1]({ search: 'product-search', segment: '', page: 1 });
      });

      expect(r1.current[0].search).toBe('customer-search');
      expect(r2.current[0].search).toBe('product-search');

      // Verify different storage keys were used
      const calls = sessionStorageMock.setItem.mock.calls;
      const customerCall = calls.find((c) => c[0] === 'filters:customers');
      const productCall = calls.find((c) => c[0] === 'filters:products');
      expect(customerCall).toBeDefined();
      expect(productCall).toBeDefined();
    });
  });
});
