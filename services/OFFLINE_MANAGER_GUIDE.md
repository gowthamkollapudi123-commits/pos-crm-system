# Offline Manager Implementation Guide

## Overview

The Offline Manager provides comprehensive offline capability and synchronization for the POS CRM System. It handles network connectivity detection, queuing of offline operations, automatic synchronization, and conflict resolution.

## Requirements Implemented

- **15.1**: Detect network connectivity status continuously
- **15.2**: Display offline indicator when network becomes unavailable
- **15.3**: Display online indicator when network becomes available
- **15.7**: Store new transactions in the Sync_Queue while offline
- **15.8**: Automatically synchronize queued transactions when network becomes available
- **15.9**: Retry failed synchronization with exponential backoff
- **15.10**: Implement conflict resolution using last-write-wins strategy
- **15.11**: Display sync status and pending transaction count
- **15.12**: Allow manual trigger of synchronization
- **15.13**: Update Query_Cache with server responses after sync

## Architecture

### Components

1. **NetworkMonitor**: Detects and monitors network connectivity
2. **SyncQueueManager**: Manages the queue of pending operations
3. **ConflictResolver**: Resolves conflicts using last-write-wins strategy
4. **OfflineManager**: Main coordinator class

### Store Integration

- **Zustand Store**: Manages offline state (online status, sync status, pending count)
- **IndexedDB**: Persists sync queue items across browser sessions

### Hooks

- **useOffline**: Full offline management with sync capabilities
- **useNetworkStatus**: Simple network status monitoring

### UI Components

- **OfflineIndicator**: Shows online/offline status
- **SyncStatus**: Shows sync status and pending transaction count

## Usage Examples

### Basic Network Status Monitoring

```tsx
import { useNetworkStatus } from '@/hooks';
import { OfflineIndicator } from '@/components/offline';

function MyComponent() {
  const { isOnline } = useNetworkStatus();

  return (
    <div>
      <OfflineIndicator />
      {isOnline ? (
        <p>You are online</p>
      ) : (
        <p>You are offline - changes will sync when online</p>
      )}
    </div>
  );
}
```

### Full Offline Management with Sync

```tsx
import { useOffline } from '@/hooks';
import { SyncStatus } from '@/components/offline';

function Dashboard() {
  const {
    isOnline,
    syncStatus,
    pendingTransactionsCount,
    triggerSync,
    addToQueue,
  } = useOffline();

  const handleCreateTransaction = async (data) => {
    if (!isOnline) {
      // Add to sync queue for later
      await addToQueue({
        operation: 'create',
        storeName: 'transactions',
        data,
      });
    } else {
      // Process immediately
      await api.createTransaction(data);
    }
  };

  return (
    <div>
      <SyncStatus showSyncButton onSyncComplete={(success) => {
        console.log('Sync completed:', success);
      }} />
      
      {pendingTransactionsCount > 0 && (
        <p>{pendingTransactionsCount} transactions pending sync</p>
      )}
    </div>
  );
}
```

### Manual Sync Trigger

```tsx
import { useOffline } from '@/hooks';

function SyncButton() {
  const { triggerSync, isOnline } = useOffline();

  const handleSync = async () => {
    const result = await triggerSync();
    
    if (result.success) {
      console.log(`Synced ${result.synced} items`);
    } else {
      console.error(`Sync failed: ${result.message}`);
      console.error('Errors:', result.errors);
    }
  };

  return (
    <button onClick={handleSync} disabled={!isOnline}>
      Sync Now
    </button>
  );
}
```

### Adding Items to Sync Queue

