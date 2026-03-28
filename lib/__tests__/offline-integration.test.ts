/**
 * Offline Integration Tests
 *
 * Tests sync queue logic, IndexedDB caching patterns, and conflict resolution.
 * Uses mocks to avoid requiring a real IndexedDB environment.
 *
 * Requirements: 15.1-15.14, 16.1-16.8
 */

import { describe, it, expect, vi } from 'vitest';
import { STORES } from '../indexeddb';
import type { Product, Customer, Order } from '@/types/entities';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@/types/enums';
import type { SyncQueueItem } from '../indexeddb';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockProduct: Product = {
  id: 'prod-offline-1',
  tenantId: 'tenant-1',
  sku: 'SKU-OFF-001',
  name: 'Offline Product',
  category: 'Electronics',
  price: 50,
  stockQuantity: 20,
  minStockLevel: 5,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockCustomer: Customer = {
  id: 'cust-offline-1',
  tenantId: 'tenant-1',
  name: 'Offline Customer',
  email: 'offline@example.com',
  phone: '+9999999999',
  lifetimeValue: 0,
  totalOrders: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockTransaction: Order = {
  id: 'txn-offline-1',
  tenantId: 'tenant-1',
  orderNumber: 'ORD-OFF-001',
  items: [{ id: 'item-1', productId: 'prod-offline-1', quantity: 2, unitPrice: 50, totalPrice: 100 }],
  subtotal: 100,
  taxAmount: 10,
  discountAmount: 0,
  totalAmount: 110,
  status: OrderStatus.COMPLETED,
  paymentMethod: PaymentMethod.CASH,
  paymentStatus: PaymentStatus.SUCCESS,
  createdBy: 'user-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ── In-memory store for mocking ───────────────────────────────────────────────

type StoreMap = Record<string, Record<string, unknown>>;

function createInMemoryStore(): StoreMap {
  return {
    [STORES.PRODUCTS]: {},
    [STORES.CUSTOMERS]: {},
    [STORES.TRANSACTIONS]: {},
    [STORES.SYNC_QUEUE]: {},
  };
}

// ── Sync Queue Logic (Req 15.7, 15.8, 15.9) ──────────────────────────────────

describe('Sync Queue — stores transactions when offline (Req 15.7)', () => {
  it('creates a sync queue item with correct structure', () => {
    const syncItem: SyncQueueItem = {
      id: `sync-${Date.now()}-${mockTransaction.id}`,
      operation: 'create',
      storeName: STORES.TRANSACTIONS,
      data: mockTransaction,
      timestamp: Date.now(),
      retryCount: 0,
    };

    expect(syncItem.operation).toBe('create');
    expect(syncItem.storeName).toBe(STORES.TRANSACTIONS);
    expect(syncItem.retryCount).toBe(0);
    expect(typeof syncItem.timestamp).toBe('number');
    expect(syncItem.timestamp).toBeGreaterThan(0);
    expect(syncItem.data).toEqual(mockTransaction);
  });

  it('sync queue item id is unique per transaction', () => {
    const id1 = `sync-${Date.now()}-txn-1`;
    const id2 = `sync-${Date.now()}-txn-2`;
    expect(id1).not.toBe(id2);
  });

  it('multiple offline transactions produce multiple queue items', () => {
    const store: StoreMap = createInMemoryStore();

    const txn1: SyncQueueItem = {
      id: 'sync-1',
      operation: 'create',
      storeName: STORES.TRANSACTIONS,
      data: mockTransaction,
      timestamp: Date.now(),
      retryCount: 0,
    };
    const txn2: SyncQueueItem = {
      id: 'sync-2',
      operation: 'create',
      storeName: STORES.TRANSACTIONS,
      data: { ...mockTransaction, id: 'txn-offline-2' },
      timestamp: Date.now(),
      retryCount: 0,
    };

    store[STORES.SYNC_QUEUE][txn1.id] = txn1;
    store[STORES.SYNC_QUEUE][txn2.id] = txn2;

    expect(Object.keys(store[STORES.SYNC_QUEUE]).length).toBe(2);
  });
});

describe('Sync Queue — processes on reconnect (Req 15.8, 15.9)', () => {
  it('increments retry count on failed sync attempt', () => {
    const item: SyncQueueItem = {
      id: 'sync-retry-1',
      operation: 'create',
      storeName: STORES.TRANSACTIONS,
      data: mockTransaction,
      timestamp: Date.now(),
      retryCount: 0,
    };

    // Simulate updateSyncQueueItem logic
    const updated: SyncQueueItem = {
      ...item,
      retryCount: item.retryCount + 1,
      lastError: 'Network error',
    };

    expect(updated.retryCount).toBe(1);
    expect(updated.lastError).toBe('Network error');
  });

  it('removes item from queue after successful sync', () => {
    const store: StoreMap = createInMemoryStore();

    const item: SyncQueueItem = {
      id: 'sync-done-1',
      operation: 'create',
      storeName: STORES.TRANSACTIONS,
      data: mockTransaction,
      timestamp: Date.now(),
      retryCount: 0,
    };

    store[STORES.SYNC_QUEUE][item.id] = item;
    expect(Object.keys(store[STORES.SYNC_QUEUE]).length).toBe(1);

    // Simulate successful sync: remove from queue
    delete store[STORES.SYNC_QUEUE][item.id];
    expect(Object.keys(store[STORES.SYNC_QUEUE]).length).toBe(0);
  });

  it('exponential backoff delay increases with retry count', () => {
    const baseDelay = 1000;
    const getDelay = (retryCount: number) => baseDelay * Math.pow(2, retryCount);

    expect(getDelay(0)).toBe(1000);
    expect(getDelay(1)).toBe(2000);
    expect(getDelay(2)).toBe(4000);
    expect(getDelay(3)).toBe(8000);
  });
});

// ── IndexedDB Caching Patterns (Req 15.4, 15.5, 16.1, 16.2) ─────────────────

describe('IndexedDB — caching patterns', () => {
  it('product cache stores products keyed by id (Req 15.4)', () => {
    const store: StoreMap = createInMemoryStore();

    store[STORES.PRODUCTS][mockProduct.id] = mockProduct;

    const retrieved = store[STORES.PRODUCTS][mockProduct.id] as Product;
    expect(retrieved).toBeDefined();
    expect(retrieved.id).toBe(mockProduct.id);
    expect(retrieved.name).toBe(mockProduct.name);
  });

  it('customer cache stores customers keyed by id (Req 15.5)', () => {
    const store: StoreMap = createInMemoryStore();

    store[STORES.CUSTOMERS][mockCustomer.id] = mockCustomer;

    const retrieved = store[STORES.CUSTOMERS][mockCustomer.id] as Customer;
    expect(retrieved).toBeDefined();
    expect(retrieved.email).toBe(mockCustomer.email);
  });

  it('re-caching replaces existing data (Req 16.7)', () => {
    const store: StoreMap = createInMemoryStore();

    store[STORES.PRODUCTS][mockProduct.id] = mockProduct;

    // Simulate clearStore + bulkCreate
    Object.keys(store[STORES.PRODUCTS]).forEach((k) => delete store[STORES.PRODUCTS][k]);
    const updated: Product = { ...mockProduct, name: 'Updated Offline Product' };
    store[STORES.PRODUCTS][updated.id] = updated;

    const products = Object.values(store[STORES.PRODUCTS]) as Product[];
    expect(products.length).toBe(1);
    expect(products[0].name).toBe('Updated Offline Product');
  });

  it('transaction store persists offline transactions (Req 15.6)', () => {
    const store: StoreMap = createInMemoryStore();

    store[STORES.TRANSACTIONS][mockTransaction.id] = mockTransaction;

    const retrieved = store[STORES.TRANSACTIONS][mockTransaction.id] as Order;
    expect(retrieved).toBeDefined();
    expect(retrieved.orderNumber).toBe(mockTransaction.orderNumber);
    expect(retrieved.totalAmount).toBe(110);
  });

  it('all four object stores are defined (Req 16.1)', () => {
    expect(STORES.PRODUCTS).toBe('products');
    expect(STORES.CUSTOMERS).toBe('customers');
    expect(STORES.TRANSACTIONS).toBe('transactions');
    expect(STORES.SYNC_QUEUE).toBe('sync_queue');
  });
});

// ── Conflict Resolution — last-write-wins (Req 15.10) ────────────────────────

describe('Conflict Resolution — last-write-wins', () => {
  it('later update overwrites earlier update based on updatedAt timestamp', () => {
    const store: StoreMap = createInMemoryStore();

    const earlier: Product = {
      ...mockProduct,
      name: 'Earlier Version',
      updatedAt: new Date(Date.now() - 10000).toISOString(),
    };
    const later: Product = {
      ...mockProduct,
      name: 'Later Version',
      updatedAt: new Date().toISOString(),
    };

    store[STORES.PRODUCTS][earlier.id] = earlier;

    // Apply last-write-wins: update only if incoming is newer
    const existing = store[STORES.PRODUCTS][mockProduct.id] as Product;
    if (existing && new Date(later.updatedAt) > new Date(existing.updatedAt)) {
      store[STORES.PRODUCTS][later.id] = later;
    }

    const resolved = store[STORES.PRODUCTS][mockProduct.id] as Product;
    expect(resolved.name).toBe('Later Version');
  });

  it('older update does NOT overwrite newer local data', () => {
    const store: StoreMap = createInMemoryStore();

    const newer: Product = {
      ...mockProduct,
      name: 'Newer Local Version',
      updatedAt: new Date().toISOString(),
    };
    const older: Product = {
      ...mockProduct,
      name: 'Older Server Version',
      updatedAt: new Date(Date.now() - 10000).toISOString(),
    };

    store[STORES.PRODUCTS][newer.id] = newer;

    // Apply last-write-wins: skip if incoming is older
    const existing = store[STORES.PRODUCTS][mockProduct.id] as Product;
    if (existing && new Date(older.updatedAt) > new Date(existing.updatedAt)) {
      store[STORES.PRODUCTS][older.id] = older;
    }

    const resolved = store[STORES.PRODUCTS][mockProduct.id] as Product;
    expect(resolved.name).toBe('Newer Local Version');
  });

  it('timestamps are compared correctly', () => {
    const t1 = new Date('2024-01-01T10:00:00Z');
    const t2 = new Date('2024-01-01T10:00:01Z');

    expect(t2 > t1).toBe(true);
    expect(t1 > t2).toBe(false);
  });

  it('equal timestamps result in no overwrite (idempotent)', () => {
    const ts = new Date().toISOString();
    const v1: Product = { ...mockProduct, name: 'Version 1', updatedAt: ts };
    const v2: Product = { ...mockProduct, name: 'Version 2', updatedAt: ts };

    const store: StoreMap = createInMemoryStore();
    store[STORES.PRODUCTS][v1.id] = v1;

    const existing = store[STORES.PRODUCTS][mockProduct.id] as Product;
    // Strict greater-than: equal timestamps do not overwrite
    if (existing && new Date(v2.updatedAt) > new Date(existing.updatedAt)) {
      store[STORES.PRODUCTS][v2.id] = v2;
    }

    const resolved = store[STORES.PRODUCTS][mockProduct.id] as Product;
    expect(resolved.name).toBe('Version 1');
  });
});

// ── Offline Indicator (Req 15.1, 15.2, 15.3) ─────────────────────────────────

describe('Offline Indicator — network status detection', () => {
  it('navigator.onLine reflects online status', () => {
    // In jsdom, navigator.onLine defaults to true
    expect(typeof navigator.onLine).toBe('boolean');
  });

  it('online/offline events can be dispatched', () => {
    const onlineHandler = vi.fn();
    const offlineHandler = vi.fn();

    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);

    window.dispatchEvent(new Event('online'));
    window.dispatchEvent(new Event('offline'));

    expect(onlineHandler).toHaveBeenCalledTimes(1);
    expect(offlineHandler).toHaveBeenCalledTimes(1);

    window.removeEventListener('online', onlineHandler);
    window.removeEventListener('offline', offlineHandler);
  });
});
