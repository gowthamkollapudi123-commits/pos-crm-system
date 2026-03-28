/**
 * Shopping Cart Hook
 * 
 * Manages shopping cart state including items, quantities, and discount codes.
 * Provides functions to add, update, and remove items from the cart.
 * 
 * Requirements: 7.2, 7.3, 7.7, 7.8, 7.9
 */

import { useState, useCallback } from 'react';
import type { Product } from '@/types/entities';
import type { CartItem } from '@/components/pos/ShoppingCart';

interface DiscountCode {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
}

// Mock discount codes for demonstration
// In a real application, these would come from the backend
const MOCK_DISCOUNT_CODES: DiscountCode[] = [
  { code: 'SAVE10', type: 'percentage', value: 10 },
  { code: 'SAVE20', type: 'percentage', value: 20, minPurchase: 1000 },
  { code: 'FLAT50', type: 'fixed', value: 50 },
  { code: 'FLAT100', type: 'fixed', value: 100, minPurchase: 500 },
];

export function useShoppingCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedDiscountCode, setAppliedDiscountCode] = useState<string | null>(null);

  // Add product to cart
  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id);
      
      if (existingItem) {
        // Update quantity if product already in cart
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item to cart
        return [...prevItems, { product, quantity }];
      }
    });
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  // Remove item from cart
  const removeItem = useCallback((productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedDiscountCode(null);
  }, []);

  // Calculate subtotal
  const calculateSubtotal = useCallback(() => {
    return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [items]);

  // Apply discount code
  const applyDiscountCode = useCallback(
    async (code: string): Promise<{ success: boolean; discount: number; message?: string }> => {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const discountCode = MOCK_DISCOUNT_CODES.find(
        (dc) => dc.code.toLowerCase() === code.toLowerCase()
      );

      if (!discountCode) {
        return {
          success: false,
          discount: 0,
          message: 'Invalid discount code',
        };
      }

      const subtotal = calculateSubtotal();

      // Check minimum purchase requirement
      if (discountCode.minPurchase && subtotal < discountCode.minPurchase) {
        return {
          success: false,
          discount: 0,
          message: `Minimum purchase of ₹${discountCode.minPurchase} required`,
        };
      }

      // Calculate discount amount
      let discountAmount = 0;
      if (discountCode.type === 'percentage') {
        discountAmount = (subtotal * discountCode.value) / 100;
      } else {
        discountAmount = discountCode.value;
      }

      // Ensure discount doesn't exceed subtotal
      discountAmount = Math.min(discountAmount, subtotal);

      setAppliedDiscountCode(code);

      return {
        success: true,
        discount: discountAmount,
        message: `Discount of ₹${discountAmount.toFixed(2)} applied`,
      };
    },
    [calculateSubtotal]
  );

  // Get cart item count
  const getItemCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  return {
    items,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    applyDiscountCode,
    appliedDiscountCode,
    getItemCount,
    calculateSubtotal,
  };
}
