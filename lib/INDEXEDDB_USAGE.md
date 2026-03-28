# IndexedDB Wrapper Usage Guide

## Overview

The IndexedDB wrapper provides a robust, type-safe interface for offline data storage in the POS CRM system. It supports four object stores: products, customers, transactions, and sync_queue.

## Requirements Fulfilled

- **16.1**: Creates object stores for products, customers, transactions, sync_queue
- **16.2**: Supports full CRUD operations for all stores
- **16.3**: Uses indexes for efficient querying by common fields
- **16.4**: Handles database version migrations automatically
- **16.5**: Logs errors and displays user-friendly messages
- **16.6**: Implements transaction batching for bulk operations
- **16.7**: Provides clear functions to reset local data
- **16.8**: Limits storage size to prevent browser quota issues

## Object Stores

### 1. Products Store
- **Key Path**: `id`
- **Indexes**: `sku`, `name`, `category`, `barcode`, `tenantId`, `isActive`
- **Purpose**: Cache product data for offline POS operations

### 2. Customers Store
- **Key Path**: `id`
- **Indexes**: `name`, `email`, `phone`, `tenantId`
- **Purpose**: Cache customer data for offline lookup and transactions

### 3. Transactions Store
- **Key Path**: `id`
- **Indexes**: `orderNumber`, `customerId`, `status`, `createdAt`, `tenantId`
- **Purpose**: Store transactions created while offline

### 4. Sync Queue Store
- **Key Path**: `id`
- **Indexes**: `timestamp`, `operation`, `storeName`
- **Purpose**: Queue operations for synchronization when back online

## Basic CRUD Operations

### Create a Record

```typescript
import { create, STORES } from '@/lib/indexeddb';
import type { Product } from '@/types/entities';

const product: Product = {
  id: 'prod-123',
  tenantId: 'tenant-1',
  sku: 'SKU-001',
  name: 'Laptop',
  category: 'Electronics',
  price: 999.99,
  stockQuantity: 50,
  minStockLevel: 10,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

try {
  await create(STORES.PRODUCTS, product);
  console.log('Product created successfully');
} catch (error) {
  console.error('Failed to create product:', error);
}
```

### Read a Record

```typescript
import { read, STORES } from '@/lib/indexeddb';

const product = await read(STORES.PRODUCTS, 'prod-123');
if (product) {
  console.log('Product found:', product.name);
} else {
  console.log('Product not found');
}
```

### Update a Record

```typescript
import { update, STORES } from '@/lib/indexeddb';

const updatedProduct = {
  ...product,
  price: 899.99,
  stockQuantity: 45,
  updatedAt: new Date().toISOString(),
};

await update(STORES.PRODUCTS, updatedProduct);
```

### Delete a Record

```typescript
import { deleteRecord, STORES } from '@/lib/indexeddb';

await deleteRecord(STORES.PRODUCTS, 'prod-123');
```

### Get All Records

```typescript
import { getAll, STORES } from '@/lib/indexeddb';

const allProducts = await getAll(STORES.PRODUCTS);
console.log(`Total products: ${allProducts.length}`);
```

## Querying with Indexes

### Query by Category

```typescript
import { queryByIndex, STORES } from '@/lib/indexeddb';

const electronics = await queryByIndex(STORES.PRODUCTS, 'category', 'Electronics');
console.log(`Found ${electronics.length} electronics products`);
```

### Query by Tenant

```typescript
const tenantProducts = await queryByIndex(STORES.PRODUCTS, 'tenantId', 'tenant-1');
```

### Query by Status

```typescript
const completedOrders = await queryByIndex(STORES.TRANSACTIONS, 'status', 'completed');
```

## Bulk Operations

### Bulk Create

```typescript
import { bulkCreate, STORES } from '@/lib/indexeddb';

const products = [
  { id: 'prod-1', /* ... */ },
  { id: 'prod-2', /* ... */ },
  { id: 'prod-3', /* ... */ },
];

await bulkCreate(STORES.PRODUCTS, products);
console.log('Bulk create completed');
```

### Bulk Update

```typescript
import { bulkUpdate, STORES } from '@/lib/indexeddb';

const updatedProducts = products.map(p => ({
  ...p,
  price: p.price * 1.1, // 10% price increase
  updatedAt: new Date().toISOString(),
}));

await bulkUpdate(STORES.PRODUCTS, updatedProducts);
```

### Bulk Delete

```typescript
import { bulkDelete, STORES } from '@/lib/indexeddb';

const idsToDelete = ['prod-1', 'prod-2', 'prod-3'];
await bulkDelete(STORES.PRODUCTS, idsToDelete);
```

## Search and Pagination

### Search Records

```typescript
import { search, STORES } from '@/lib/indexeddb';

// Search products by name (case-insensitive)
const results = await search(STORES.PRODUCTS, 'name', 'laptop');

// Search customers by email
const customers = await search(STORES.CUSTOMERS, 'email', 'john');
```

### Paginated Results

```typescript
import { getPaginated, STORES } from '@/lib/indexeddb';

const page1 = await getPaginated(STORES.PRODUCTS, 1, 20);
console.log(`Page ${page1.page} of ${page1.totalPages}`);
console.log(`Showing ${page1.data.length} of ${page1.total} products`);

// Get next page
const page2 = await getPaginated(STORES.PRODUCTS, 2, 20);
```

