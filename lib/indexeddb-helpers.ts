/**
 * Helper functions for common IndexedDB operations
 * Provides convenient wrappers for typical use cases
 */

import {
  STORES,
  create,
  update,
  getAll,
  queryByIndex,
  bulkCreate,
  clearStore,
  type SyncQueueItem,
} from './indexeddb';
import type { Product, Customer, Order } from '@/types/entities';

/**
 * Cache products for offline use
 * Typically called after fetching from API
 */
export async function cacheProducts(products: Product[]): Promise<void> {
  try {
    // Clear existing products first
    await clearStore(STORES.PRODUCTS);
    
    // Bulk insert new products
    await bulkCreate(STORES.PRODUCTS, products);
    
    console.log(`Cached ${products.length} products for offline use`);
  } catch (error) {
    console.error('Failed to cache products:', error);
    throw new Error('Failed to cache products for offline use');
  }
}

/**
 * Cache customers for offline use
 * Typically called after fetching from API
 */
export async function cacheCustomers(customers: Customer[]): Promise<void> {
  try {
    // Clear existing customers first
    await clearStore(STORES.CUSTOMERS);
    
    // Bulk insert new customers
    await bulkCreate(STORES.CUSTOMERS, customers);
    
    console.log(`Cached ${customers.length} customers for offline use`);
  } catch (error) {
    console.error('Failed to cache customers:', error);
    throw new Error('Failed to cache customers for offline use');
  }
}

/**
 * Get products for a specific tenant
 */
export async function getProductsByTenant(tenantId: string): Promise<Product[]> {
  try {
    return await queryByIndex(STORES.PRODUCTS, 'tenantId', tenantId);
  } catch (error) {
    console.error('Failed to get products by tenant:', error);
    return [];
  }
}

/**
 * Get customers for a specific tenant
 */
export async function getCustomersByTenant(tenantId: string): Promise<Customer[]> {
  try {
    return await queryByIndex(STORES.CUSTOMERS, 'tenantId', tenantId);
  } catch (error) {
    console.error('Failed to get customers by tenant:', error);
    return [];
  }
}

/**
 * Get active products only
 */
export async function getActiveProducts(): Promise<Product[]> {
  try {
    const allProducts = await getAll(STORES.PRODUCTS);
    return allProducts.filter(p => p.isActive);
  } catch (error) {
    console.error('Failed to get active products:', error);
    return [];
  }
}

/**
 * Get products by category
 */
export async function getProductsByCategory(category: string): Promise<Product[]> {
  try {
    return await queryByIndex(STORES.PRODUCTS, 'category', category);
  } catch (error) {
    console.error('Failed to get products by category:', error);
    return [];
  }
}

/**
 * Find product by SKU
 */
export async function findProductBySku(sku: string): Promise<Product | undefined> {
  try {
    const products = await queryByIndex(STORES.PRODUCTS, 'sku', sku);
    return products[0];
  } catch (error) {
    console.error('Failed to find product by SKU:', error);
    return undefined;
  }
}

/**
 * Find product by barcode
 */
export async function findProductByBarcode(barcode: string): Promise<Product | undefined> {
  try {
    const products = await queryByIndex(STORES.PRODUCTS, 'barcode', barcode);
    return products[0];
  } catch (error) {
    console.error('Failed to find product by barcode:', error);
    return undefined;
  }
}

/**
 * Find customer by email
 */
export async function findCustomerByEmail(email: string): Promise<Customer | undefined> {
  try {
    const customers = await queryByIndex(STORES.CUSTOMERS, 'email', email);
    return customers[0];
  } catch (error) {
    console.error('Failed to find customer by email:', error);
    return undefined;
  }
}

/**
 * Find customer by phone
 */
export async function findCustomerByPhone(phone: string): Promise<Customer | undefined> {
  try {
    const customers = await queryByIndex(STORES.CUSTOMERS, 'phone', phone);
    return customers[0];
  } catch (error) {
    console.error('Failed to find customer by phone:', error);
    return undefined;
  }
}

