import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { createQueryInvalidation } from '@/lib/query-invalidation';
import { createOptimisticUpdates } from '@/lib/optimistic-updates';

/**
 * Hook to access query utilities
 * Provides easy access to invalidation and optimistic update helpers
 * 
 * @example
 * ```tsx
 * const { invalidation, optimistic } = useQueryUtils();
 * 
 * // Invalidate products after mutation
 * await invalidation.invalidateProducts();
 * 
 * // Optimistic update
 * const context = await optimistic.updateItemInList(
 *   ['products'],
 *   updatedProduct,
 *   (item) => item.id === updatedProduct.id
 * );
 * ```
 */
export function useQueryUtils() {
  const queryClient = useQueryClient();

  const invalidation = useMemo(
    () => createQueryInvalidation(queryClient),
    [queryClient]
  );

  const optimistic = useMemo(
    () => createOptimisticUpdates(queryClient),
    [queryClient]
  );

  return {
    queryClient,
    invalidation,
    optimistic,
  };
}
