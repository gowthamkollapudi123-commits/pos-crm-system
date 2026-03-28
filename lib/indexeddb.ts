/**
 * IndexedDB Wrapper for Offline Storage
 * 
 * Provides a robust interface for storing and retrieving data offline.
 * Supports: products, customers, transactions, sync_queue stores
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8
 */

import { Product, Customer, Order } from '@/types/entities';

// Database configuration
const DB_NAME = 'pos_crm_db';
const DB_VERSION = 1;

// Storage quota limit (50MB)
const MAX_STORAGE_SIZE = 50 * 1024 * 1024;

// Object store names
export const STORES = {
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
  TRANSACTIONS: 'transactions',
  SYNC_QUEUE: 'sync_queue',
} as const;

export type StoreName = typeof STORES[keyof typeof STORES];

// Sync queue item structure
export interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  storeName: StoreName;
  data: unknown;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

// Type mapping for stores
type StoreDataMap = {
  [STORES.PRODUCTS]: Product;
  [STORES.CUSTOMERS]: Customer;
  [STORES.TRANSACTIONS]: Order;
  [STORES.SYNC_QUEUE]: SyncQueueItem;
};

/**
 * Initialize IndexedDB database with object stores and indexes
 * Requirement 16.1: Create object stores
 * Requirement 16.3: Use indexes for efficient querying
 * Requirement 16.4: Handle database version migrations
 */
function initDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      const error = new Error(`Failed to open IndexedDB: ${request.error?.message}`);
      console.error(error);
      reject(error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    // Handle database upgrades and migrations
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = (event.target as IDBOpenDBRequest).transaction;

      if (!transaction) {
        reject(new Error('Transaction not available during upgrade'));
        return;
      }

      // Create products store with indexes
      if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
        const productStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
        productStore.createIndex('sku', 'sku', { unique: true });
        productStore.createIndex('name', 'name', { unique: false });
        productStore.createIndex('category', 'category', { unique: false });
        productStore.createIndex('barcode', 'barcode', { unique: false });
        productStore.createIndex('tenantId', 'tenantId', { unique: false });
        productStore.createIndex('isActive', 'isActive', { unique: false });
      }

      // Create customers store with indexes
      if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
        const customerStore = db.createObjectStore(STORES.CUSTOMERS, { keyPath: 'id' });
        customerStore.createIndex('name', 'name', { unique: false });
        customerStore.createIndex('email', 'email', { unique: false });
        customerStore.createIndex('phone', 'phone', { unique: false });
        customerStore.createIndex('tenantId', 'tenantId', { unique: false });
      }

      // Create transactions store with indexes
      if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        const transactionStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
        transactionStore.createIndex('orderNumber', 'orderNumber', { unique: true });
        transactionStore.createIndex('customerId', 'customerId', { unique: false });
        transactionStore.createIndex('status', 'status', { unique: false });
        transactionStore.createIndex('createdAt', 'createdAt', { unique: false });
        transactionStore.createIndex('tenantId', 'tenantId', { unique: false });
      }

      // Create sync queue store with indexes
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncStore.createIndex('operation', 'operation', { unique: false });
        syncStore.createIndex('storeName', 'storeName', { unique: false });
      }
    };
  });
}

/**
 * Get database connection
 */
async function getDB(): Promise<IDBDatabase> {
  try {
    return await initDatabase();
  } catch (error) {
    console.error('Failed to get database connection:', error);
    throw error;
  }
}

/**
 * Create a new record in the specified store
 * Requirement 16.2: Support CRUD operations
 */
export async function create<T extends StoreName>(
  storeName: T,
  data: StoreDataMap[T]
): Promise<void> {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        const error = new Error(`Failed to create record: ${request.error?.message}`);
        console.error(error);
        reject(error);
      };

      transaction.oncomplete = () => db.close();
      transaction.onerror = () => {
        const error = new Error(`Transaction failed: ${transaction.error?.message}`);
        console.error(error);
        db.close();
        reject(error);
      };
    } catch (error) {
      db.close();
      reject(error);
    }
  });
}

/**
 * Read a record by ID from the specified store
 * Requirement 16.2: Support CRUD operations
 */
