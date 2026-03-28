# Task 3.2: Configure TanStack Query for Server State Management

## Completion Summary

Task 3.2 has been successfully completed. TanStack Query is now fully configured with optimized cache settings, query invalidation strategies, and optimistic update patterns.

## What Was Implemented

### 1. QueryClient Configuration (`lib/query-client.ts`)

Created a fully configured QueryClient with:
- **Cache Time (gcTime)**: 5 minutes for optimal memory usage
- **Stale Time**: 1 minute for frequently changing data
- **Retry Strategy**: 3 retries with exponential backoff for queries, 1 for mutations
- **Refetch Behavior**: On window focus and network reconnection
- Singleton pattern for browser-side client reuse
- Server-side rendering support

### 2. QueryClientProvider Wrapper (`components/providers/QueryProvider.tsx`)

Created a provider component that:
- Wraps the application with QueryClientProvider
- Provides stable QueryClient instance using useState
- Includes React Query DevTools in development mode
- Integrated into root layout (app/layout.tsx)

### 3. Query Invalidation Utilities (`lib/query-invalidation.ts`)

Implemented comprehensive invalidation system:

#### Query Keys Organization
- Hierarchical query key structure by domain
- Type-safe query key definitions
- Support for parameterized keys (e.g., product by ID)

#### QueryInvalidation Class
Methods for invalidating:
- Products (all or specific)
- Customers (all or specific with history)
- Orders
- Transactions
- Dashboard metrics
- Leads
- Settings
- Users
- All queries on tenant switch

#### Composite Invalidation Methods
- `invalidateAfterTransaction()` - Invalidates transactions, products, dashboard, and customer
- `invalidateAfterInventoryChange()` - Invalidates products and dashboard
- `invalidateAllOnTenantSwitch()` - Clears entire cache

### 4. Optimistic Update Patterns (`lib/optimistic-updates.ts`)

Implemented OptimisticUpdates class with methods:
- `updateItemInList()` - Update single item in a list
- `addItemToList()` - Add new item to list
- `removeItemFromList()` - Remove item from list
- `updateEntity()` - Update single entity
- `rollback()` - Rollback on error
- `settleQuery()` - Refetch after mutation

#### Pre-built Mutation Options
Factory functions for common patterns:
- `optimisticMutationOptions.updateInList()`
- `optimisticMutationOptions.addToList()`
- `optimisticMutationOptions.removeFromList()`

### 5. Convenience Hook (`hooks/useQueryUtils.ts`)

Created `useQueryUtils` hook providing:
- Access to QueryClient instance
- QueryInvalidation utilities
- OptimisticUpdates utilities
- Memoized for performance

### 6. Comprehensive Documentation

Created two detailed documentation files:

#### `QUERY_CONFIGURATION.md`
- Configuration details and rationale
- Query key structure and organization
- Invalidation strategies and methods
- Optimistic update patterns and examples
- Best practices and guidelines
- Performance considerations
- Troubleshooting guide

#### `QUERY_USAGE_EXAMPLES.md`
- Basic query patterns
- Mutation patterns with invalidation
- Optimistic update examples
- Complex scenarios (transactions, bulk operations)
- Offline support patterns
- Testing strategies

### 7. Updated Documentation

Updated `lib/README.md` with:
- TanStack Query overview
- Quick start examples
- Configuration summary
- Links to detailed documentation

## Requirements Satisfied

✅ **Requirement 1.4**: TanStack Query for API data caching and synchronization
✅ **Requirement 22.4**: Query_Cache stores all API response data
✅ **Requirement 22.5**: Query_Cache invalidates cached data when mutations occur
✅ **Requirement 22.6**: No data duplication between State_Manager and Query_Cache
✅ **Requirement 19.8**: TanStack Query cache time configured to 5 minutes
✅ **Requirement 19.9**: TanStack Query stale time configured to 1 minute
✅ **Requirement 19.10**: Optimistic updates implemented for user actions

## Files Created

1. `lib/query-client.ts` - QueryClient configuration
2. `components/providers/QueryProvider.tsx` - Provider wrapper
3. `lib/query-invalidation.ts` - Invalidation utilities
4. `lib/optimistic-updates.ts` - Optimistic update patterns
5. `hooks/useQueryUtils.ts` - Convenience hook
6. `lib/QUERY_CONFIGURATION.md` - Configuration guide
7. `lib/QUERY_USAGE_EXAMPLES.md` - Usage examples
8. `lib/TASK_3.2_SUMMARY.md` - This summary

## Files Modified

1. `app/layout.tsx` - Added QueryProvider wrapper
2. `lib/README.md` - Added TanStack Query documentation
3. `package.json` - Added @tanstack/react-query-devtools (dev dependency)

## Usage Example

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { useQueryUtils } from '@/hooks/useQueryUtils';
import { QueryKeys } from '@/lib/query-invalidation';

function ProductList() {
  const { invalidation, optimistic } = useQueryUtils();

  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: QueryKeys.products,
    queryFn: fetchProducts,
  });

  // Create product with invalidation
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: async () => {
      await invalidation.invalidateProducts();
    },
  });

  // Update product with optimistic update
  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onMutate: async (updated) => {
      return await optimistic.updateItemInList(
        QueryKeys.products,
        updated,
        (item) => item.id === updated.id
      );
    },
    onError: (err, variables, context) => {
      optimistic.rollback(QueryKeys.products, context);
    },
    onSettled: () => {
      optimistic.settleQuery(QueryKeys.products);
    },
  });

  return (
    <div>
      {products?.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

## Key Features

### 1. Intelligent Caching
- 5-minute cache time prevents memory bloat
- 1-minute stale time balances freshness and performance
- Automatic garbage collection of unused data

### 2. Automatic Refetching
- Refetch on window focus for fresh data
- Refetch on network reconnection for offline support
- Background refetching when data becomes stale

### 3. Optimistic Updates
- Instant UI feedback for better UX
- Automatic rollback on error
- Consistent data after mutation settles

### 4. Query Invalidation
- Domain-organized query keys
- Composite invalidation for related data
- Tenant-aware cache clearing

### 5. Developer Experience
- Type-safe query keys
- Convenience hooks
- React Query DevTools in development
- Comprehensive documentation

## Testing

All TypeScript files compile without errors:
- ✅ `lib/query-client.ts`
- ✅ `components/providers/QueryProvider.tsx`
- ✅ `lib/query-invalidation.ts`
- ✅ `lib/optimistic-updates.ts`
- ✅ `hooks/useQueryUtils.ts`
- ✅ `app/layout.tsx`

## Next Steps

The TanStack Query infrastructure is now ready for use in:
- Task 3.3: IndexedDB implementation (offline storage)
- Task 3.4: Offline manager and sync queue
- Task 4.1: API service layer (will use query hooks)
- All subsequent feature modules

## Notes

- React Query DevTools are only enabled in development mode
- The QueryProvider is placed above AuthProvider in the component tree
- Query keys follow a hierarchical structure for easy invalidation
- Optimistic updates include automatic rollback on error
- All utilities are memoized for optimal performance

## References

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- `lib/QUERY_CONFIGURATION.md` - Detailed configuration guide
- `lib/QUERY_USAGE_EXAMPLES.md` - Practical examples
- Design Document: Section on State Management Strategy
- Requirements: 1.4, 22.4, 22.5, 22.6, 19.8, 19.9, 19.10
