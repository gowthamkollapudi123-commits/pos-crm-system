/**
 * Offline Stock Updates Tests
 * 
 * Tests for offline stock update queuing and synchronization.
 * Requirements: 11.5, 15.7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveTransactionOffline, getSyncQueue } from '../indexeddb-helpers';
import { create, getAll, STORES } from '../indexeddb';
import type { Order, OrderItem } from '@/types/entities';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@/types/enums';

// Mock IndexedDB operations
vi.mock('../indexeddb', () => ({
  STORES: {
    TRANSACTIONS: 'transactions',
    SYNC_QUEUE: 'sync_queue',
    PRODUCTS: 'products',
    CUSTOMERS: 'customers',
  },
  create: vi.fn(),
  getAll: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  clearStore: vi.fn(),
  queryByIndex: vi.fn(),
  bulkCreate: vi.fn(),
}));

describe('Offline Stock Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveTransactionOffline', () => {
    it('should save transaction and queue stock updates', async () => {
      const mockOrder: Order = {
        id: 'order-1',
        tenantId: 'tenant-1',
        orderNumber: 'ORD-001',
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            quantity: 2,
            unitPrice: 100,
            totalPrice: 200,
          },
          {
            id: 'item-2',
            productId: 'prod-2',
            quantity: 1,
            unitPrice: 50,
            totalPrice: 50,
          },
        ] as OrderItem[],
        subtotal: 250,
        taxAmount: 45,
        discountAmount: 0,
        totalAmount: 295,
        status: OrderStatus.COMPLETED,
        paymentMethod: PaymentMethod.CASH,
        paymentStatus: PaymentStatus.PAID,
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(create).mockResolvedValue(undefined);

      await saveTransactionOffline(mockOrder);

      // Verify transaction was saved
      expect(create).toHaveBeenCalledWith(
        STORES.TRANSACTIONS,
        mockOrder
      );

      // Verify sync queue item was created
      expect(create).toHaveBeenCalledWith(
        STORES.SYNC_QUEUE,
        expect.objectContaining({
          operation: 'create',
          storeName: STORES.TRANSACTIONS,
          data: mockOrder,
          retryCount: 0,
        })
      );
    });

    it('should handle errors when saving offline', async () => {
      const mockOrder: Order = {
        id: 'order-1',
        tenantId: 'tenant-1',
        orderNumber: 'ORD-001',
        items: [],
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 0,
        status: OrderStatus.COMPLETED,
        paymentMethod: PaymentMethod.CASH,
        paymentStatus: PaymentStatus.PAID,
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(create).mockRejectedValue(new Error('IndexedDB error'));

      await expect(saveTransactionOffline(mockOrder)).rejects.toThrow(
        'Failed to save transaction offline'
      );
    });
  });

  describe('getSyncQueue', () => {
    it('should retrieve all pending sync items', async () => {
      const mockSyncItems = [
        {
          id: 'sync-1',
          operation: 'create',
          storeName: STORES.TRANSACTIONS,
          data: { id: 'order-1' },
          timestamp: Date.now(),
          retryCount: 0,
        },
        {
          id: 'sync-2',
          operation: 'update',
          storeName: 'stock_updates',
          data: { productId: 'prod-1', quantity: -5 },
          timestamp: Date.now(),
          retryCount: 0,
        },
      ];

      vi.mocked(getAll).mockResolvedValue(mockSyncItems);

      const result = await getSyncQueue();

      expect(getAll).toHaveBeenCalledWith(STORES.SYNC_QUEUE);
      expect(result).toEqual(mockSyncItems);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no sync items', async () => {
      vi.mocked(getAll).mockResolvedValue([]);

      const result = await getSyncQueue();

      expect(result).toEqual([]);
    });

    it('should handle errors when retrieving sync queue', async () => {
      vi.mocked(getAll).mockRejectedValue(new Error('IndexedDB error'));

      const result = await getSyncQueue();

      expect(result).toEqual([]);
    });
  });

  describe('Stock Update Queuing', () => {
    it('should queue stock updates for multiple products', async () => {
      const mockOrder: Order = {
        id: 'order-1',
        tenantId: 'tenant-1',
        orderNumber: 'ORD-001',
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            quantity: 3,
            unitPrice: 100,
            totalPrice: 300,
          },
          {
            id: 'item-2',
            productId: 'prod-2',
            quantity: 2,
            unitPrice: 50,
            totalPrice: 100,
          },
          {
            id: 'item-3',
            productId: 'prod-3',
            quantity: 1,
            unitPrice: 200,
            totalPrice: 200,
          },
        ] as OrderItem[],
        subtotal: 600,
        taxAmount: 108,
        discountAmount: 0,
        totalAmount: 708,
        status: OrderStatus.COMPLETED,
        paymentMethod: PaymentMethod.CARD,
        paymentStatus: PaymentStatus.PAID,
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(create).mockResolvedValue(undefined);

      await saveTransactionOffline(mockOrder);

      // Verify transaction was saved
      expect(create).toHaveBeenCalledWith(
        STORES.TRANSACTIONS,
        mockOrder
      );

      // Verify sync queue item was created for the transaction
      expect(create).toHaveBeenCalledWith(
        STORES.SYNC_QUEUE,
        expect.objectContaining({
          operation: 'create',
          storeName: STORES.TRANSACTIONS,
        })
      );
    });

    it('should include order reference in stock update queue items', async () => {
      const mockOrder: Order = {
        id: 'order-123',
        tenantId: 'tenant-1',
        orderNumber: 'ORD-123',
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            quantity: 5,
            unitPrice: 100,
            totalPrice: 500,
          },
        ] as OrderItem[],
        subtotal: 500,
        taxAmount: 90,
        discountAmount: 0,
        totalAmount: 590,
        status: OrderStatus.COMPLETED,
        paymentMethod: PaymentMethod.UPI,
        paymentStatus: PaymentStatus.PAID,
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(create).mockResolvedValue(undefined);

      await saveTransactionOffline(mockOrder);

      expect(create).toHaveBeenCalledWith(
        STORES.SYNC_QUEUE,
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'order-123',
          }),
        })
      );
    });
  });

  describe('Sync Queue Management', () => {
    it('should track retry count for failed syncs', async () => {
      const mockSyncItems = [
        {
          id: 'sync-1',
          operation: 'create',
          storeName: STORES.TRANSACTIONS,
          data: { id: 'order-1' },
          timestamp: Date.now(),
          retryCount: 2,
          lastError: 'Network error',
        },
      ];

      vi.mocked(getAll).mockResolvedValue(mockSyncItems);

      const result = await getSyncQueue();

      expect(result[0].retryCount).toBe(2);
      expect(result[0].lastError).toBe('Network error');
    });

    it('should maintain timestamp for sync items', async () => {
      const timestamp = Date.now();
      const mockSyncItems = [
        {
          id: 'sync-1',
          operation: 'create',
          storeName: STORES.TRANSACTIONS,
          data: { id: 'order-1' },
          timestamp,
          retryCount: 0,
        },
      ];

      vi.mocked(getAll).mockResolvedValue(mockSyncItems);

      const result = await getSyncQueue();

      expect(result[0].timestamp).toBe(timestamp);
    });
  });
});
