# IndexedDB Quick Reference

## Import

```typescript
import { STORES, create, read, update, deleteRecord, getAll, queryByIndex } from '@/lib/indexeddb';
import { cacheProducts, findProductByBarcode, saveTransactionOffline } from '@/lib/indexeddb-helpers';
```

## Common Operations

### Cache Data After API Fetch
```typescript
// Cache products
await cacheProducts(products);

// Cache customers
await cacheCustomers(customers);
```

### Find Product
```typescript
// By barcode (for POS scanning)
const product = await findProductByBarcode('123456789');

// By SKU
const product = await findProductBySku('SKU-001');

// By category
const electronics = await getProductsByCategory('Electronics');
```

### Find Customer
```typescript
// By email
const customer = await findCustomerByEmail('john@example.com');

// By phone
const customer = await findCustomerByPhone('+1234567890');
```

### Save Transaction Offline
```typescript
if (!isOnline) {
  await saveTransactionOffline(transaction);
  toast.success('Saved offline. Will sync when online.');
}
```

### Check Stock
```typescript
// Check if in stock
const inStock = await isProductInStock(productId);

// Get stock quantity
const quantity = await getProductStock(productId);

// Get low stock products
const lowStock = await getLowStockProducts();
```

### Sync Queue
```typescript
// Get pending sync count
const count = await getSyncQueueCount();

// Get all pending items
const items = await getSyncQueue();
```

### Storage Management
```typescript
// Check storage usage
const stats = await getStorageStats();
console.log(`Using ${stats.percentage.toFixed(2)}% of quota`);

// Check if near limit
if (await isStorageNearLimit()) {
  showWarning('Storage running low');
}

// Clear old data
await clearStore(STORES.TRANSACTIONS);
```

## Store Names

- `STORES.PRODUCTS` - Product cache
- `STORES.CUSTOMERS` - Customer cache
- `STORES.TRANSACTIONS` - Offline transactions
- `STORES.SYNC_QUEUE` - Pending sync operations

## Error Handling

Always wrap in try-catch:

```typescript
try {
  await create(STORES.PRODUCTS, product);
  toast.success('Saved successfully');
} catch (error) {
  console.error('Save failed:', error);
  toast.error('Failed to save');
}
```

## React Hook Example

```typescript
function useOfflineProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    getAll(STORES.PRODUCTS).then(setProducts);
  }, []);
  
  return products;
}
```

## TanStack Query Integration

```typescript
const { data: products } = useQuery({
  queryKey: ['products'],
  queryFn: async () => {
    if (isOnline) {
      const data = await fetchFromAPI();
      await cacheProducts(data); // Cache for offline
      return data;
    }
    return await getAll(STORES.PRODUCTS); // Use cache
  },
});
```

## Performance Tips

✅ Use `queryByIndex()` instead of `getAll()` + filter  
✅ Use bulk operations for multiple records  
✅ Use pagination for large datasets  
✅ Clear old data regularly  
✅ Monitor storage usage  

## Full Documentation

See `INDEXEDDB_USAGE.md` for complete API reference and examples.