export async function read<T extends StoreName>(
  storeName: T,
  id: string
): Promise<StoreDataMap[T] | undefined> {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        const error = new Error(`Failed to read record: ${request.error?.message}`);
        console.error(error);
        reject(error);
      };

      transaction.oncomplete = () => db.close();
      transaction.onerror = () => {
        const error = new Error(`Transaction failed: ${transaction.error?.message}`);
        console.error(error);
        db.close();
        reject(error);
      };
    } catch (error) {
      db.close();
      reject(error);
    }
  });
}

/**
 * Update an existing record in the specified store
 * Requirement 16.2: Support CRUD operations
 */
export async function update<T extends StoreName>(
  storeName: T,
  data: StoreDataMap[T]
): Promise<void> {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        const error = new Error(`Failed to update record: ${request.error?.message}`);
        console.error(error);
        reject(error);
      };

      transaction.oncomplete = () => db.close();
      transaction.onerror = () => {
        const error = new Error(`Transaction failed: ${transaction.error?.message}`);
        console.error(error);
        db.close();
        reject(error);
      };
    } catch (error) {
      db.close();
      reject(error);
    }
  });
}

/**
 * Delete a record by ID from the specified store
 * Requirement 16.2: Support CRUD operations
 */
export async function deleteRecord<T extends StoreName>(
  storeName: T,
  id: string
): Promise<void> {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        const error = new Error(`Failed to delete record: ${request.error?.message}`);
        console.error(error);
        reject(error);
      };

      transaction.oncomplete = () => db.close();
      transaction.onerror = () => {
        const error = new Error(`Transaction failed: ${transaction.error?.message}`);
        console.error(error);
        db.close();
        reject(error);
      };
    } catch (error) {
      db.close();
      reject(error);
    }
  });
}

/**
 * Get all records from the specified store
 * Requirement 16.2: Support CRUD operations
 */
export async function getAll<T extends StoreName>(
  storeName: T
): Promise<StoreDataMap[T][]> {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        const error = new Error(`Failed to get all records: ${request.error?.message}`);
        console.error(error);
        reject(error);
      };

      transaction.oncomplete = () => db.close();
      transaction.onerror = () => {
        const error = new Error(`Transaction failed: ${transaction.error?.message}`);
        console.error(error);
        db.close();
        reject(error);
      };
    } catch (error) {
      db.close();
      reject(error);
    }
  });
}

/**
 * Query records by index
 * Requirement 16.3: Use indexes for efficient querying
 */
export async function queryByIndex<T extends StoreName>(
  storeName: T,
  indexName: string,
  value: string | number
): Promise<StoreDataMap[T][]> {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value as IDBValidKey);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        const error = new Error(`Failed to query by index: ${request.error?.message}`);
        console.error(error);
        reject(error);
      };

      transaction.oncomplete = () => db.close();
      transaction.onerror = () => {
        const error = new Error(`Transaction failed: ${transaction.error?.message}`);
        console.error(error);
        db.close();
        reject(error);
      };
    } catch (error) {
      db.close();
      reject(error);
    }
  });
}

/**
 * Bulk create records with transaction batching
 * Requirement 16.6: Implement transaction batching for bulk operations
 */
export async function bulkCreate<T extends StoreName>(
  storeName: T,
  records: StoreDataMap[T][]
): Promise<void> {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      // Add all records in a single transaction
      for (const record of records) {
        store.add(record);
      }

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };

      transaction.onerror = () => {
        const error = new Error(`Bulk create failed: ${transaction.error?.message}`);
        console.error(error);
        db.close();
        reject(error);
      };
    } catch (error) {
      db.close();
      reject(error);
    }
  });
}

/**
 * Bulk update records with transaction batching
 * Requirement 16.6: Implement transaction batching for bulk operations
 */
export async function bulkUpdate<T extends StoreName>(
  storeName: T,
  records: StoreDataMap[T][]
): Promise<void> {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      // Update all records in a single transaction
      for (const record of records) {
        store.put(record);
      }

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };

      transaction.onerror = () => {
        const error = new Error(`Bulk update failed: ${transaction.error?.message}`);
        console.error(error);
        db.close();
        reject(error);
      };
    } catch (error) {
      db.close();
      reject(error);
    }
  });
}

/**
 * Bulk delete records with transaction batching
 * Requirement 16.6: Implement transaction batching for bulk operations
 */
export async function bulkDelete<T extends StoreName>(
  storeName: T,
  ids: string[]
): Promise<void> {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      // Delete all records in a single transaction
      for (const id of ids) {
        store.delete(id);
      }

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };

      transaction.onerror = () => {
        const error = new Error(`Bulk delete failed: ${transaction.error?.message}`);
        console.error(error);
        db.close();
        reject(error);
      };
    } catch (error) {
      db.close();
      reject(error);
    }
  });
}

