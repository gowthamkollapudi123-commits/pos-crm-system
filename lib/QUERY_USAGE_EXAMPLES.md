# TanStack Query Usage Examples

Practical examples for common use cases in the POS CRM System.

## Table of Contents

1. [Basic Queries](#basic-queries)
2. [Mutations](#mutations)
3. [Optimistic Updates](#optimistic-updates)
4. [Complex Scenarios](#complex-scenarios)
5. [Offline Support](#offline-support)

## Basic Queries

### Fetch Products List

```typescript
import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from '@/lib/query-invalidation';
import apiClient from '@/lib/axios';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

function ProductList() {
  const { data: products, isLoading, error } = useQuery({
    queryKey: QueryKeys.products,
    queryFn: async () => {
      const response = await apiClient.get<Product[]>('/products');
      return response.data;
    },
  });

  if (isLoading) return <div>Loading products...</div>;
  if (error) return <div>Error loading products</div>;

  return (
    <div>
      {products?.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### Fetch Single Product

```typescript
function ProductDetail({ productId }: { productId: string }) {
  const { data: product, isLoading } = useQuery({
    queryKey: QueryKeys.product(productId),
    queryFn: async () => {
      const response = await apiClient.get<Product>(`/products/${productId}`);
      return response.data;
    },
    enabled: !!productId, // Only fetch if productId exists
  });

  if (isLoading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div>
      <h1>{product.name}</h1>
      <p>Price: ${product.price}</p>
      <p>Stock: {product.stock}</p>
    </div>
  );
}
```

### Search with Debouncing

```typescript
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from '@/lib/query-invalidation';

function ProductSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: results, isLoading } = useQuery({
    queryKey: QueryKeys.productSearch(debouncedQuery),
    queryFn: async () => {
      const response = await apiClient.get('/products/search', {
        params: { q: debouncedQuery },
      });
      return response.data;
    },
    enabled: debouncedQuery.length > 0,
  });

  return (
    <div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search products..."
      />
      {isLoading && <div>Searching...</div>}
      {results?.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

## Mutations

### Create Product

```typescript
import { useMutation } from '@tanstack/react-query';
import { useQueryUtils } from '@/hooks/useQueryUtils';
import { toast } from 'sonner';

function CreateProductForm() {
  const { invalidation } = useQueryUtils();

  const createMutation = useMutation({
    mutationFn: async (newProduct: Omit<Product, 'id'>) => {
      const response = await apiClient.post('/products', newProduct);
      return response.data;
    },
    onSuccess: async () => {
      // Invalidate products list to refetch
      await invalidation.invalidateProducts();
      // Also invalidate dashboard (inventory changed)
      await invalidation.invalidateDashboard();
      
      toast.success('Product created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create product');
      console.error(error);
    },
  });

  const handleSubmit = (formData: Omit<Product, 'id'>) => {
    createMutation.mutate(formData);
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      // ... form handling
    }}>
      {/* Form fields */}
      <button 
        type="submit" 
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? 'Creating...' : 'Create Product'}
      </button>
    </form>
  );
}
```

### Update Product

```typescript
function UpdateProductForm({ product }: { product: Product }) {
  const { invalidation } = useQueryUtils();

  const updateMutation = useMutation({
    mutationFn: async (updated: Product) => {
      const response = await apiClient.put(
        `/products/${updated.id}`,
        updated
      );
      return response.data;
    },
    onSuccess: async (data) => {
      // Invalidate both list and single product
      await invalidation.invalidateProducts();
      await invalidation.invalidateProduct(data.id);
      
      toast.success('Product updated successfully');
    },
    onError: () => {
      toast.error('Failed to update product');
    },
  });

  return (
    <button onClick={() => updateMutation.mutate(product)}>
      Update Product
    </button>
  );
}
```

### Delete Product

```typescript
function DeleteProductButton({ productId }: { productId: string }) {
  const { invalidation } = useQueryUtils();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/products/${id}`);
    },
    onSuccess: async () => {
      await invalidation.invalidateProducts();
      await invalidation.invalidateDashboard();
      
      toast.success('Product deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete product');
    },
  });

  return (
    <button 
      onClick={() => deleteMutation.mutate(productId)}
      disabled={deleteMutation.isPending}
    >
      Delete
    </button>
  );
}
```

## Optimistic Updates

### Optimistic Product Update

```typescript
function OptimisticUpdateProduct({ product }: { product: Product }) {
  const { optimistic, queryClient } = useQueryUtils();

  const updateMutation = useMutation({
    mutationFn: async (updated: Product) => {
      const response = await apiClient.put(
        `/products/${updated.id}`,
        updated
      );
      return response.data;
    },
    onMutate: async (updatedProduct) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: QueryKeys.products 
      });

      // Snapshot previous value
      const previousProducts = queryClient.getQueryData<Product[]>(
        QueryKeys.products
      );

      // Optimistically update the cache
      if (previousProducts) {
        queryClient.setQueryData<Product[]>(
          QueryKeys.products,
          previousProducts.map((p) =>
            p.id === updatedProduct.id ? updatedProduct : p
          )
        );
      }

      // Return context for rollback
      return { previousProducts };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(
          QueryKeys.products,
          context.previousProducts
        );
      }
      toast.error('Update failed, changes reverted');
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: QueryKeys.products 
      });
    },
  });

  return (
    <button onClick={() => updateMutation.mutate(product)}>
      Update (Optimistic)
    </button>
  );
}
```

### Optimistic Add to Cart

```typescript
interface CartItem {
  id: string;
  productId: string;
  quantity: number;
}

