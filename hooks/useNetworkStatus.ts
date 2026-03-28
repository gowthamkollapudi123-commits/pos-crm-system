/**
 * Network Status Hook
 * 
 * Simple hook for monitoring online/offline status
 * 
 * Requirements: 15.1, 15.2, 15.3
 */

import { useEffect } from 'react';
import { useOfflineStore } from '@/store';

/**
 * Hook for monitoring network status
 * 
 * @returns isOnline - Current network status
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isOnline } = useNetworkStatus();
 *   
 *   return (
 *     <div>
 *       {isOnline ? 'Online' : 'Offline'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useNetworkStatus() {
  const { isOnline, setOnlineStatus } = useOfflineStore();

  useEffect(() => {
    // Set initial status
    setOnlineStatus(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  return { isOnline };
}
