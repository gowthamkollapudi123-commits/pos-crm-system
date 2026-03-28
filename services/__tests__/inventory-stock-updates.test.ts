/**
 * Inventory Stock Updates Tests
 * 
 * Tests for automatic stock updates on order completion and inventory movement tracking.
 * Requirements: 11.5, 11.12
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productsService } from '../products.service';
import { ordersService } from '../orders.service';
import apiClient from '@/lib/axios';

// Mock axios
vi.mock('@/lib/axios');

describe('Inventory Stock Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('productsService.updateStock', () => {
    it('should update stock and create inventory movement for sale', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            product: {
              id: 'prod-1',
              stockQuantity: 45,
            },
            movement: {
              id: 'mov-1',
              productId: 'prod-1',
              movementType: 'sale',
              quantity: -5,
              previousStock: 50,
              newStock: 45,
            },
          },
          timestamp: new Date().toISOString(),
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await productsService.updateStock(
        'prod-1',
        -5,
        'sale',
        'order-123',
        'order'
      );

      expect(apiClient.post).toHaveBeenCalledWith(
        '/products/prod-1/stock',
        {
          quantity: -5,
          movementType: 'sale',
          referenceId: 'order-123',
          referenceType: 'order',
          variantId: undefined,
          notes: undefined,
        }
      );

      expect(result.data.product.stockQuantity).toBe(45);
      expect(result.data.movement.movementType).toBe('sale');
    });

    it('should update stock for purchase', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            product: {
              id: 'prod-1',
              stockQuantity: 150,
            },
            movement: {
              id: 'mov-2',
              productId: 'prod-1',
              movementType: 'purchase',
              quantity: 100,
              previousStock: 50,
              newStock: 150,
            },
          },
          timestamp: new Date().toISOString(),
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await productsService.updateStock(
        'prod-1',
        100,
        'purchase',
        'po-456',
        'manual',
        undefined,
        'Restocking from supplier'
      );

      expect(apiClient.post).toHaveBeenCalledWith(
        '/products/prod-1/stock',
        {
          quantity: 100,
          movementType: 'purchase',
          referenceId: 'po-456',
          referenceType: 'manual',
          variantId: undefined,
          notes: 'Restocking from supplier',
        }
      );

      expect(result.data.product.stockQuantity).toBe(150);
    });

    it('should handle variant stock updates', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            product: {
              id: 'prod-1',
              variants: [
                {
                  id: 'var-1',
                  stockQuantity: 20,
                },
              ],
            },
            movement: {
              id: 'mov-3',
              productId: 'prod-1',
              variantId: 'var-1',
              movementType: 'sale',
              quantity: -3,
              previousStock: 23,
              newStock: 20,
            },
          },
          timestamp: new Date().toISOString(),
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await productsService.updateStock(
        'prod-1',
        -3,
        'sale',
        'order-789',
        'order',
        'var-1'
      );

      expect(apiClient.post).toHaveBeenCalledWith(
        '/products/prod-1/stock',
        expect.objectContaining({
          variantId: 'var-1',
        })
      );

      expect(result.data.movement.variantId).toBe('var-1');
    });
  });

  describe('productsService.recordInventoryMovement', () => {
    it('should record inventory movement', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'mov-1',
            productId: 'prod-1',
            movementType: 'adjustment',
            quantity: 5,
            previousStock: 50,
            newStock: 55,
            referenceType: 'manual',
            referenceId: 'adj-123',
            notes: 'Stock count adjustment',
            createdAt: new Date().toISOString(),
            createdBy: 'user-1',
          },
          timestamp: new Date().toISOString(),
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await productsService.recordInventoryMovement({
        productId: 'prod-1',
        movementType: 'adjustment',
        quantity: 5,
        previousStock: 50,
        newStock: 55,
        referenceType: 'manual',
        referenceId: 'adj-123',
        notes: 'Stock count adjustment',
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/inventory-movements',
        expect.objectContaining({
          productId: 'prod-1',
          movementType: 'adjustment',
          quantity: 5,
        })
      );

      expect(result.data.id).toBe('mov-1');
    });
  });

  describe('productsService.getInventoryHistory', () => {
    it('should fetch inventory history with filters', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: 'mov-1',
              productId: 'prod-1',
              movementType: 'sale',
              quantity: -5,
              previousStock: 50,
              newStock: 45,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'mov-2',
              productId: 'prod-1',
              movementType: 'purchase',
              quantity: 100,
              previousStock: 45,
              newStock: 145,
              createdAt: new Date().toISOString(),
            },
          ],
          pagination: {
            page: 1,
            pageSize: 20,
            totalItems: 2,
            totalPages: 1,
          },
          timestamp: new Date().toISOString(),
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await productsService.getInventoryHistory('prod-1', {
        page: 1,
        limit: 20,
        movementType: 'sale',
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/products/prod-1/inventory-movements',
        {
          params: {
            page: 1,
            limit: 20,
            movementType: 'sale',
          },
        }
      );

      expect(result.data).toHaveLength(2);
    });
  });

  describe('ordersService.completeOrder', () => {
    it('should complete order and trigger stock updates', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'order-1',
            status: 'completed',
            items: [
              {
                productId: 'prod-1',
                quantity: 2,
              },
              {
                productId: 'prod-2',
                quantity: 1,
              },
            ],
          },
          timestamp: new Date().toISOString(),
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await ordersService.completeOrder('order-1');

      expect(apiClient.post).toHaveBeenCalledWith('/orders/order-1/complete');
      expect(result.data.status).toBe('completed');
    });
  });

  describe('Stock Update Error Handling', () => {
    it('should handle insufficient stock error', async () => {
      const mockError = {
        response: {
          data: {
            success: false,
            error: {
              code: 'INSUFFICIENT_STOCK',
              message: 'Insufficient stock available',
            },
          },
        },
      };

      vi.mocked(apiClient.post).mockRejectedValue(mockError);

      await expect(
        productsService.updateStock('prod-1', -100, 'sale', 'order-1', 'order')
      ).rejects.toThrow();
    });

    it('should handle product not found error', async () => {
      const mockError = {
        response: {
          data: {
            success: false,
            error: {
              code: 'PRODUCT_NOT_FOUND',
              message: 'Product not found',
            },
          },
        },
      };

      vi.mocked(apiClient.post).mockRejectedValue(mockError);

      await expect(
        productsService.updateStock('invalid-id', -5, 'sale', 'order-1', 'order')
      ).rejects.toThrow();
    });
  });

  describe('Movement Type Validation', () => {
    it('should support all movement types', async () => {
      const movementTypes: Array<'sale' | 'purchase' | 'adjustment' | 'return' | 'transfer'> = [
        'sale',
        'purchase',
        'adjustment',
        'return',
        'transfer',
      ];

      for (const type of movementTypes) {
        const mockResponse = {
          data: {
            success: true,
            data: {
              product: { id: 'prod-1', stockQuantity: 50 },
              movement: { id: 'mov-1', movementType: type },
            },
            timestamp: new Date().toISOString(),
          },
        };

        vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

        const result = await productsService.updateStock(
          'prod-1',
          type === 'sale' ? -5 : 5,
          type,
          'ref-1',
          'manual'
        );

        expect(result.data.movement.movementType).toBe(type);
      }
    });
  });
});