function AddToCartButton({ productId }: { productId: string }) {
  const { optimistic } = useQueryUtils();

  const addToCartMutation = useMutation({
    mutationFn: async (item: Omit<CartItem, 'id'>) => {
      const response = await apiClient.post('/cart', item);
      return response.data;
    },
    onMutate: async (newItem) => {
      const context = await optimistic.addItemToList<CartItem>(
        ['cart'],
        { ...newItem, id: `temp-${Date.now()}` } as CartItem
      );
      
      toast.success('Added to cart');
      return context;
    },
    onError: (err, variables, context) => {
      optimistic.rollback(['cart'], context);
      toast.error('Failed to add to cart');
    },
    onSettled: () => {
      optimistic.settleQuery(['cart']);
    },
  });

  return (
    <button onClick={() => addToCartMutation.mutate({ 
      productId, 
      quantity: 1 
    })}>
      Add to Cart
    </button>
  );
}
```

## Complex Scenarios

### Complete Transaction Flow

```typescript
interface Transaction {
  id: string;
  customerId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'completed';
}

function CompleteTransactionButton({ 
  transaction 
}: { 
  transaction: Transaction 
}) {
  const { invalidation } = useQueryUtils();

  const completeMutation = useMutation({
    mutationFn: async (txn: Transaction) => {
      const response = await apiClient.post('/transactions/complete', txn);
      return response.data;
    },
    onSuccess: async (data) => {
      // Invalidate multiple related queries
      await invalidation.invalidateAfterTransaction(data.customerId);
      
      // This invalidates:
      // - transactions
      // - products (stock updated)
      // - dashboard (metrics changed)
      // - customer (purchase history updated)
      
      toast.success('Transaction completed successfully');
    },
    onError: () => {
      toast.error('Transaction failed');
    },
  });

  return (
    <button onClick={() => completeMutation.mutate(transaction)}>
      Complete Transaction
    </button>
  );
}
```

### Bulk Product Import

```typescript
function BulkImportProducts() {
  const { invalidation } = useQueryUtils();

  const importMutation = useMutation({
    mutationFn: async (products: Omit<Product, 'id'>[]) => {
      const response = await apiClient.post('/products/bulk', products);
      return response.data;
    },
    onSuccess: async (data) => {
      await invalidation.invalidateProducts();
      await invalidation.invalidateAfterInventoryChange();
      
      toast.success(`Imported ${data.count} products successfully`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Import failed';
      toast.error(message);
    },
  });

  const handleFileUpload = async (file: File) => {
    // Parse CSV file
    const products = await parseCSV(file);
    importMutation.mutate(products);
  };

  return (
    <div>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
      />
      {importMutation.isPending && <div>Importing...</div>}
    </div>
  );
}
```

### Paginated List with Optimistic Delete

```typescript
function PaginatedProductList() {
  const [page, setPage] = useState(1);
  const { optimistic, queryClient } = useQueryUtils();

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'paginated', page],
    queryFn: async () => {
      const response = await apiClient.get('/products', {
        params: { page, limit: 20 },
      });
      return response.data;
    },
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/products/${id}`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ 
        queryKey: ['products', 'paginated', page] 
      });

      const previousData = queryClient.getQueryData<{
        items: Product[];
        total: number;
      }>(['products', 'paginated', page]);

      if (previousData) {
        queryClient.setQueryData(['products', 'paginated', page], {
          ...previousData,
          items: previousData.items.filter((p) => p.id !== id),
          total: previousData.total - 1,
        });
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ['products', 'paginated', page],
          context.previousData
        );
      }
      toast.error('Delete failed');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['products', 'paginated'] 
      });
    },
  });

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {data?.items.map((product) => (
        <div key={product.id}>
          {product.name}
          <button onClick={() => deleteMutation.mutate(product.id)}>
            Delete
          </button>
        </div>
      ))}
      <button onClick={() => setPage(page - 1)} disabled={page === 1}>
        Previous
      </button>
      <button onClick={() => setPage(page + 1)}>
        Next
      </button>
    </div>
  );
}
```

## Offline Support

### Query with Offline Fallback

```typescript
import { useQuery } from '@tanstack/react-query';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getFromIndexedDB } from '@/lib/indexeddb';

function ProductListWithOffline() {
  const isOnline = useOnlineStatus();

  const { data: products, isLoading } = useQuery({
    queryKey: QueryKeys.products,
    queryFn: async () => {
      if (isOnline) {
        // Fetch from API when online
        const response = await apiClient.get('/products');
        return response.data;
      } else {
        // Fallback to IndexedDB when offline
        return await getFromIndexedDB('products');
      }
    },
  });

  return (
    <div>
      {!isOnline && (
        <div className="offline-banner">
          Offline Mode - Showing cached data
        </div>
      )}
      {products?.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### Mutation with Sync Queue

```typescript
import { useMutation } from '@tanstack/react-query';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { addToSyncQueue } from '@/lib/sync-queue';

function CreateTransactionOffline() {
  const isOnline = useOnlineStatus();
  const { invalidation } = useQueryUtils();

  const createMutation = useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id'>) => {
      if (isOnline) {
        // Send to API when online
        const response = await apiClient.post('/transactions', transaction);
        return response.data;
      } else {
        // Queue for sync when offline
        const queued = await addToSyncQueue('transaction', transaction);
        return queued;
      }
    },
    onSuccess: async (data) => {
      if (isOnline) {
        await invalidation.invalidateAfterTransaction(data.customerId);
        toast.success('Transaction completed');
      } else {
        toast.success('Transaction saved - will sync when online');
      }
    },
  });

  return (
    <button onClick={() => createMutation.mutate(transactionData)}>
      {isOnline ? 'Complete Transaction' : 'Save Offline'}
    </button>
  );
}
```

### Auto-sync on Reconnect

```typescript
import { useEffect } from 'react';
import { useQueryUtils } from '@/hooks/useQueryUtils';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { processSyncQueue } from '@/lib/sync-queue';

