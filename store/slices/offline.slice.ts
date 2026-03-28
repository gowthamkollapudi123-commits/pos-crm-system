/**
 * Offline State Slice for Zustand
 * 
 * Manages offline/online status, sync queue, and synchronization state
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.11, 15.12
 */

import { StateCreator } from 'zustand';
import { OfflineState } from '@/types/state';
import { SyncStatus } from '@/types/enums';

/**
 * Create offline state slice
 */
export const createOfflineSlice: StateCreator<OfflineState> = (set, get) => ({
  // Initial state
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  syncStatus: SyncStatus.IDLE,
  pendingTransactionsCount: 0,
  lastSyncAt: null,
  syncQueue: [],

  // Actions
  setOnlineStatus: (isOnline: boolean) => {
    set({ isOnline });
  },

  setSyncStatus: (status: SyncStatus) => {
    set({ syncStatus: status });
  },

  addToSyncQueue: (item) => {
    set((state) => ({
      syncQueue: [...state.syncQueue, item],
      pendingTransactionsCount: state.pendingTransactionsCount + 1,
    }));
  },

  removeFromSyncQueue: (id: string) => {
    set((state) => ({
      syncQueue: state.syncQueue.filter((item) => item.id !== id),
      pendingTransactionsCount: Math.max(0, state.pendingTransactionsCount - 1),
    }));
  },

  clearSyncQueue: () => {
    set({
      syncQueue: [],
      pendingTransactionsCount: 0,
    });
  },

  updateLastSync: () => {
    set({
      lastSyncAt: new Date().toISOString(),
    });
  },

  triggerSync: async () => {
    const { isOnline, syncStatus } = get();

    // Don't sync if offline or already syncing
    if (!isOnline || syncStatus === SyncStatus.SYNCING) {
      return;
    }

    // This is a placeholder - actual sync logic will be implemented
    // in the hook that uses the offline service
    console.log('Sync triggered from store - implement in hook');
  },
});
