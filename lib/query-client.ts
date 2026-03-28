import { QueryClient, DefaultOptions } from '@tanstack/react-query';

/**
 * Default options for TanStack Query
 * Configured for optimal performance and user experience
 */
const queryConfig: DefaultOptions = {
  queries: {
    // Cache time: How long unused data stays in cache (5 minutes)
    gcTime: 5 * 60 * 1000,
    
    // Stale time: How long data is considered fresh (1 minute)
    // After this, data is refetched in the background
    staleTime: 1 * 60 * 1000,
    
    // Retry failed requests 3 times with exponential backoff
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Refetch on window focus for fresh data
    refetchOnWindowFocus: true,
    
    // Don't refetch on mount if data is still fresh
    refetchOnMount: false,
    
    // Refetch on network reconnection
    refetchOnReconnect: true,
  },
  mutations: {
    // Retry mutations once on failure
    retry: 1,
    retryDelay: 1000,
  },
};

/**
 * Create a new QueryClient instance
 * Use this function to create a client for the QueryClientProvider
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: queryConfig,
  });
}

/**
 * Singleton QueryClient instance for client-side usage
 * This ensures we use the same client instance across the app
 */
let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always create a new client
    return createQueryClient();
  } else {
    // Browser: create client once and reuse
    if (!browserQueryClient) {
      browserQueryClient = createQueryClient();
    }
    return browserQueryClient;
  }
}
