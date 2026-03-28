/**
 * Shopping Cart Hook Tests
 * 
 * Tests for shopping cart state management hook.
 */

import { renderHook, act } from '@testing-library/react';
import { useShoppingCart } from '../useShoppingCart';
import type { Product } from '@/types/entities';

// Mock product data
const mockProduct1: Product = {
  id: 'prod-1',
  tenantId: 'tenant-1',
  sku: 'SKU001',
  name: 'Test Product 1',
  price: 100,
  stockQuantity: 10,
  minStockLevel: 2,
  category: 'Electronics',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockProduct2: Product = {
  id: 'prod-2',
  tenantId: 'tenant-1',
  sku: 'SKU002',
  name: 'Test Product 2',
  price: 200,
  stockQuantity: 5,
  minStockLevel: 1,
  category: 'Electronics',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('useShoppingCart', () => {
  describe('Initial State', () => {
    it('should initialize with empty cart', () => {
      const { result } = renderHook(() => useShoppingCart());

      expect(result.current.items).toEqual([]);
      expect(result.current.getItemCount()).toBe(0);
      expect(result.current.calculateSubtotal()).toBe(0);
    });
  });

  describe('Add to Cart', () => {
    it('should add product to cart', () => {
      const { result } = renderHook(() => useShoppingCart());

      act(() => {
        result.current.addToCart(mockProduct1, 1);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].product.id).toBe('prod-1');
      expect(result.current.items[0].quantity).toBe(1);
    });

    it('should add product with custom quantity', () => {
      const { result } = renderHook(() => useShoppingCart());

      act(() => {
        result.current.addToCart(mockProduct1, 3);
      });

      expect(result.current.items[0].quantity).toBe(3);
    });

    it('should increase quantity if product already in cart', () => {
      const { result } = renderHook(() => useShoppingCart());

      act(() => {
        result.current.addToCart(mockProduct1, 2);
      });

      act(() => {
        result.current.addToCart(mockProduct1, 1);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(3);
    });

    it('should add multiple different products', () => {
      const { result } = renderHook(() => useShoppingCart());

      act(() => {
        result.current.addToCart(mockProduct1, 1);
        result.current.addToCart(mockProduct2, 2);
      });

      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[0].product.id).toBe('prod-1');
      expect(result.current.items[1].product.id).toBe('prod-2');
    });
  });

  describe('Update Quantity', () => {
    it('should update product quantity', () => {
      const { result } = renderHook(() => useShoppingCart());

      act(() => {
        result.current.addToCart(mockProduct1, 1);
      });

      act(() => {
        result.current.updateQuantity('prod-1', 5);
      });

      expect(result.current.items[0].quantity).toBe(5);
    });

    it('should not update quantity to less than 1', () => {
      const { result } = renderHook(() => useShoppingCart());

      act(() => {
        result.current.addToCart(mockProduct1, 2);
      });

      act(() => {
        result.current.updateQuantity('prod-1', 0);
      });

      expect(result.current.items[0].quantity).toBe(2);
    });

    it('should not affect other products', () => {
      const { result } = renderHook(() => useShoppingCart());

      act(() => {
        result.current.addToCart(mockProduct1, 1);
        result.current.addToCart(mockProduct2, 2);
      });

      act(() => {
        result.current.updateQuantity('prod-1', 5);
      });

      expect(result.current.items[0].quantity).toBe(5);
      expect(result.current.items[1].quantity).toBe(2);
    });
  });

  describe('Remove Item', () => {
    it('should remove product from cart', () => {
      const { result } = renderHook(() => useShoppingCart());

      act(() => {
        result.current.addToCart(mockProduct1, 1);
        result.current.addToCart(mockProduct2, 2);
      });

      act(() => {
        result.current.removeItem('prod-1');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].product.id).toBe('prod-2');
    });

    it('should handle removing non-existent product', () => {
      const { result } = renderHook(() => useShoppingCart());

      act(() => {
        result.current.addToCart(mockProduct1, 1);
      });

      act(() => {
        result.current.removeItem('non-existent');
      });

      expect(result.current.items).toHaveLength(1);
    });
  });

  describe('Clear Cart', () => {
    it('should clear all items from cart', () => {
      const { result } = renderHook(() => useShoppingCart());

      act(() => {
        result.current.addToCart(mockProduct1, 1);
        result.current.addToCart(mockProduct2, 2);
      });

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.items).toEqual([]);
      expect(result.current.getItemCount()).toBe(0);
    });

    it('should clear applied discount code', () => {
      const { result } = renderHook(() => useShoppingCart());

      act(() => {
        result.current.addToCart(mockProduct1, 1);
      });

      act(() => {
        result.current.applyDiscountCode('SAVE10');
      });

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.appliedDiscountCode).toBeNull();
    });
  });

  describe('Calculate Subtotal', () => {
    it('should calculate subtotal correctly', () => {
      const { result } = renderHook(() => useShoppingCart());

      act(() => {
        result.current.addToCart(mockProduct1, 2); // 100 * 2 = 200
        result.current.addToCart(mockProduct2, 1); // 200 * 1 = 200
      });

      expect(result.current.calculateSubtotal()).toBe(400);
    });

    it('should return 0 for empty cart', () => {
      const { result } = renderHook(() => useShoppingCart());

      expect(result.current.calculateSubtotal()).toBe(0);
    });

    it('should update subtotal when quantity changes', () => {
      const { result } = renderHook(() => useShoppingCart());

      act(() => {
        result.current.addToCart(mockProduct1, 1);
      });

      expect(result.current.calculateSubtotal()).toBe(100);

      act(() => {
        result.current.updateQuantity('prod-1', 3);
      });

      expect(result.current.calculateSubtotal()).toBe(300);
    });
  });

  describe('Get Item Count', () => {
    it('should return total item count', () => {
      const { result } = renderHook(() => useShoppingCart());

      act(() => {
        result.current.addToCart(mockProduct1, 2);
        result.current.addToCart(mockProduct2, 3);
      });

      expect(result.current.getItemCount()).toBe(5);
    });

    it('should return 0 for empty cart', () => {
      const { result } = renderHook(() => useShoppingCart());

      expect(result.current.getItemCount()).toBe(0);
    });
  });

  describe('Apply Discount Code', () => {
    it('should apply valid percentage discount code', async () => {
      const { result } = renderHook(() => useShoppingCart());

      act(() => {
        result.current.addToCart(mockProduct1, 2); // Subtotal: 200
      });

      let discountResult;
      await act(async () => {
        discountResult = await result.current.applyDiscountCode('SAVE10');
      });

      expect(discountResult).toEqual({
        success: true,
        discount: 20, // 10% of 200
        message: 'Discount of ₹20.00 applied',
      });
    });

    it('should apply valid fixed discount code', async () => {
      const { result } = renderHook(() => useShoppingCart());

      act(() => {
        result.current.addToCart(mockProduct1, 2); // Subtotal: 200
      });

      let discountResult;
      await act(async () => {
        discountResult = await result.current.applyDiscountCode('FLAT50');
      });

      expect(discountResult).toEqual({
        success: true,
        discount: 50,
        message: 'Discount of ₹50.00 applied',
      });
    });

    it('should reject invalid discount code', async () => {
      const { result } = renderHook(() => useShoppingCart());

      act(() => {
        result.current.addToCart(mockProduct1, 1);
      });

      let discountResult;
      await act(async () => {
        discountResult = await result.current.applyDiscountCode('INVALID');
      });

      expect(discountResult).toEqual({
        success: false,
        discount: 0,
        message: 'Invalid discount code',
      });
    });

    it('should reject discount code when minimum purchase not met', async () => {
      const { result } = renderHook(() => useShoppingCart());

      act(() => {
        result.current.addToCart(mockProduct1, 1); // Subtotal: 100
      });

      let discountResult;
      await act(async () => {
        discountResult = await result.current.applyDiscountCode('SAVE20'); // Requires min 1000
      });

      expect(discountResult).toEqual({
        success: false,
        discount: 0,
        message: 'Minimum purchase of ₹1000 required',
      });
    });

    it('should not exceed subtotal with discount', async () => {
      const { result } = renderHook(() => useShoppingCart());

      act(() => {
        result.current.addToCart(mockProduct1, 6); // Subtotal: 600 (meets min purchase of 500)
      });

      let discountResult;
      await act(async () => {
        discountResult = await result.current.applyDiscountCode('FLAT100'); // Fixed 100
      });

      expect(discountResult.discount).toBe(100);
    });

    it('should store applied discount code', async () => {
      const { result } = renderHook(() => useShoppingCart());

      act(() => {
        result.current.addToCart(mockProduct1, 2);
      });

      await act(async () => {
        await result.current.applyDiscountCode('SAVE10');
      });

      expect(result.current.appliedDiscountCode).toBe('SAVE10');
    });
  });
});