function AutoSyncProvider({ children }: { children: React.ReactNode }) {
  const isOnline = useOnlineStatus();
  const { invalidation } = useQueryUtils();

  useEffect(() => {
    if (isOnline) {
      // Process sync queue when coming back online
      processSyncQueue()
        .then(async () => {
          // Invalidate all queries to refetch fresh data
          await invalidation.invalidateAllOnTenantSwitch();
          toast.success('Synced successfully');
        })
        .catch((error) => {
          console.error('Sync failed:', error);
          toast.error('Sync failed - will retry');
        });
    }
  }, [isOnline, invalidation]);

  return <>{children}</>;
}
```

## Testing

### Mock Query in Tests

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
        gcTime: Infinity,
      },
    },
  });
}

test('renders product list', async () => {
  const queryClient = createTestQueryClient();
  
  // Pre-populate cache
  queryClient.setQueryData(QueryKeys.products, [
    { id: '1', name: 'Product 1', price: 10, stock: 5 },
    { id: '2', name: 'Product 2', price: 20, stock: 10 },
  ]);

  render(
    <QueryClientProvider client={queryClient}>
      <ProductList />
    </QueryClientProvider>
  );

  expect(await screen.findByText('Product 1')).toBeInTheDocument();
  expect(await screen.findByText('Product 2')).toBeInTheDocument();
});
```

## Summary

These examples demonstrate:

- Basic query patterns for fetching data
- Mutation patterns for creating, updating, and deleting data
- Optimistic updates for instant UI feedback
- Complex scenarios like transactions and bulk operations
- Offline support with fallbacks and sync queues
- Testing strategies for query-based components

For more details, see `QUERY_CONFIGURATION.md`.
