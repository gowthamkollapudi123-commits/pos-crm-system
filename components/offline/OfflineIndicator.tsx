/**
 * Offline Indicator Component
 * 
 * Displays online/offline status indicator
 * 
 * Requirements: 15.2, 15.3
 */

'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff, Wifi } from 'lucide-react';

interface OfflineIndicatorProps {
  className?: string;
  showOnlineStatus?: boolean;
}

/**
 * Component that displays network connectivity status
 * 
 * Requirement 15.2: Display offline indicator when network becomes unavailable
 * Requirement 15.3: Display online indicator when network becomes available
 */
export function OfflineIndicator({ 
  className = '', 
  showOnlineStatus = false 
}: OfflineIndicatorProps) {
  const { isOnline } = useNetworkStatus();

  // Only show indicator when offline, unless showOnlineStatus is true
  if (isOnline && !showOnlineStatus) {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
        isOnline
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
      } ${className}`}
      role="status"
      aria-live="polite"
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" aria-hidden="true" />
          <span>Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" aria-hidden="true" />
          <span>Offline - Changes will sync when online</span>
        </>
      )}
    </div>
  );
}
