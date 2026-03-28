# Library Utilities

This directory contains shared utility functions and configurations used throughout the application.

## Axios Client (`axios.ts`)

The Axios client is a pre-configured HTTP client for making API requests with built-in interceptors for authentication and error handling.

### Features

1. **Cookie-Based Authentication**: Automatically includes HTTP-only cookies in all requests via `withCredentials: true`
2. **Tenant ID Injection**: Automatically injects tenant ID into request URLs (format: `/api/{tenantId}/...`)
3. **Token Refresh**: Automatically handles 401 errors by attempting to refresh the session
4. **Request Queuing**: Queues requests during token refresh to avoid race conditions
5. **Error Handling**: Provides user-friendly error messages for network errors
6. **Request Cancellation**: Supports request cancellation via timeout (30 seconds default)

### Usage

```typescript
import apiClient from '@/lib/axios';

// GET request
const response = await apiClient.get('/products');

// POST request
const response = await apiClient.post('/products', {
  name: 'Product Name',
  price: 99.99
});

// PUT request
const response = await apiClient.put('/products/123', {
  name: 'Updated Name'
});

// DELETE request
const response = await apiClient.delete('/products/123');
```

### Configuration

The client uses the following environment variables:

- `NEXT_PUBLIC_API_BASE_URL`: Base URL for API requests (default: `/api`)

### Tenant ID Resolution

The client attempts to resolve the tenant ID in the following order:

1. **Subdomain**: Extracts from `subdomain.example.com` (uses `subdomain` as tenant ID)
2. **URL Parameter**: Checks for `?tenantId=xxx` in the URL
3. **LocalStorage**: Falls back to stored tenant ID in localStorage

### Interceptors

#### Request Interceptor

- Injects tenant ID into the URL path
- Ensures all requests follow the format: `/api/{tenantId}/endpoint`

#### Response Interceptor

- Handles 401 Unauthorized errors
- Attempts token refresh via `/auth/refresh` endpoint
- Queues requests during refresh to prevent race conditions
- Redirects to login page if refresh fails
- Provides user-friendly error messages for network errors

### Error Handling

The client handles the following error scenarios:

1. **401 Unauthorized**: Attempts token refresh, redirects to login on failure
2. **Network Errors**: Returns user-friendly error message
3. **Other Errors**: Passes through the original error for handling by the caller

### Testing

Basic test structure is provided in `__tests__/axios.test.ts`. To run tests:

```bash
npm test
```

### Security Considerations

- Never stores authentication tokens in localStorage or sessionStorage
- Relies exclusively on HTTP-only cookies for session management
- Automatically includes credentials in all requests
- Implements CSRF-safe request structure

### Future Enhancements

- Add request/response logging in development mode
- Implement retry logic for failed requests
- Add request deduplication
- Support for request cancellation tokens
- Add metrics and monitoring


## TanStack Query Configuration

The application uses TanStack Query (React Query) for server state management with optimized caching and automatic refetching.

### Files

- **`query-client.ts`** - QueryClient configuration with cache and stale time settings
- **`query-invalidation.ts`** - Query key definitions and invalidation utilities
- **`optimistic-updates.ts`** - Optimistic update patterns for instant UI feedback
- **`QUERY_CONFIGURATION.md`** - Comprehensive configuration guide
- **`QUERY_USAGE_EXAMPLES.md`** - Practical implementation examples

### Quick Start

#### Basic Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from '@/lib/query-invalidation';

const { data, isLoading } = useQuery({
  queryKey: QueryKeys.products,
  queryFn: fetchProducts,
});
```

#### Mutation with Invalidation

```typescript
import { useMutation } from '@tanstack/react-query';
import { useQueryUtils } from '@/hooks/useQueryUtils';

const { invalidation } = useQueryUtils();

const mutation = useMutation({
  mutationFn: createProduct,
  onSuccess: async () => {
    await invalidation.invalidateProducts();
  },
});
```

#### Optimistic Update

```typescript
const { optimistic } = useQueryUtils();

const mutation = useMutation({
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
```

### Configuration Details

- **Cache Time (gcTime)**: 5 minutes - How long unused data stays in memory
- **Stale Time**: 1 minute - How long data is considered fresh
- **Retry**: 3 attempts with exponential backoff for queries, 1 for mutations
- **Refetch on Window Focus**: Enabled for fresh data
- **Refetch on Reconnect**: Enabled for offline support

### Query Keys

Organized by domain for easy invalidation:

```typescript
QueryKeys.products              // ['products']
QueryKeys.product('123')        // ['products', '123']
QueryKeys.customers             // ['customers']
QueryKeys.customer('456')       // ['customers', '456']
QueryKeys.dashboard             // ['dashboard']
QueryKeys.transactions          // ['transactions']
```

### Invalidation Strategies

```typescript
const { invalidation } = useQueryUtils();

// Invalidate specific domain
await invalidation.invalidateProducts();
await invalidation.invalidateCustomers();

// Invalidate after transaction (multiple related queries)
await invalidation.invalidateAfterTransaction(customerId);

// Clear all cache on tenant switch
await invalidation.invalidateAllOnTenantSwitch();
```

### Documentation

For detailed information, see:
- `QUERY_CONFIGURATION.md` - Complete configuration guide
- `QUERY_USAGE_EXAMPLES.md` - Practical examples for common scenarios

## Hooks

The `useQueryUtils` hook provides easy access to query utilities:

```typescript
import { useQueryUtils } from '@/hooks/useQueryUtils';

const { queryClient, invalidation, optimistic } = useQueryUtils();
```

## Provider Setup

The QueryProvider is configured in the root layout:

```typescript
// app/layout.tsx
import { QueryProvider } from '@/components/providers/QueryProvider';

export default function RootLayout({ children }) {
  return (
    <QueryProvider>
      {children}
    </QueryProvider>
  );
}
```

## Development Tools

React Query DevTools are enabled in development mode:
- Accessible via the icon in the bottom-left corner
- View all queries and their states
- Inspect cache data
- Manually trigger refetches and invalidations
