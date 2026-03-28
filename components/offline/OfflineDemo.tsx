/**
 * Offline Manager Demo Component
 * 
 * Example component demonstrating offline functionality
 * This can be used for testing and as a reference implementation
 */

'use client';

import { useState } from 'react';
import { useOffline } from '@/hooks/useOffline';
import { OfflineIndicator } from './OfflineIndicator';
import { SyncStatus } from './SyncStatus';
import { STORES } from '@/lib/indexeddb';
import { Button } from '@/components/ui/button';

export function OfflineDemo() {
  const {
    isOnline,
    syncStatus,
    pendingTransactionsCount,
    lastSyncAt,
    triggerSync,
    addToQueue,
    getPendingCount,
  } = useOffline();

  const [message, setMessage] = useState<string>('');

  const handleAddToQueue = async () => {
    try {
      await addToQueue({
        operation: 'create',
        storeName: STORES.TRANSACTIONS,
        data: {
          id: `test-${Date.now()}`,
          orderNumber: `ORD-${Date.now()}`,
          amount: 100,
          createdAt: new Date().toISOString(),
        },
      });
      
      const count = await getPendingCount();
      setMessage(`Added to queue. Pending: ${count}`);
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleManualSync = async () => {
    setMessage('Syncing...');
    const result = await triggerSync();
    
    if (result.success) {
      setMessage(`Sync successful! Synced ${result.synced} items`);
    } else {
      setMessage(`Sync failed: ${result.message}`);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Offline Manager Demo</h1>

      {/* Status Indicators */}
      <div className="space-y-4">
        <OfflineIndicator showOnlineStatus />
        <SyncStatus showSyncButton onSyncComplete={(success) => {
          setMessage(success ? 'Sync completed!' : 'Sync failed!');
        }} />
      </div>

      {/* Info Display */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <div className="flex justify-between">
          <span className="font-medium">Network Status:</span>
          <span className={isOnline ? 'text-green-600' : 'text-yellow-600'}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Sync Status:</span>
          <span>{syncStatus}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Pending Items:</span>
          <span>{pendingTransactionsCount}</span>
        </div>
        {lastSyncAt && (
          <div className="flex justify-between">
            <span className="font-medium">Last Sync:</span>
            <span className="text-sm text-gray-600">
              {new Date(lastSyncAt).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={handleAddToQueue}
          className="w-full"
        >
          Add Test Item to Queue
        </Button>

        <Button
          onClick={handleManualSync}
          disabled={!isOnline || pendingTransactionsCount === 0}
          variant="outline"
          className="w-full"
        >
          Manual Sync
        </Button>
      </div>

      {/* Message Display */}
      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-md">
          {message}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Testing Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Open Chrome DevTools (F12)</li>
          <li>Go to Network tab</li>
          <li>Select &quot;Offline&quot; from throttling dropdown</li>
          <li>Click &quot;Add Test Item to Queue&quot;</li>
          <li>See pending count increase</li>
          <li>Go back online</li>
          <li>Watch auto-sync or click &quot;Manual Sync&quot;</li>
        </ol>
      </div>
    </div>
  );
}
