/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * useNetworkStatus Hook Tests
 * Requirements: 8.1, 8.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from '../useNetworkStatus';

// Mock the offline store
vi.mock('@/store', () => ({
  useOfflineStore: vi.fn(() => ({
    isOnline: true,
    setOnlineStatus: vi.fn(),
  })),
}));

describe('useNetworkStatus', () => {
  let mockSetOnlineStatus: ReturnType<typeof vi.fn>;
  let mockIsOnline: boolean;

  beforeEach(async () => {
    mockSetOnlineStatus = vi.fn((value: boolean) => {
      mockIsOnline = value;
    });
    mockIsOnline = true;

    const { useOfflineStore } = await import('@/store');
    (useOfflineStore as any).mockReturnValue({
      isOnline: mockIsOnline,
      setOnlineStatus: mockSetOnlineStatus,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns isOnline from the store', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current).toHaveProperty('isOnline');
  });

  it('sets initial status from navigator.onLine on mount', () => {
    renderHook(() => useNetworkStatus());
    expect(mockSetOnlineStatus).toHaveBeenCalledWith(navigator.onLine);
  });

  it('calls setOnlineStatus(true) when online event fires', () => {
    renderHook(() => useNetworkStatus());
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(mockSetOnlineStatus).toHaveBeenCalledWith(true);
  });

  it('calls setOnlineStatus(false) when offline event fires', () => {
    renderHook(() => useNetworkStatus());
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(mockSetOnlineStatus).toHaveBeenCalledWith(false);
  });

  it('removes event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useNetworkStatus());
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });
});