/**
 * Save transaction offline and add to sync queue
 */
export async function saveTransactionOffline(transaction: Order): Promise<void> {
  try {
    // Save transaction to local store
    await create(STORES.TRANSACTIONS, transaction);
    
    // Add to sync queue
    const syncItem: SyncQueueItem = {
      id: `sync-${Date.now()}-${transaction.id}`,
      operation: 'create',
      storeName: STORES.TRANSACTIONS,
      data: transaction,
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    await create(STORES.SYNC_QUEUE, syncItem);
    
    console.log('Transaction saved offline and queued for sync');
  } catch (error) {
    console.error('Failed to save transaction offline:', error);
    throw new Error('Failed to save transaction offline');
  }
}

/**
 * Get all pending transactions (not synced yet)
 */
export async function getPendingTransactions(): Promise<Order[]> {
  try {
    return await getAll(STORES.TRANSACTIONS);
  } catch (error) {
    console.error('Failed to get pending transactions:', error);
    return [];
  }
}

/**
 * Get transactions by customer
 */
export async function getTransactionsByCustomer(customerId: string): Promise<Order[]> {
  try {
    return await queryByIndex(STORES.TRANSACTIONS, 'customerId', customerId);
  } catch (error) {
    console.error('Failed to get transactions by customer:', error);
    return [];
  }
}

/**
 * Get transactions by status
 */
export async function getTransactionsByStatus(status: string): Promise<Order[]> {
  try {
    return await queryByIndex(STORES.TRANSACTIONS, 'status', status);
  } catch (error) {
    console.error('Failed to get transactions by status:', error);
    return [];
  }
}

/**
 * Get all items in sync queue
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    return await getAll(STORES.SYNC_QUEUE);
  } catch (error) {
    console.error('Failed to get sync queue:', error);
    return [];
  }
}

/**
 * Get sync queue count
 */
export async function getSyncQueueCount(): Promise<number> {
  try {
    const items = await getAll(STORES.SYNC_QUEUE);
    return items.length;
  } catch (error) {
    console.error('Failed to get sync queue count:', error);
    return 0;
  }
}

/**
 * Update sync queue item after retry
 */
export async function updateSyncQueueItem(
  item: SyncQueueItem,
  error?: string
): Promise<void> {
  try {
    const updatedItem: SyncQueueItem = {
      ...item,
      retryCount: item.retryCount + 1,
      lastError: error,
    };
    
    await update(STORES.SYNC_QUEUE, updatedItem);
  } catch (error) {
    console.error('Failed to update sync queue item:', error);
  }
}

/**
 * Get low stock products
 */
export async function getLowStockProducts(): Promise<Product[]> {
  try {
    const allProducts = await getAll(STORES.PRODUCTS);
    return allProducts.filter(p => p.stockQuantity <= p.minStockLevel);
  } catch (error) {
    console.error('Failed to get low stock products:', error);
    return [];
  }
}

/**
 * Get out of stock products
 */
export async function getOutOfStockProducts(): Promise<Product[]> {
  try {
    const allProducts = await getAll(STORES.PRODUCTS);
    return allProducts.filter(p => p.stockQuantity === 0);
  } catch (error) {
    console.error('Failed to get out of stock products:', error);
    return [];
  }
}

/**
 * Check if product is in stock
 */
export async function isProductInStock(productId: string): Promise<boolean> {
  try {
    const products = await getAll(STORES.PRODUCTS);
    const product = products.find(p => p.id === productId);
    return product ? product.stockQuantity > 0 : false;
  } catch (error) {
    console.error('Failed to check product stock:', error);
    return false;
  }
}

/**
 * Get product stock quantity
 */
export async function getProductStock(productId: string): Promise<number> {
  try {
    const products = await getAll(STORES.PRODUCTS);
    const product = products.find(p => p.id === productId);
    return product?.stockQuantity || 0;
  } catch (error) {
    console.error('Failed to get product stock:', error);
    return 0;
  }
}
