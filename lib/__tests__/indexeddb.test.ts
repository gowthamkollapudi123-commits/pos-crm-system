/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unit tests for IndexedDB wrapper
 * Tests all CRUD operations, bulk operations, and storage management
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  STORES,
  create,
  read,
  update,
  deleteRecord,
  getAll,
  queryByIndex,
  bulkCreate,
  bulkUpdate,
  bulkDelete,
  clearStore,
  clearAllStores,
  count,
  exists,
  search,
  getPaginated,
  isIndexedDBSupported,
  initialize,
  getStorageStats,
  isStorageNearLimit,
  type SyncQueueItem,
} from '../indexeddb';
import type { Product, Customer, Order } from '@/types/entities';

// Mock data
const mockProduct: Product = {
  id: 'prod-1',
  tenantId: 'tenant-1',
  sku: 'SKU-001',
  name: 'Test Product',
  category: 'Electronics',
  price: 99.99,
  stockQuantity: 100,
  minStockLevel: 10,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockCustomer: Customer = {
  id: 'cust-1',
  tenantId: 'tenant-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  lifetimeValue: 1000,
  totalOrders: 5,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockOrder: Order = {
  id: 'order-1',
  tenantId: 'tenant-1',
  orderNumber: 'ORD-001',
  items: [],
  subtotal: 100,
  taxAmount: 10,
  discountAmount: 0,
  totalAmount: 110,
  status: 'completed',
  paymentMethod: 'cash',
  paymentStatus: 'paid',
  createdBy: 'user-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockSyncQueueItem: SyncQueueItem = {
  id: 'sync-1',
  operation: 'create',
  storeName: STORES.PRODUCTS,
  data: mockProduct,
  timestamp: Date.now(),
  retryCount: 0,
};

describe('IndexedDB Wrapper', () => {
  beforeEach(async () => {
    // Clear all stores before each test
    await clearAllStores();
  });

  afterEach(async () => {
    // Clean up after each test
    await clearAllStores();
  });

  describe('Initialization', () => {
    it('should check if IndexedDB is supported', () => {
      expect(isIndexedDBSupported()).toBe(true);
    });

    it('should initialize the database', async () => {
      await expect(initialize()).resolves.not.toThrow();
    });
  });

  describe('CRUD Operations - Products', () => {
    it('should create a product', async () => {
      await create(STORES.PRODUCTS, mockProduct);
      const retrieved = await read(STORES.PRODUCTS, mockProduct.id);
      expect(retrieved).toEqual(mockProduct);
    });

    it('should read a product by id', async () => {
      await create(STORES.PRODUCTS, mockProduct);
      const retrieved = await read(STORES.PRODUCTS, mockProduct.id);
      expect(retrieved?.id).toBe(mockProduct.id);
      expect(retrieved?.name).toBe(mockProduct.name);
    });

    it('should return undefined for non-existent product', async () => {
      const retrieved = await read(STORES.PRODUCTS, 'non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should update a product', async () => {
      await create(STORES.PRODUCTS, mockProduct);
      
      const updatedProduct = { ...mockProduct, name: 'Updated Product', price: 149.99 };
      await update(STORES.PRODUCTS, updatedProduct);
      
      const retrieved = await read(STORES.PRODUCTS, mockProduct.id);
      expect(retrieved?.name).toBe('Updated Product');
      expect(retrieved?.price).toBe(149.99);
    });

    it('should delete a product', async () => {
      await create(STORES.PRODUCTS, mockProduct);
      await deleteRecord(STORES.PRODUCTS, mockProduct.id);
      
      const retrieved = await read(STORES.PRODUCTS, mockProduct.id);
      expect(retrieved).toBeUndefined();
    });

    it('should get all products', async () => {
      const product2 = { ...mockProduct, id: 'prod-2', sku: 'SKU-002' };
      await create(STORES.PRODUCTS, mockProduct);
      await create(STORES.PRODUCTS, product2);
      
      const allProducts = await getAll(STORES.PRODUCTS);
      expect(allProducts).toHaveLength(2);
    });
  });

  describe('CRUD Operations - Customers', () => {
    it('should create a customer', async () => {
      await create(STORES.CUSTOMERS, mockCustomer);
      const retrieved = await read(STORES.CUSTOMERS, mockCustomer.id);
      expect(retrieved).toEqual(mockCustomer);
    });

    it('should update a customer', async () => {
      await create(STORES.CUSTOMERS, mockCustomer);
      
      const updatedCustomer = { ...mockCustomer, name: 'Jane Doe' };
      await update(STORES.CUSTOMERS, updatedCustomer);
      
      const retrieved = await read(STORES.CUSTOMERS, mockCustomer.id);
      expect(retrieved?.name).toBe('Jane Doe');
    });
  });

  describe('CRUD Operations - Transactions', () => {
    it('should create a transaction', async () => {
      await create(STORES.TRANSACTIONS, mockOrder);
      const retrieved = await read(STORES.TRANSACTIONS, mockOrder.id);
      expect(retrieved).toEqual(mockOrder);
    });
  });

  describe('CRUD Operations - Sync Queue', () => {
    it('should create a sync queue item', async () => {
      await create(STORES.SYNC_QUEUE, mockSyncQueueItem);
      const retrieved = await read(STORES.SYNC_QUEUE, mockSyncQueueItem.id);
      expect(retrieved).toEqual(mockSyncQueueItem);
    });
  });

  describe('Index Queries', () => {
    it('should query products by category index', async () => {
      const product2 = { ...mockProduct, id: 'prod-2', sku: 'SKU-002', category: 'Books' };
      await create(STORES.PRODUCTS, mockProduct);
      await create(STORES.PRODUCTS, product2);
      
      const electronics = await queryByIndex(STORES.PRODUCTS, 'category', 'Electronics');
      expect(electronics).toHaveLength(1);
      expect(electronics[0].category).toBe('Electronics');
    });

    it('should query customers by tenantId index', async () => {
      const customer2 = { ...mockCustomer, id: 'cust-2', tenantId: 'tenant-2' };
      await create(STORES.CUSTOMERS, mockCustomer);
      await create(STORES.CUSTOMERS, customer2);
      
      const tenant1Customers = await queryByIndex(STORES.CUSTOMERS, 'tenantId', 'tenant-1');
      expect(tenant1Customers).toHaveLength(1);
      expect(tenant1Customers[0].tenantId).toBe('tenant-1');
    });

    it('should query transactions by status index', async () => {
      const order2 = { ...mockOrder, id: 'order-2', orderNumber: 'ORD-002', status: 'pending' };
      await create(STORES.TRANSACTIONS, mockOrder);
      await create(STORES.TRANSACTIONS, order2);
      
      const completedOrders = await queryByIndex(STORES.TRANSACTIONS, 'status', 'completed');
      expect(completedOrders).toHaveLength(1);
      expect(completedOrders[0].status).toBe('completed');
    });
  });

  describe('Bulk Operations', () => {
    it('should bulk create products', async () => {
      const products = [
        mockProduct,
        { ...mockProduct, id: 'prod-2', sku: 'SKU-002' },
        { ...mockProduct, id: 'prod-3', sku: 'SKU-003' },
      ];
      
      await bulkCreate(STORES.PRODUCTS, products);
      const allProducts = await getAll(STORES.PRODUCTS);
      expect(allProducts).toHaveLength(3);
    });

    it('should bulk update products', async () => {
      const products = [
        mockProduct,
        { ...mockProduct, id: 'prod-2', sku: 'SKU-002' },
      ];
      
      await bulkCreate(STORES.PRODUCTS, products);
      
      const updatedProducts = products.map(p => ({ ...p, price: 199.99 }));
      await bulkUpdate(STORES.PRODUCTS, updatedProducts);
      
      const allProducts = await getAll(STORES.PRODUCTS);
      expect(allProducts.every(p => p.price === 199.99)).toBe(true);
    });

    it('should bulk delete products', async () => {
      const products = [
        mockProduct,
        { ...mockProduct, id: 'prod-2', sku: 'SKU-002' },
        { ...mockProduct, id: 'prod-3', sku: 'SKU-003' },
      ];
      
      await bulkCreate(STORES.PRODUCTS, products);
      await bulkDelete(STORES.PRODUCTS, ['prod-1', 'prod-2']);
      
      const remaining = await getAll(STORES.PRODUCTS);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('prod-3');
    });
  });

  describe('Store Management', () => {
    it('should clear a specific store', async () => {
      await create(STORES.PRODUCTS, mockProduct);
      await create(STORES.CUSTOMERS, mockCustomer);
      
      await clearStore(STORES.PRODUCTS);
      
      const products = await getAll(STORES.PRODUCTS);
      const customers = await getAll(STORES.CUSTOMERS);
      
      expect(products).toHaveLength(0);
      expect(customers).toHaveLength(1);
    });

    it('should clear all stores', async () => {
      await create(STORES.PRODUCTS, mockProduct);
      await create(STORES.CUSTOMERS, mockCustomer);
      await create(STORES.TRANSACTIONS, mockOrder);
      
      await clearAllStores();
      
      const products = await getAll(STORES.PRODUCTS);
      const customers = await getAll(STORES.CUSTOMERS);
      const transactions = await getAll(STORES.TRANSACTIONS);
      
      expect(products).toHaveLength(0);
      expect(customers).toHaveLength(0);
      expect(transactions).toHaveLength(0);
    });

    it('should count records in a store', async () => {
      await create(STORES.PRODUCTS, mockProduct);
      await create(STORES.PRODUCTS, { ...mockProduct, id: 'prod-2', sku: 'SKU-002' });
      
      const productCount = await count(STORES.PRODUCTS);
      expect(productCount).toBe(2);
    });

    it('should check if a record exists', async () => {
      await create(STORES.PRODUCTS, mockProduct);
      
      const doesExist = await exists(STORES.PRODUCTS, mockProduct.id);
      const doesNotExist = await exists(STORES.PRODUCTS, 'non-existent');
      
      expect(doesExist).toBe(true);
      expect(doesNotExist).toBe(false);
    });
  });

  describe('Search and Pagination', () => {
    it('should search products by name', async () => {
      const products = [
        mockProduct,
        { ...mockProduct, id: 'prod-2', sku: 'SKU-002', name: 'Another Product' },
        { ...mockProduct, id: 'prod-3', sku: 'SKU-003', name: 'Test Item' },
      ];
      
      await bulkCreate(STORES.PRODUCTS, products);
      
      const results = await search(STORES.PRODUCTS, 'name', 'test');
      expect(results).toHaveLength(2); // "Test Product" and "Test Item"
    });

    it('should search customers by email', async () => {
      const customers = [
        mockCustomer,
        { ...mockCustomer, id: 'cust-2', email: 'jane@example.com' },
      ];
      
      await bulkCreate(STORES.CUSTOMERS, customers);
      
      const results = await search(STORES.CUSTOMERS, 'email', 'john');
      expect(results).toHaveLength(1);
      expect(results[0].email).toBe('john@example.com');
    });

    it('should paginate results', async () => {
      const products = Array.from({ length: 25 }, (_, i) => ({
        ...mockProduct,
        id: `prod-${i + 1}`,
        sku: `SKU-${String(i + 1).padStart(3, '0')}`,
      }));
      
      await bulkCreate(STORES.PRODUCTS, products);
      
      const page1 = await getPaginated(STORES.PRODUCTS, 1, 10);
      expect(page1.data).toHaveLength(10);
      expect(page1.total).toBe(25);
      expect(page1.totalPages).toBe(3);
      expect(page1.page).toBe(1);
      
      const page2 = await getPaginated(STORES.PRODUCTS, 2, 10);
      expect(page2.data).toHaveLength(10);
      expect(page2.page).toBe(2);
      
      const page3 = await getPaginated(STORES.PRODUCTS, 3, 10);
      expect(page3.data).toHaveLength(5);
      expect(page3.page).toBe(3);
    });
  });

  describe('Storage Management', () => {
    it('should get storage statistics', async () => {
      const stats = await getStorageStats();
      
      expect(stats).toHaveProperty('used');
      expect(stats).toHaveProperty('quota');
      expect(stats).toHaveProperty('percentage');
      expect(stats).toHaveProperty('isNearLimit');
      expect(typeof stats.used).toBe('number');
      expect(typeof stats.quota).toBe('number');
      expect(typeof stats.percentage).toBe('number');
      expect(typeof stats.isNearLimit).toBe('boolean');
    });

    it('should check if storage is near limit', async () => {
      const isNear = await isStorageNearLimit();
      expect(typeof isNear).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should handle duplicate key errors gracefully', async () => {
      await create(STORES.PRODUCTS, mockProduct);
      
      // Attempting to create the same product again should fail
      await expect(create(STORES.PRODUCTS, mockProduct)).rejects.toThrow();
    });

    it('should handle invalid store operations', async () => {
      // Trying to query a non-existent index should fail
      await expect(
        queryByIndex(STORES.PRODUCTS, 'nonExistentIndex', 'value')
      ).rejects.toThrow();
    });
  });
});
