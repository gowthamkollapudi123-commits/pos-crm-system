/**
 * Main Zustand Store
 * 
 * Combines all store slices into a single store
 * 
 * Requirements: 1.3, 22.1, 22.2, 22.3, 22.7, 22.8
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { OfflineState } from '@/types/state';
import { createOfflineSlice } from './slices/offline.slice';

/**
 * Combined store type
 * Add more slices as they are implemented
 */
type StoreState = OfflineState;

/**
 * Create the main application store
 */
export const useStore = create<StoreState>()(
  devtools(
    persist(
      (...args) => ({
        ...createOfflineSlice(...args),
      }),
      {
        name: 'pos-crm-storage',
        // Only persist certain fields
        partialize: (state) => ({
          lastSyncAt: state.lastSyncAt,
          // Don't persist online status or sync queue
        }),
      }
    ),
    {
      name: 'POS-CRM-Store',
    }
  )
);

/**
 * Offline state selectors
 */
export const useOfflineStore = () => {
  const isOnline = useStore((state) => state.isOnline);
  const syncStatus = useStore((state) => state.syncStatus);
  const pendingTransactionsCount = useStore((state) => state.pendingTransactionsCount);
  const lastSyncAt = useStore((state) => state.lastSyncAt);
  const syncQueue = useStore((state) => state.syncQueue);
  const setOnlineStatus = useStore((state) => state.setOnlineStatus);
  const setSyncStatus = useStore((state) => state.setSyncStatus);
  const addToSyncQueue = useStore((state) => state.addToSyncQueue);
  const removeFromSyncQueue = useStore((state) => state.removeFromSyncQueue);
  const clearSyncQueue = useStore((state) => state.clearSyncQueue);
  const updateLastSync = useStore((state) => state.updateLastSync);
  const triggerSync = useStore((state) => state.triggerSync);

  return {
    isOnline,
    syncStatus,
    pendingTransactionsCount,
    lastSyncAt,
    syncQueue,
    setOnlineStatus,
    setSyncStatus,
    addToSyncQueue,
    removeFromSyncQueue,
    clearSyncQueue,
    updateLastSync,
    triggerSync,
  };
};
