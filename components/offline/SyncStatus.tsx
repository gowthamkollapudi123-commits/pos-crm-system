/**
 * Sync Status Component
 * 
 * Displays synchronization status and pending transaction count
 * 
 * Requirements: 15.11, 15.12
 */

'use client';

import { useOffline } from '@/hooks/useOffline';
import { SyncStatus as SyncStatusEnum } from '@/types/enums';
import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SyncStatusProps {
  className?: string;
  showSyncButton?: boolean;
  onSyncComplete?: (success: boolean) => void;
}

/**
 * Component that displays sync status and pending transaction count
 * 
 * Requirement 15.11: Display sync status and pending transaction count
 * Requirement 15.12: Allow manual trigger of synchronization
 */
export function SyncStatus({ 
  className = '', 
  showSyncButton = true,
  onSyncComplete 
}: SyncStatusProps) {
  const {
    isOnline,
    syncStatus,
    pendingTransactionsCount,
    lastSyncAt,
    triggerSync,
  } = useOffline();

  const handleSync = async () => {
    const result = await triggerSync();
    if (onSyncComplete) {
      onSyncComplete(result.success);
    }
  };

  const isSyncing = syncStatus === SyncStatusEnum.SYNCING;
  const hasError = syncStatus === SyncStatusEnum.ERROR;
  const isSuccess = syncStatus === SyncStatusEnum.SUCCESS;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Pending count */}
      {pendingTransactionsCount > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-amber-500" aria-hidden="true" />
          <span className="text-gray-700">
            {pendingTransactionsCount} pending {pendingTransactionsCount === 1 ? 'item' : 'items'}
          </span>
        </div>
      )}

      {/* Sync status */}
      <div className="flex items-center gap-2 text-sm">
        {isSyncing && (
          <>
            <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" aria-hidden="true" />
            <span className="text-gray-700">Syncing...</span>
          </>
        )}
        
        {isSuccess && (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
            <span className="text-gray-700">Synced</span>
          </>
        )}
        
        {hasError && (
          <>
            <XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
            <span className="text-gray-700">Sync failed</span>
          </>
        )}

        {!isSyncing && !isSuccess && !hasError && lastSyncAt && (
          <span className="text-gray-500 text-xs">
            Last synced: {formatLastSync(lastSyncAt)}
          </span>
        )}
      </div>

      {/* Manual sync button */}
      {showSyncButton && isOnline && pendingTransactionsCount > 0 && (
        <Button
          onClick={handleSync}
          disabled={isSyncing}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync Now
        </Button>
      )}
    </div>
  );
}

/**
 * Format last sync timestamp
 */
function formatLastSync(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
