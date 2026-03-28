# TanStack Query Configuration

This document explains the TanStack Query configuration for the POS CRM System.

## Overview

TanStack Query (formerly React Query) is configured to provide optimal server state management with intelligent caching, automatic refetching, and optimistic updates.

## Configuration

### Cache and Stale Time

Located in `lib/query-client.ts`:

- **Cache Time (gcTime)**: 5 minutes
  - How long unused data stays in memory
  - After this period, data is garbage collected
  
- **Stale Time**: 1 minute
  - How long data is considered fresh
  - After this, data is refetched in the background on next access
  - Prevents unnecessary refetches for frequently accessed data

### Retry Strategy

- **Queries**: 3 retries with exponential backoff
  - Delay formula: `Math.min(1000 * 2^attemptIndex, 30000)`
  - Max delay: 30 seconds
  
- **Mutations**: 1 retry with 1 second delay

### Refetch Behavior

- **On Window Focus**: Enabled
  - Ensures data is fresh when user returns to the tab
  
- **On Mount**: Disabled
  - Prevents redundant fetches if data is still fresh
  
- **On Reconnect**: Enabled
  - Refetches data when network connection is restored

## Query Keys

Query keys are organized by domain in `lib/query-invalidation.ts`:

```typescript
import { QueryKeys } from '@/lib/query-invalidation';

// Examples
QueryKeys.products          // ['products']
QueryKeys.product('123')    // ['products', '123']
QueryKeys.customers         // ['customers']
QueryKeys.dashboard         // ['dashboard']
```

### Key Structure

- Use arrays for hierarchical organization
- Include parameters in the key for proper caching
- Follow the pattern: `[domain, ...identifiers, ...filters]`

## Query Invalidation

The `QueryInvalidation` class provides methods to invalidate cached data:

```typescript
import { useQueryUtils } from '@/hooks/useQueryUtils';

function MyComponent() {
  const { invalidation } = useQueryUtils();
  
  // Invalidate all products
  await invalidation.invalidateProducts();
  
  // Invalidate specific product
  await invalidation.invalidateProduct('123');
  
  // Invalidate after transaction
  await invalidation.invalidateAfterTransaction('customerId');
  
  // Clear all cache on tenant switch
  await invalidation.invalidateAllOnTenantSwitch();
}
```

### Available Invalidation Methods

- `invalidateProducts()` - All product queries
- `invalidateProduct(id)` - Specific product
- `invalidateCustomers()` - All customer queries
- `invalidateCustomer(id)` - Specific customer and history
- `invalidateOrders()` - All order queries
- `invalidateTransactions()` - All transaction queries
- `invalidateDashboard()` - Dashboard metrics and charts
- `invalidateLeads()` - All lead queries
- `invalidateSettings()` - Settings queries
- `invalidateUsers()` - All user queries
- `invalidateAfterTransaction(customerId?)` - Multiple related queries
- `invalidateAfterInventoryChange()` - Products and dashboard
- `invalidateAllOnTenantSwitch()` - Complete cache clear

## Optimistic Updates

Optimistic updates provide instant UI feedback by updating the cache before the server responds.

### Basic Pattern

```typescript
import { useMutation } from '@tanstack/react-query';
import { useQueryUtils } from '@/hooks/useQueryUtils';
import { QueryKeys } from '@/lib/query-invalidation';

function useUpdateProduct() {
  const { optimistic, queryClient } = useQueryUtils();
  
  return useMutation({
    mutationFn: updateProductApi,
    onMutate: async (updatedProduct) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: QueryKeys.products 
      });
      
      // Snapshot previous value
      const previousProducts = queryClient.getQueryData(
        QueryKeys.products
      );
      
      // Optimistically update
      await optimistic.updateItemInList(
        QueryKeys.products,
        updatedProduct,
        (item) => item.id === updatedProduct.id
      );
      
      // Return context for rollback
      return { previousProducts };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      optimistic.rollback(QueryKeys.products, context);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      optimistic.settleQuery(QueryKeys.products);
    },
  });
}
```

### Helper Functions

The `OptimisticUpdates` class provides common patterns:

```typescript
const { optimistic } = useQueryUtils();

// Update item in list
await optimistic.updateItemInList(
  queryKey,
  updatedItem,
  (item) => item.id === updatedItem.id
);

// Add item to list
await optimistic.addItemToList(queryKey, newItem);

// Remove item from list
await optimistic.removeItemFromList(
  queryKey,
  (item) => item.id === itemId
);

// Update single entity
await optimistic.updateEntity(queryKey, partialUpdate);

// Rollback on error
optimistic.rollback(queryKey, context);

// Settle after mutation
await optimistic.settleQuery(queryKey);
```

### Pre-built Mutation Options

Use factory functions for common patterns:

```typescript
import { optimisticMutationOptions } from '@/lib/optimistic-updates';
import { QueryKeys } from '@/lib/query-invalidation';

// Update item in list
const mutation = useMutation({
  mutationFn: updateProductApi,
  ...optimisticMutationOptions.updateInList(
    QueryKeys.products,
    queryClient
  ),
});

// Add to list
const mutation = useMutation({
  mutationFn: createProductApi,
  ...optimisticMutationOptions.addToList(
    QueryKeys.products,
    queryClient
  ),
});

// Remove from list
const mutation = useMutation({
  mutationFn: deleteProductApi,
  ...optimisticMutationOptions.removeFromList(
    QueryKeys.products,
    queryClient
  ),
});
```

## Usage Examples

### Basic Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from '@/lib/query-invalidation';