## Store Management

### Count Records

```typescript
import { count, STORES } from '@/lib/indexeddb';

const productCount = await count(STORES.PRODUCTS);
console.log(`Total products in cache: ${productCount}`);
```

### Check if Record Exists

```typescript
import { exists, STORES } from '@/lib/indexeddb';

const productExists = await exists(STORES.PRODUCTS, 'prod-123');
if (productExists) {
  console.log('Product is cached');
}
```

### Clear a Store

```typescript
import { clearStore, STORES } from '@/lib/indexeddb';

// Clear all products
await clearStore(STORES.PRODUCTS);
console.log('Products cache cleared');
```

### Clear All Stores

```typescript
import { clearAllStores } from '@/lib/indexeddb';

// Clear all cached data
await clearAllStores();
console.log('All caches cleared');
```

## Storage Management

### Check Storage Usage

```typescript
import { getStorageStats } from '@/lib/indexeddb';

const stats = await getStorageStats();
console.log(`Storage used: ${(stats.used / 1024 / 1024).toFixed(2)} MB`);
console.log(`Storage quota: ${(stats.quota / 1024 / 1024).toFixed(2)} MB`);
console.log(`Usage: ${stats.percentage.toFixed(2)}%`);

if (stats.isNearLimit) {
  console.warn('Storage is near limit! Consider clearing old data.');
}
```

### Check if Near Storage Limit

```typescript
import { isStorageNearLimit } from '@/lib/indexeddb';

const nearLimit = await isStorageNearLimit();
if (nearLimit) {
  // Show warning to user
  alert('Storage is running low. Please sync and clear old data.');
}
```

## Sync Queue Usage

### Add to Sync Queue

```typescript
import { create, STORES, type SyncQueueItem } from '@/lib/indexeddb';

const syncItem: SyncQueueItem = {
  id: `sync-${Date.now()}`,
  operation: 'create',
  storeName: STORES.TRANSACTIONS,
  data: newTransaction,
  timestamp: Date.now(),
  retryCount: 0,
};

await create(STORES.SYNC_QUEUE, syncItem);
```

### Get Pending Sync Items

```typescript
import { getAll, STORES } from '@/lib/indexeddb';

const pendingItems = await getAll(STORES.SYNC_QUEUE);
console.log(`${pendingItems.length} items pending sync`);
```

### Process Sync Queue

```typescript
import { getAll, deleteRecord, update, STORES } from '@/lib/indexeddb';

const pendingItems = await getAll(STORES.SYNC_QUEUE);

for (const item of pendingItems) {
  try {
    // Attempt to sync with server
    await syncToServer(item);
    
    // Remove from queue on success
    await deleteRecord(STORES.SYNC_QUEUE, item.id);
  } catch (error) {
    // Update retry count on failure
    const updatedItem = {
      ...item,
      retryCount: item.retryCount + 1,
      lastError: error.message,
    };
    await update(STORES.SYNC_QUEUE, updatedItem);
  }
}
```

## Integration with React Components

### Using in a Custom Hook

```typescript
import { useEffect, useState } from 'react';
import { getAll, STORES } from '@/lib/indexeddb';
import type { Product } from '@/types/entities';

export function useOfflineProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const cachedProducts = await getAll(STORES.PRODUCTS);
        setProducts(cachedProducts);
      } catch (error) {
        console.error('Failed to load products from cache:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  return { products, loading };
}
```

### Using with TanStack Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { getAll, STORES } from '@/lib/indexeddb';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function useProducts() {
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      if (isOnline) {
        // Fetch from API
        const response = await fetch('/api/products');
        return response.json();
      } else {
        // Fallback to IndexedDB
        return await getAll(STORES.PRODUCTS);
      }
    },
  });
}
```

## Error Handling

All IndexedDB operations can throw errors. Always wrap them in try-catch blocks:

```typescript
import { create, STORES } from '@/lib/indexeddb';

try {
  await create(STORES.PRODUCTS, product);
  // Show success message
  toast.success('Product saved offline');
} catch (error) {
  // Show error message
  console.error('Failed to save product:', error);
  toast.error('Failed to save product offline');
}
```

## Initialization

Initialize the database when the app starts:

```typescript
import { initialize, isIndexedDBSupported } from '@/lib/indexeddb';

// In your app initialization
if (isIndexedDBSupported()) {
  await initialize();
  console.log('IndexedDB initialized');
} else {
  console.warn('IndexedDB not supported in this browser');
  // Fallback to online-only mode
}
```

## Best Practices

1. **Always check online status** before deciding to use IndexedDB
2. **Batch operations** when possible using bulk functions
3. **Monitor storage usage** regularly to prevent quota issues
4. **Clear old data** periodically to free up space
5. **Use indexes** for efficient queries instead of filtering all records
6. **Handle errors gracefully** and provide user feedback
7. **Sync regularly** when online to keep data fresh
8. **Use TypeScript types** for type safety

## Performance Tips

1. Use `queryByIndex` instead of `getAll` + filter for better performance
2. Use `bulkCreate/bulkUpdate/bulkDelete` for multiple operations
3. Close database connections promptly (handled automatically)
4. Avoid storing large binary data (images, videos) in IndexedDB
5. Use pagination for large datasets
6. Clear unused data regularly to maintain performance
