/**
 * Offline Manager Service
 * 
 * Handles network connectivity detection and synchronization of offline operations.
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.7, 15.8, 15.9, 15.10, 15.11, 15.12, 15.13
 */

import { SyncQueueItem, STORES } from '@/lib/indexeddb';
import * as db from '@/lib/indexeddb';

// Exponential backoff configuration
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 60000; // 60 seconds
const MAX_RETRY_COUNT = 5;

// Sync queue item with extended metadata
export interface ExtendedSyncQueueItem extends SyncQueueItem {
  endpoint?: string;
  method?: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
}

/**
 * Network connectivity detection
 * Requirement 15.1: Detect network connectivity status continuously
 */
export class NetworkMonitor {
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private isMonitoring = false;

  constructor() {
    this.handleOnline = this.handleOnline.bind(this);
    this.handleOffline = this.handleOffline.bind(this);
  }

  /**
   * Start monitoring network status
   */
  start(): void {
    if (this.isMonitoring) return;

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    this.isMonitoring = true;

    // Initial status check
    this.notifyListeners(navigator.onLine);
  }

  /**
   * Stop monitoring network status
   */
  stop(): void {
    if (!this.isMonitoring) return;

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.isMonitoring = false;
  }

  /**
   * Subscribe to network status changes
   */
  subscribe(callback: (isOnline: boolean) => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get current online status
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  private handleOnline(): void {
    this.notifyListeners(true);
  }

  private handleOffline(): void {
    this.notifyListeners(false);
  }

  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach(callback => {
      try {
        callback(isOnline);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }
}

/**
 * Sync Queue Manager
 * Handles queuing and synchronization of offline operations
 * Requirements: 15.7, 15.8, 15.9, 15.10, 15.11, 15.12, 15.13
 */
export class SyncQueueManager {
  private isSyncing = false;
  private syncListeners: Set<(status: 'syncing' | 'success' | 'error') => void> = new Set();

  /**
   * Add an operation to the sync queue
   * Requirement 15.7: Store new transactions in the Sync_Queue
   */
  async addToQueue(item: Omit<ExtendedSyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const queueItem: ExtendedSyncQueueItem = {
      ...item,
      id: this.generateId(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    try {
      await db.create(STORES.SYNC_QUEUE, queueItem);
    } catch (error) {
      console.error('Failed to add item to sync queue:', error);
      throw new Error('Failed to queue operation for sync');
    }
  }

  /**
   * Get all pending items in the sync queue
   */
  async getPendingItems(): Promise<ExtendedSyncQueueItem[]> {
    try {
      const items = await db.getAll(STORES.SYNC_QUEUE);
      return items as ExtendedSyncQueueItem[];
    } catch (error) {
      console.error('Failed to get pending sync items:', error);
      return [];
    }
  }

  /**
   * Get count of pending items
   * Requirement 15.11: Display pending transaction count
   */
  async getPendingCount(): Promise<number> {
    try {
      return await db.count(STORES.SYNC_QUEUE);
    } catch (error) {
      console.error('Failed to count pending items:', error);
      return 0;
    }
  }

  /**
   * Synchronize all pending items
   * Requirement 15.8: Automatically synchronize queued transactions
   * Requirement 15.9: Retry with exponential backoff
   * Requirement 15.13: Update Query_Cache with server responses
   */
  async syncAll(apiClient: SyncApiClient): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        message: 'Sync already in progress',
        synced: 0,
        failed: 0,
        errors: [],
      };
    }

    this.isSyncing = true;
    this.notifySyncListeners('syncing');

    const result: SyncResult = {
      success: true,
      message: '',
      synced: 0,
      failed: 0,
      errors: [],
    };

    try {
      const items = await this.getPendingItems();
      
      if (items.length === 0) {
        result.message = 'No items to sync';
        this.notifySyncListeners('success');
        return result;
      }

      // Sort by timestamp to maintain order
      items.sort((a, b) => a.timestamp - b.timestamp);

      for (const item of items) {
        try {
          await this.syncItem(item, apiClient);
          await db.deleteRecord(STORES.SYNC_QUEUE, item.id);
          result.synced++;
        } catch (error) {
          // Retry logic with exponential backoff
          const shouldRetry = await this.handleSyncError(item, error);
          
          if (!shouldRetry) {
            result.failed++;
            result.errors.push({
              itemId: item.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }

      result.success = result.failed === 0;
      result.message = result.success 
        ? `Successfully synced ${result.synced} items`
        : `Synced ${result.synced} items, ${result.failed} failed`;

      this.notifySyncListeners(result.success ? 'success' : 'error');
    } catch (error) {
      result.success = false;
      result.message = error instanceof Error ? error.message : 'Sync failed';
      this.notifySyncListeners('error');
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Sync a single item
   */
  private async syncItem(item: ExtendedSyncQueueItem, apiClient: SyncApiClient): Promise<void> {
    // Delegate to API client for actual sync
    await apiClient.sync(item);
  }

  /**
   * Handle sync error with retry logic
   * Requirement 15.9: Retry with exponential backoff
   */
  private async handleSyncError(item: ExtendedSyncQueueItem, error: unknown): Promise<boolean> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    item.retryCount++;
    item.lastError = errorMessage;

    // Check if we should retry
    if (item.retryCount >= MAX_RETRY_COUNT) {
      console.error(`Max retries reached for item ${item.id}:`, errorMessage);
      return false;
    }

    // Calculate exponential backoff delay
    const delay = Math.min(
      INITIAL_RETRY_DELAY * Math.pow(2, item.retryCount - 1),
      MAX_RETRY_DELAY
    );

    console.warn(`Sync failed for item ${item.id}, retrying in ${delay}ms (attempt ${item.retryCount}/${MAX_RETRY_COUNT})`);

    // Update item in queue with new retry count and error
    try {
      await db.update(STORES.SYNC_QUEUE, item);
    } catch (updateError) {
      console.error('Failed to update sync queue item:', updateError);
    }

    // Schedule retry
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return true;
  }

  /**
   * Clear all items from sync queue
   */
  async clearQueue(): Promise<void> {
    try {
      await db.clearStore(STORES.SYNC_QUEUE);
    } catch (error) {
      console.error('Failed to clear sync queue:', error);
      throw error;
    }
  }

  /**
   * Remove a specific item from the queue
   */
  async removeItem(id: string): Promise<void> {
    try {
      await db.deleteRecord(STORES.SYNC_QUEUE, id);
    } catch (error) {
      console.error('Failed to remove item from sync queue:', error);
      throw error;
    }
  }

  /**
   * Subscribe to sync status changes
   */
  subscribeSyncStatus(callback: (status: 'syncing' | 'success' | 'error') => void): () => void {
    this.syncListeners.add(callback);
    
    return () => {
      this.syncListeners.delete(callback);
    };
  }

  private notifySyncListeners(status: 'syncing' | 'success' | 'error'): void {
    this.syncListeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in sync status listener:', error);
      }
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Conflict Resolution
 * Requirement 15.10: Use last-write-wins strategy
 */
export class ConflictResolver {
  /**
   * Resolve conflict using last-write-wins strategy
   * Compares timestamps and keeps the most recent version
   */
  resolve<T extends { updatedAt?: string; createdAt?: string }>(
    local: T,
    remote: T
  ): T {
    const localTime = this.getTimestamp(local);
    const remoteTime = this.getTimestamp(remote);

    // Last write wins
    return localTime > remoteTime ? local : remote;
  }

  private getTimestamp(item: { updatedAt?: string; createdAt?: string }): number {
    const timestamp = item.updatedAt || item.createdAt;
    return timestamp ? new Date(timestamp).getTime() : 0;
  }
}

/**
 * Offline Manager
 * Main class that coordinates network monitoring and sync operations
 */
export class OfflineManager {
  private networkMonitor: NetworkMonitor;
  private syncQueueManager: SyncQueueManager;
  private conflictResolver: ConflictResolver;
  private autoSyncEnabled = true;

  constructor() {
    this.networkMonitor = new NetworkMonitor();
    this.syncQueueManager = new SyncQueueManager();
    this.conflictResolver = new ConflictResolver();
  }

  /**
   * Initialize offline manager
   * Requirement 15.1: Detect network connectivity status continuously
   * Requirement 15.8: Automatically synchronize when network becomes available
   */
  initialize(apiClient: SyncApiClient, onStatusChange?: (isOnline: boolean) => void): void {
    // Start network monitoring
    this.networkMonitor.start();

    // Subscribe to network status changes
    this.networkMonitor.subscribe((isOnline) => {
      if (onStatusChange) {
        onStatusChange(isOnline);
      }

      // Auto-sync when coming back online
      if (isOnline && this.autoSyncEnabled) {
        this.triggerSync(apiClient).catch(error => {
          console.error('Auto-sync failed:', error);
        });
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.networkMonitor.stop();
  }

  /**
   * Get network monitor instance
   */
  getNetworkMonitor(): NetworkMonitor {
    return this.networkMonitor;
  }

  /**
   * Get sync queue manager instance
   */
  getSyncQueueManager(): SyncQueueManager {
    return this.syncQueueManager;
  }

  /**
   * Get conflict resolver instance
   */
  getConflictResolver(): ConflictResolver {
    return this.conflictResolver;
  }

  /**
   * Trigger manual sync
   * Requirement 15.12: Allow manual trigger of synchronization
   */
  async triggerSync(apiClient: SyncApiClient): Promise<SyncResult> {
    if (!this.networkMonitor.isOnline()) {
      return {
        success: false,
        message: 'Cannot sync while offline',
        synced: 0,
        failed: 0,
        errors: [],
      };
    }

    return await this.syncQueueManager.syncAll(apiClient);
  }

  /**
   * Enable or disable auto-sync
   */
  setAutoSync(enabled: boolean): void {
    this.autoSyncEnabled = enabled;
  }

  /**
   * Check if auto-sync is enabled
   */
  isAutoSyncEnabled(): boolean {
    return this.autoSyncEnabled;
  }
}

// Type definitions
export interface SyncResult {
  success: boolean;
  message: string;
  synced: number;
  failed: number;
  errors: Array<{ itemId: string; error: string }>;
}

export interface SyncApiClient {
  sync(item: ExtendedSyncQueueItem): Promise<void>;
}

// Singleton instance
let offlineManagerInstance: OfflineManager | null = null;

/**
 * Get singleton instance of OfflineManager
 */
export function getOfflineManager(): OfflineManager {
  if (!offlineManagerInstance) {
    offlineManagerInstance = new OfflineManager();
  }
  return offlineManagerInstance;
}

/**
 * Reset singleton instance (useful for testing)
 */
export function resetOfflineManager(): void {
  if (offlineManagerInstance) {
    offlineManagerInstance.cleanup();
    offlineManagerInstance = null;
  }
}