function ProductList() {
  const { data, isLoading, error } = useQuery({
    queryKey: QueryKeys.products,
    queryFn: fetchProducts,
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{/* render products */}</div>;
}
```

### Query with Parameters

```typescript
function ProductSearch({ query }: { query: string }) {
  const { data } = useQuery({
    queryKey: QueryKeys.productSearch(query),
    queryFn: () => searchProducts(query),
    enabled: query.length > 0, // Only fetch if query exists
  });
  
  return <div>{/* render results */}</div>;
}
```

### Mutation with Invalidation

```typescript
import { useMutation } from '@tanstack/react-query';
import { useQueryUtils } from '@/hooks/useQueryUtils';

function CreateProduct() {
  const { invalidation } = useQueryUtils();
  
  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: async () => {
      // Invalidate products list to refetch
      await invalidation.invalidateProducts();
      // Also invalidate dashboard (inventory value changed)
      await invalidation.invalidateDashboard();
    },
  });
  
  return (
    <button onClick={() => mutation.mutate(newProduct)}>
      Create Product
    </button>
  );
}
```

### Mutation with Optimistic Update

```typescript
function UpdateProduct({ product }: { product: Product }) {
  const { optimistic, queryClient } = useQueryUtils();
  
  const mutation = useMutation({
    mutationFn: updateProduct,
    onMutate: async (updated) => {
      const context = await optimistic.updateItemInList(
        QueryKeys.products,
        updated,
        (item) => item.id === updated.id
      );
      return context;
    },
    onError: (err, variables, context) => {
      optimistic.rollback(QueryKeys.products, context);
    },
    onSettled: () => {
      optimistic.settleQuery(QueryKeys.products);
    },
  });
  
  return (
    <button onClick={() => mutation.mutate(updatedProduct)}>
      Update
    </button>
  );
}
```

## Best Practices

### 1. Use Consistent Query Keys

Always use the `QueryKeys` object for consistency:

```typescript
// Good
queryKey: QueryKeys.products

// Bad
queryKey: ['products']
```

### 2. Invalidate Related Queries

When data changes, invalidate all related queries:

```typescript
// After completing a transaction
await invalidation.invalidateAfterTransaction(customerId);
// This invalidates: transactions, products, dashboard, customer
```

### 3. Use Optimistic Updates for Better UX

For mutations that are likely to succeed:

```typescript
// Instant feedback for user
onMutate: async (data) => {
  await optimistic.updateItemInList(...);
}
```

### 4. Handle Errors Gracefully

Always provide rollback logic:

```typescript
onError: (err, variables, context) => {
  optimistic.rollback(queryKey, context);
  // Show error notification
}
```

### 5. Settle Queries After Mutations

Ensure data consistency:

```typescript
onSettled: () => {
  optimistic.settleQuery(queryKey);
}
```

### 6. Use Enabled Option for Conditional Queries

Prevent unnecessary fetches:

```typescript
useQuery({
  queryKey: QueryKeys.product(id),
  queryFn: () => fetchProduct(id),
  enabled: !!id, // Only fetch if id exists
});
```

### 7. Leverage Stale Time

For data that doesn't change often:

```typescript
useQuery({
  queryKey: QueryKeys.settings,
  queryFn: fetchSettings,
  staleTime: 10 * 60 * 1000, // 10 minutes
});
```

## Tenant Switching

When switching tenants, clear all cached data:

```typescript
import { useQueryUtils } from '@/hooks/useQueryUtils';

function useTenantSwitch() {
  const { invalidation } = useQueryUtils();
  
  const switchTenant = async (newTenantId: string) => {
    // Clear all cached data
    await invalidation.invalidateAllOnTenantSwitch();
    
    // Update tenant context
    // ... tenant switching logic
  };
  
  return { switchTenant };
}
```

## DevTools

React Query DevTools are enabled in development mode:

- Press the React Query icon in the bottom-left corner
- View all queries and their states
- Inspect query data and cache
- Manually trigger refetches and invalidations
- Monitor network requests

## Performance Considerations

1. **Stale Time**: Adjust based on data volatility
   - Frequently changing: 30s - 1min
   - Stable data: 5min - 10min
   - Static data: Infinity

2. **Cache Time**: Balance memory usage vs. UX
   - Default 5min is good for most cases
   - Increase for data that's expensive to fetch
   - Decrease for memory-constrained environments

3. **Refetch on Focus**: Disable for data that rarely changes
   ```typescript
   refetchOnWindowFocus: false
   ```

4. **Pagination**: Use `keepPreviousData` for smooth transitions
   ```typescript
   useQuery({
     queryKey: ['products', page],
     queryFn: () => fetchProducts(page),
     keepPreviousData: true,
   });
   ```

## Troubleshooting

### Query Not Refetching

- Check if data is still fresh (within stale time)
- Verify query key matches exactly
- Ensure `enabled` option is not false

### Optimistic Update Not Working

- Verify query key matches between mutation and query
- Check that `onMutate` returns context
- Ensure `onError` receives and uses context

### Memory Issues

- Reduce cache time (gcTime)
- Limit number of cached queries
- Use pagination for large datasets

### Stale Data After Mutation

- Ensure invalidation is called in `onSuccess` or `onSettled`
- Verify query key matches
- Check network tab for refetch requests

## Related Files

- `lib/query-client.ts` - QueryClient configuration
- `lib/query-invalidation.ts` - Invalidation utilities
- `lib/optimistic-updates.ts` - Optimistic update patterns
- `hooks/useQueryUtils.ts` - Convenience hook
- `components/providers/QueryProvider.tsx` - Provider component
