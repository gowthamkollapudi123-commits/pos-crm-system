/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/preserve-manual-memoization */
/**
 * Offline Management Hook
 * 
 * Provides offline/online status and sync functionality to components
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.8, 15.11, 15.12
 */

import { useEffect, useCallback, useRef } from 'react';
import { useOfflineStore } from '@/store';
import { getOfflineManager, SyncApiClient, SyncResult } from '@/services/offline.service';
import { SyncStatus } from '@/types/enums';

/**
 * Hook for managing offline state and synchronization
 */
export function useOffline(apiClient?: SyncApiClient) {
  const {
    isOnline,
    syncStatus,
    pendingTransactionsCount,
    lastSyncAt,
    setOnlineStatus,
    setSyncStatus,
    updateLastSync,
  } = useOfflineStore();

  const offlineManager = useRef(getOfflineManager());
  const syncQueueManager = useRef<ReturnType<ReturnType<typeof getOfflineManager>['getSyncQueueManager']> | null>(null);

  /**
   * Initialize offline manager and network monitoring
   * Requirement 15.1: Detect network connectivity status continuously
   */
  useEffect(() => {
    const manager = offlineManager.current;
    syncQueueManager.current = manager.getSyncQueueManager();

    // Initialize with status change callback
    manager.initialize(
      apiClient || createDefaultApiClient(),
      (online) => {
        setOnlineStatus(online);
      }
    );

    // Initial status
    setOnlineStatus(manager.getNetworkMonitor().isOnline());

    // Cleanup on unmount
    return () => {
      manager.cleanup();
    };
  }, [apiClient, setOnlineStatus]);

  /**
   * Update pending transaction count
   * Requirement 15.11: Display pending transaction count
   */
  useEffect(() => {
    const updateCount = async () => {
      if (syncQueueManager.current) {
        await syncQueueManager.current.getPendingCount();
        // Update store if needed (store manages its own count)
      }
    };

    updateCount();

    // Poll for count updates every 5 seconds
    const interval = setInterval(updateCount, 5000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Trigger manual synchronization
   * Requirement 15.12: Allow manual trigger of synchronization
   */
  const triggerSync = useCallback(async (): Promise<SyncResult> => {
    if (!isOnline) {
      return {
        success: false,
        message: 'Cannot sync while offline',
        synced: 0,
        failed: 0,
        errors: [],
      };
    }

    if (syncStatus === SyncStatus.SYNCING) {
      return {
        success: false,
        message: 'Sync already in progress',
        synced: 0,
        failed: 0,
        errors: [],
      };
    }

    setSyncStatus(SyncStatus.SYNCING);

    try {
      const result = await offlineManager.current.triggerSync(
        apiClient || createDefaultApiClient()
      );

      if (result.success) {
        setSyncStatus(SyncStatus.SUCCESS);
        updateLastSync();
      } else {
        setSyncStatus(SyncStatus.ERROR);
      }

      // Reset status after 3 seconds
      setTimeout(() => {
        setSyncStatus(SyncStatus.IDLE);
      }, 3000);

      return result;
    } catch (error) {
      setSyncStatus(SyncStatus.ERROR);
      
      setTimeout(() => {
        setSyncStatus(SyncStatus.IDLE);
      }, 3000);

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Sync failed',
        synced: 0,
        failed: 0,
        errors: [],
      };
    }
  }, [isOnline, syncStatus, apiClient, setSyncStatus, updateLastSync]);

  /**
   * Add item to sync queue
   */
  // eslint-disable-next-line react-hooks/immutability
  const addToQueue = useCallback(async (item: any) => {
    // eslint-disable-next-line react-hooks/immutability
    if (syncQueueManager.current) {
      await syncQueueManager.current.addToQueue(item);
    }
  }, []);

  /**
   * Get pending items count
   */
  const getPendingCount = useCallback(async (): Promise<number> => {
    if (syncQueueManager.current) {
      return await syncQueueManager.current.getPendingCount();
    }
    return 0;
  }, []);

  return {
    isOnline,
    syncStatus,
    pendingTransactionsCount,
    lastSyncAt,
    triggerSync,
    addToQueue,
    getPendingCount,
  };
}

/**
 * Create a default API client for sync operations
 * This is a placeholder - actual implementation will be in the API service layer
 */
function createDefaultApiClient(): SyncApiClient {
  return {
    async sync(item) {
      console.warn('Default API client used - implement actual sync logic');
      // Placeholder implementation
      throw new Error('API client not configured');
    },
  };
}
