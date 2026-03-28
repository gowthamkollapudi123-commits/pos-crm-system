/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * useLowStockNotifications Hook Tests
 * 
 * Tests for the low stock notifications hook functionality.
 * Requirements: 11.6, 29.1, 29.5, 29.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useLowStockNotifications } from '../useLowStockNotifications';
import { useLowStockProducts } from '../useLowStockProducts';
import * as notifications from '@/utils/notifications';

// Mock dependencies
vi.mock('../useLowStockProducts');
vi.mock('@/utils/notifications', () => ({
  notifyWarning: vi.fn(),
}));

describe('useLowStockNotifications', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );

  it('should not show notification while loading', () => {
    vi.mocked(useLowStockProducts).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    renderHook(() => useLowStockNotifications(), { wrapper });

    expect(notifications.notifyWarning).not.toHaveBeenCalled();
  });

  it('should not show notification when no low stock products', async () => {
    vi.mocked(useLowStockProducts).mockReturnValue({
      data: { products: [], count: 0 },
      isLoading: false,
    } as any);

    renderHook(() => useLowStockNotifications(), { wrapper });

    await waitFor(() => {
      expect(notifications.notifyWarning).not.toHaveBeenCalled();
    });
  });

  it('should show notification when low stock products exist', async () => {
    vi.mocked(useLowStockProducts).mockReturnValue({
      data: { products: [{} as any, {} as any], count: 2 },
      isLoading: false,
    } as any);

    renderHook(() => useLowStockNotifications(), { wrapper });

    await waitFor(() => {
      expect(notifications.notifyWarning).toHaveBeenCalledWith(
        'Low Stock Alert',
        {
          description: '2 products are running low on stock',
          duration: 5000,
        }
      );
    });
  });

  it('should use singular text for 1 product', async () => {
    vi.mocked(useLowStockProducts).mockReturnValue({
      data: { products: [{} as any], count: 1 },
      isLoading: false,
    } as any);

    renderHook(() => useLowStockNotifications(), { wrapper });

    await waitFor(() => {
      expect(notifications.notifyWarning).toHaveBeenCalledWith(
        'Low Stock Alert',
        {
          description: '1 product is running low on stock',
          duration: 5000,
        }
      );
    });
  });

  it('should only show notification once per session', async () => {
    vi.mocked(useLowStockProducts).mockReturnValue({
      data: { products: [{} as any], count: 1 },
      isLoading: false,
    } as any);

    const { rerender } = renderHook(() => useLowStockNotifications(), { wrapper });

    await waitFor(() => {
      expect(notifications.notifyWarning).toHaveBeenCalledTimes(1);
    });

    // Rerender the hook
    rerender();

    // Should not call notification again
    expect(notifications.notifyWarning).toHaveBeenCalledTimes(1);
  });

  it('should not show notification if already shown in session', async () => {
    // Simulate notification already shown
    sessionStorage.setItem('lowStockNotificationShown', 'true');

    vi.mocked(useLowStockProducts).mockReturnValue({
      data: { products: [{} as any], count: 1 },
      isLoading: false,
    } as any);

    renderHook(() => useLowStockNotifications(), { wrapper });

    await waitFor(() => {
      expect(notifications.notifyWarning).not.toHaveBeenCalled();
    });
  });

  it('should set session storage flag after showing notification', async () => {
    vi.mocked(useLowStockProducts).mockReturnValue({
      data: { products: [{} as any], count: 1 },
      isLoading: false,
    } as any);

    renderHook(() => useLowStockNotifications(), { wrapper });

    await waitFor(() => {
      expect(sessionStorage.getItem('lowStockNotificationShown')).toBe('true');
    });
  });

  it('should auto-dismiss notification after 5 seconds', async () => {
    vi.mocked(useLowStockProducts).mockReturnValue({
      data: { products: [{} as any], count: 1 },
      isLoading: false,
    } as any);

    renderHook(() => useLowStockNotifications(), { wrapper });

    await waitFor(() => {
      expect(notifications.notifyWarning).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          duration: 5000,
        })
      );
    });
  });
});
