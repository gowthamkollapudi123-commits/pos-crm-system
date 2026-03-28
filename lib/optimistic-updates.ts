import { QueryClient, QueryKey } from '@tanstack/react-query';

/**
 * Optimistic update context
 * Contains the previous data for rollback on error
 */
interface OptimisticContext<T = unknown> {
  previousData?: T;
}

/**
 * Optimistic update utilities
 * Provides patterns for implementing optimistic updates with automatic rollback
 */
export class OptimisticUpdates {
  constructor(private queryClient: QueryClient) {}

  /**
   * Optimistically update a single item in a list
   * 
   * @example
   * ```ts
   * const context = await optimisticUpdates.updateItemInList(
   *   ['products'],
   *   updatedProduct,
   *   (item) => item.id === updatedProduct.id
   * );
   * ```
   */
  async updateItemInList<T extends { id: string }>(
    queryKey: QueryKey,
    updatedItem: T,
    matcher: (item: T) => boolean
  ): Promise<OptimisticContext<T[]>> {
    // Cancel outgoing refetches
    await this.queryClient.cancelQueries({ queryKey });

    // Snapshot the previous value
    const previousData = this.queryClient.getQueryData<T[]>(queryKey);

    // Optimistically update to the new value
    if (previousData) {
      this.queryClient.setQueryData<T[]>(
        queryKey,
        previousData.map((item) => (matcher(item) ? updatedItem : item))
      );
    }

    return { previousData };
  }

  /**
   * Optimistically add an item to a list
   * 
   * @example
   * ```ts
   * const context = await optimisticUpdates.addItemToList(
   *   ['products'],
   *   newProduct
   * );
   * ```
   */
  async addItemToList<T>(
    queryKey: QueryKey,
    newItem: T
  ): Promise<OptimisticContext<T[]>> {
    await this.queryClient.cancelQueries({ queryKey });

    const previousData = this.queryClient.getQueryData<T[]>(queryKey);

    if (previousData) {
      this.queryClient.setQueryData<T[]>(queryKey, [...previousData, newItem]);
    }

    return { previousData };
  }

  /**
   * Optimistically remove an item from a list
   * 
   * @example
   * ```ts
   * const context = await optimisticUpdates.removeItemFromList(
   *   ['products'],
   *   (item) => item.id === productId
   * );
   * ```
   */
  async removeItemFromList<T>(
    queryKey: QueryKey,
    matcher: (item: T) => boolean
  ): Promise<OptimisticContext<T[]>> {
    await this.queryClient.cancelQueries({ queryKey });

    const previousData = this.queryClient.getQueryData<T[]>(queryKey);

    if (previousData) {
      this.queryClient.setQueryData<T[]>(
        queryKey,
        previousData.filter((item) => !matcher(item))
      );
    }

    return { previousData };
  }

  /**
   * Optimistically update a single entity
   * 
   * @example
   * ```ts
   * const context = await optimisticUpdates.updateEntity(
   *   ['products', productId],
   *   updatedProduct
   * );
   * ```
   */
  async updateEntity<T>(
    queryKey: QueryKey,
    updatedData: Partial<T>
  ): Promise<OptimisticContext<T>> {
    await this.queryClient.cancelQueries({ queryKey });

    const previousData = this.queryClient.getQueryData<T>(queryKey);

    if (previousData) {
      this.queryClient.setQueryData<T>(queryKey, {
        ...previousData,
        ...updatedData,
      });
    }

    return { previousData };
  }

  /**
   * Rollback optimistic update on error
   * 
   * @example
   * ```ts
   * onError: (err, variables, context) => {
   *   optimisticUpdates.rollback(['products'], context);
   * }
   * ```
   */
  rollback<T>(queryKey: QueryKey, context?: OptimisticContext<T>): void {
    if (context?.previousData !== undefined) {
      this.queryClient.setQueryData(queryKey, context.previousData);
    }
  }

  /**
   * Invalidate and refetch after successful mutation
   * 
   * @example
   * ```ts
   * onSettled: () => {
   *   optimisticUpdates.settleQuery(['products']);
   * }
   * ```
   */
  async settleQuery(queryKey: QueryKey): Promise<void> {
    await this.queryClient.invalidateQueries({ queryKey });
  }
}

/**
 * Create an OptimisticUpdates instance
 */
export function createOptimisticUpdates(queryClient: QueryClient): OptimisticUpdates {
  return new OptimisticUpdates(queryClient);
}

/**
 * Mutation options factory for common optimistic update patterns
 */
export const optimisticMutationOptions = {
  /**
   * Options for updating an item in a list
   */
  updateInList: <TData, TVariables extends { id: string }>(
    queryKey: QueryKey,
    queryClient: QueryClient
  ) => ({
    onMutate: async (variables: TVariables) => {
      const optimistic = createOptimisticUpdates(queryClient);
      return optimistic.updateItemInList(
        queryKey,
        variables as unknown as TData & { id: string },
        (item) => item.id === variables.id
      );
    },
    onError: (_err: unknown, _variables: TVariables, context: OptimisticContext<TData[]> | undefined) => {
      const optimistic = createOptimisticUpdates(queryClient);
      optimistic.rollback(queryKey, context);
    },
    onSettled: () => {
      const optimistic = createOptimisticUpdates(queryClient);
      return optimistic.settleQuery(queryKey);
    },
  }),

  /**
   * Options for adding an item to a list
   */
  addToList: <TData, TVariables>(
    queryKey: QueryKey,
    queryClient: QueryClient
  ) => ({
    onMutate: async (variables: TVariables) => {
      const optimistic = createOptimisticUpdates(queryClient);
      return optimistic.addItemToList(queryKey, variables as unknown as TData);
    },
    onError: (_err: unknown, _variables: TVariables, context: OptimisticContext<TData[]> | undefined) => {
      const optimistic = createOptimisticUpdates(queryClient);
      optimistic.rollback(queryKey, context);
    },
    onSettled: () => {
      const optimistic = createOptimisticUpdates(queryClient);
      return optimistic.settleQuery(queryKey);
    },
  }),

  /**
   * Options for removing an item from a list
   */
  removeFromList: <TData extends { id: string }, TVariables extends { id: string }>(
    queryKey: QueryKey,
    queryClient: QueryClient
  ) => ({
    onMutate: async (variables: TVariables) => {
      const optimistic = createOptimisticUpdates(queryClient);
      return optimistic.removeItemFromList<TData>(
        queryKey,
        (item) => item.id === variables.id
      );
    },
    onError: (_err: unknown, _variables: TVariables, context: OptimisticContext<TData[]> | undefined) => {
      const optimistic = createOptimisticUpdates(queryClient);
      optimistic.rollback(queryKey, context);
    },
    onSettled: () => {
      const optimistic = createOptimisticUpdates(queryClient);
      return optimistic.settleQuery(queryKey);
    },
  }),
};