/**
 * Clear all data from a specific store
 * Requirement 16.7: Provide a clear function to reset local data
 */
export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => {
        const error = new Error(`Failed to clear store: ${request.error?.message}`);
        console.error(error);
        reject(error);
      };

      transaction.oncomplete = () => db.close();
      transaction.onerror = () => {
        const error = new Error(`Transaction failed: ${transaction.error?.message}`);
        console.error(error);
        db.close();
        reject(error);
      };
    } catch (error) {
      db.close();
      reject(error);
    }
  });
}

/**
 * Clear all data from all stores
 * Requirement 16.7: Provide a clear function to reset local data
 */
export async function clearAllStores(): Promise<void> {
  const stores = Object.values(STORES);
  
  for (const store of stores) {
    await clearStore(store);
  }
}

/**
 * Get the estimated storage size
 * Requirement 16.8: Limit storage size to prevent browser quota issues
 */
export async function getStorageSize(): Promise<number> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
  return 0;
}

/**
 * Check if storage is approaching quota limit
 * Requirement 16.8: Limit storage size to prevent browser quota issues
 */
export async function isStorageNearLimit(): Promise<boolean> {
  const currentSize = await getStorageSize();
  return currentSize >= MAX_STORAGE_SIZE * 0.9; // 90% threshold
}

/**
 * Get storage usage statistics
 * Requirement 16.8: Limit storage size to prevent browser quota issues
 */
export async function getStorageStats(): Promise<{
  used: number;
  quota: number;
  percentage: number;
  isNearLimit: boolean;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage || 0;
    const quota = estimate.quota || MAX_STORAGE_SIZE;
    const percentage = (used / quota) * 100;
    const isNearLimit = percentage >= 90;

    return {
      used,
      quota,
      percentage,
      isNearLimit,
    };
  }

  return {
    used: 0,
    quota: MAX_STORAGE_SIZE,
    percentage: 0,
    isNearLimit: false,
  };
}

/**
 * Count records in a store
 */
export async function count(storeName: StoreName): Promise<number> {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        const error = new Error(`Failed to count records: ${request.error?.message}`);
        console.error(error);
        reject(error);
      };

      transaction.oncomplete = () => db.close();
      transaction.onerror = () => {
        const error = new Error(`Transaction failed: ${transaction.error?.message}`);
        console.error(error);
        db.close();
        reject(error);
      };
    } catch (error) {
      db.close();
      reject(error);
    }
  });
}

/**
 * Check if a record exists
 */
export async function exists(storeName: StoreName, id: string): Promise<boolean> {
  const record = await read(storeName, id);
  return record !== undefined;
}

/**
 * Search records by a field value (case-insensitive partial match)
 * Useful for search functionality
 */
export async function search<T extends StoreName>(
  storeName: T,
  field: string,
  searchTerm: string
): Promise<StoreDataMap[T][]> {
  const allRecords = await getAll(storeName);
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return allRecords.filter((record) => {
    const value = (record as unknown as Record<string, unknown>)[field];
    if (typeof value === 'string') {
      return value.toLowerCase().includes(lowerSearchTerm);
    }
    return false;
  });
}

/**
 * Get records with pagination
 */
export async function getPaginated<T extends StoreName>(
  storeName: T,
  page: number = 1,
  pageSize: number = 20
): Promise<{
  data: StoreDataMap[T][];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const allRecords = await getAll(storeName);
  const total = allRecords.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const data = allRecords.slice(startIndex, endIndex);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Delete the entire database
 * Use with caution - this will remove all data
 */
export async function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      const error = new Error(`Failed to delete database: ${request.error?.message}`);
      console.error(error);
      reject(error);
    };
    request.onblocked = () => {
      console.warn('Database deletion blocked - close all connections');
    };
  });
}

/**
 * Check if IndexedDB is supported
 */
export function isIndexedDBSupported(): boolean {
  return typeof indexedDB !== 'undefined';
}

/**
 * Initialize the database (useful for preloading)
 */
export async function initialize(): Promise<void> {
  if (!isIndexedDBSupported()) {
    throw new Error('IndexedDB is not supported in this browser');
  }
  
  const db = await getDB();
  db.close();
}