```tsx
import { useOffline } from '@/hooks';
import { STORES } from '@/lib/indexeddb';

function CreateOrder() {
  const { addToQueue, isOnline } = useOffline();

  const handleSubmit = async (orderData) => {
    if (!isOnline) {
      // Queue for later sync
      await addToQueue({
        operation: 'create',
        storeName: STORES.TRANSACTIONS,
        data: orderData,
        endpoint: '/api/orders',
        method: 'POST',
      });
      
      // Also save to IndexedDB for offline access
      await db.create(STORES.TRANSACTIONS, orderData);
    } else {
      // Process immediately
      await api.createOrder(orderData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

## Sync Queue Item Structure

```typescript
interface SyncQueueItem {
  id: string;                    // Auto-generated unique ID
  operation: 'create' | 'update' | 'delete';
  storeName: StoreName;          // Target store (products, customers, transactions)
  data: unknown;                 // The data to sync
  timestamp: number;             // When item was queued
  retryCount: number;            // Number of retry attempts
  lastError?: string;            // Last error message if failed
  endpoint?: string;             // API endpoint to call
  method?: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
}
```

## Exponential Backoff Configuration

- **Initial Retry Delay**: 1 second
- **Maximum Retry Delay**: 60 seconds
- **Maximum Retry Count**: 5 attempts
- **Backoff Formula**: `delay = min(INITIAL_DELAY * 2^(retryCount - 1), MAX_DELAY)`

Example retry delays:
- Attempt 1: 1 second
- Attempt 2: 2 seconds
- Attempt 3: 4 seconds
- Attempt 4: 8 seconds
- Attempt 5: 16 seconds

## Conflict Resolution

The system uses a **last-write-wins** strategy based on timestamps:

```typescript
// Compares updatedAt or createdAt timestamps
// Keeps the record with the most recent timestamp
const resolved = conflictResolver.resolve(localRecord, remoteRecord);
```

## API Client Integration

To use the offline manager with your API client, implement the `SyncApiClient` interface:

```typescript
import { SyncApiClient, ExtendedSyncQueueItem } from '@/services/offline.service';
import { axiosInstance } from '@/lib/axios';

const apiClient: SyncApiClient = {
  async sync(item: ExtendedSyncQueueItem) {
    const { endpoint, method, data } = item;
    
    if (!endpoint || !method) {
      throw new Error('Missing endpoint or method');
    }

    // Make the API call
    const response = await axiosInstance({
      url: endpoint,
      method,
      data,
    });

    return response.data;
  },
};

// Use with the hook
const offline = useOffline(apiClient);
```

## Store State

The offline state is managed in Zustand:

```typescript
interface OfflineState {
  isOnline: boolean;                    // Current network status
  syncStatus: SyncStatus;               // Current sync status
  pendingTransactionsCount: number;     // Number of pending items
  lastSyncAt: string | null;            // Last successful sync timestamp
  syncQueue: SyncQueueItem[];           // In-memory queue (for display)
  
  // Actions
  setOnlineStatus: (isOnline: boolean) => void;
  setSyncStatus: (status: SyncStatus) => void;
  addToSyncQueue: (item: SyncQueueItem) => void;
  removeFromSyncQueue: (id: string) => void;
  clearSyncQueue: () => void;
  updateLastSync: () => void;
  triggerSync: () => Promise<void>;
}
```

## Best Practices

1. **Always check online status** before making API calls
2. **Queue operations when offline** to ensure no data loss
3. **Store data in IndexedDB** for offline access
4. **Handle sync errors gracefully** and inform users
5. **Use optimistic updates** for better UX
6. **Monitor pending count** to inform users of unsaved changes
7. **Test offline scenarios** thoroughly

## Testing Offline Functionality

### Simulate Offline Mode

In Chrome DevTools:
1. Open DevTools (F12)
2. Go to Network tab
3. Select "Offline" from the throttling dropdown

### Test Scenarios

1. **Go offline while creating a transaction**
   - Verify transaction is queued
   - Verify pending count increases
   - Go back online
   - Verify auto-sync occurs
   - Verify pending count decreases

2. **Manual sync trigger**
   - Queue multiple items
   - Click sync button
   - Verify all items sync
   - Verify success notification

3. **Sync failure and retry**
   - Simulate API error
   - Verify retry with backoff
   - Verify error status displayed

4. **Conflict resolution**
   - Create same record offline and online
   - Sync
   - Verify last-write-wins applied

## Troubleshooting

### Sync not triggering automatically

- Check if auto-sync is enabled: `offlineManager.isAutoSyncEnabled()`
- Verify network status is correctly detected
- Check browser console for errors

### Items stuck in queue

- Check retry count (max 5 attempts)
- Review error messages in queue items
- Manually clear queue if needed: `syncQueueManager.clearQueue()`

### Pending count not updating

- Verify IndexedDB is accessible
- Check if sync queue store is initialized
- Refresh the page to reinitialize

## Future Enhancements

- [ ] Batch sync operations for better performance
- [ ] Configurable retry strategies
- [ ] Sync priority levels
- [ ] Partial sync (sync specific items)
- [ ] Sync progress tracking
- [ ] Conflict resolution strategies (user choice, merge, etc.)
- [ ] Background sync using Service Workers
- [ ] Sync scheduling (sync at specific times)
