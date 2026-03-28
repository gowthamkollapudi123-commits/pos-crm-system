/**
 * useLowStockNotifications Hook
 * 
 * Custom hook to display low stock notifications on app load.
 * Shows toast notification if low stock products exist.
 * Only shows once per session to avoid spam.
 * 
 * Requirements: 11.6, 29.1, 29.5, 29.6
 */

'use client';

import { useEffect } from 'react';
import { useLowStockProducts } from './useLowStockProducts';
import { notifyWarning } from '@/utils/notifications';

const SESSION_KEY = 'lowStockNotificationShown';

/**
 * Hook to display low stock notifications
 * Automatically checks for low stock products and shows notification
 * Only shows once per session using sessionStorage
 */
export function useLowStockNotifications() {
  const { data, isLoading } = useLowStockProducts();

  useEffect(() => {
    // Don't show notification if still loading
    if (isLoading) return;

    // Check if notification was already shown this session
    const notificationShown = sessionStorage.getItem(SESSION_KEY);
    if (notificationShown === 'true') return;

    // Check if there are low stock products
    const count = data?.count || 0;
    if (count === 0) return;

    // Show notification
    notifyWarning('Low Stock Alert', {
      description: `${count} ${count === 1 ? 'product is' : 'products are'} running low on stock`,
      duration: 5000, // Auto-dismiss after 5 seconds
    });

    // Mark notification as shown for this session
    sessionStorage.setItem(SESSION_KEY, 'true');
  }, [data, isLoading]);
}
