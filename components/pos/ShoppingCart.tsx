/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Shopping Cart Component
 * 
 * Displays cart items with quantity controls, calculates totals,
 * and handles discount code application.
 * 
 * Requirements: 7.2, 7.3, 7.7, 7.8, 7.9
 */

'use client';

import { useState } from 'react';
import { MinusIcon, PlusIcon, TrashIcon, TagIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types/entities';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartSummary {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

interface ShoppingCartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onApplyDiscount: (code: string) => Promise<{ success: boolean; discount: number; message?: string }>;
  taxRate?: number;
  onCheckout?: () => void;
}

export function ShoppingCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onApplyDiscount,
  taxRate = 0.18, // Default 18% GST
  onCheckout,
}: ShoppingCartProps) {
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [discountMessage, setDiscountMessage] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  // Calculate line total for a cart item
  const calculateLineTotal = (item: CartItem): number => {
    return item.product.price * item.quantity;
  };

  // Calculate cart summary
  const calculateSummary = (): CartSummary => {
    const subtotal = items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
    const discount = appliedDiscount;
    const taxableAmount = subtotal - discount;
    const tax = taxableAmount * taxRate;
    const total = taxableAmount + tax;

    return {
      subtotal,
      tax,
      discount,
      total,
    };
  };

  const summary = calculateSummary();

  // Handle quantity increase
  const handleIncrease = (productId: string, currentQuantity: number) => {
    onUpdateQuantity(productId, currentQuantity + 1);
  };

  // Handle quantity decrease
  const handleDecrease = (productId: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      onUpdateQuantity(productId, currentQuantity - 1);
    }
  };

  // Handle discount code application
  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountMessage('Please enter a discount code');
      return;
    }

    setIsApplyingDiscount(true);
    setDiscountMessage('');

    try {
      const result = await onApplyDiscount(discountCode.trim());
      
      if (result.success) {
        setAppliedDiscount(result.discount);
        setDiscountMessage(result.message || 'Discount applied successfully');
        setDiscountCode('');
      } else {
        setDiscountMessage(result.message || 'Invalid discount code');
        setAppliedDiscount(0);
      }
    } catch (error) {
      setDiscountMessage('Failed to apply discount code');
      setAppliedDiscount(0);
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    if (onCheckout && items.length > 0) {
      onCheckout();
    }
  };

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center min-h-[200px]">
          <div className="text-center text-gray-500">
            <svg
              className="h-16 w-16 mx-auto mb-3 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <p className="text-sm font-medium">Your cart is empty</p>
            <p className="text-xs mt-1">Add products to get started</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {items.map((item) => (
          <div
            key={item.product.id}
            className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
          >
            <div className="flex gap-3">
              {/* Product Image */}
              {item.product.imageUrl ? (
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-400 text-xs">No image</span>
                </div>
              )}

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {item.product.name}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  ₹{item.product.price.toFixed(2)} each
                </p>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => handleDecrease(item.product.id, item.quantity)}
                    className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={item.quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <MinusIcon className="h-3 w-3 text-gray-600" />
                  </button>
                  
                  <span className="text-sm font-medium text-gray-900 w-8 text-center">
                    {item.quantity}
                  </span>
                  
                  <button
                    onClick={() => handleIncrease(item.product.id, item.quantity)}
                    className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Increase quantity"
                  >
                    <PlusIcon className="h-3 w-3 text-gray-600" />
                  </button>

                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="ml-auto w-7 h-7 rounded-md text-red-600 hover:bg-red-50 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label="Remove item"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Line Total */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-gray-900">
                  ₹{calculateLineTotal(item).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Discount Code Section */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Discount code"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleApplyDiscount();
                }
              }}
              disabled={isApplyingDiscount}
              className="h-9"
              aria-label="Discount code"
            />
          </div>
          <Button
            onClick={handleApplyDiscount}
            disabled={isApplyingDiscount || !discountCode.trim()}
            variant="outline"
            size="sm"
            className="h-9 px-3"
            aria-label="Apply discount code"
          >
            <TagIcon className="h-4 w-4 mr-1" />
            Apply
          </Button>
        </div>
        {discountMessage && (
          <p
            className={`text-xs mt-1 ${
              appliedDiscount > 0 ? 'text-green-600' : 'text-red-600'
            }`}
            role="alert"
          >
            {discountMessage}
          </p>
        )}
      </div>

      {/* Cart Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium text-gray-900">
            ₹{summary.subtotal.toFixed(2)}
          </span>
        </div>
        
        {summary.discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Discount:</span>
            <span className="font-medium text-green-600">
              -₹{summary.discount.toFixed(2)}
            </span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax ({(taxRate * 100).toFixed(0)}%):</span>
          <span className="font-medium text-gray-900">
            ₹{summary.tax.toFixed(2)}
          </span>
        </div>
        
        <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
          <span className="text-gray-900">Total:</span>
          <span className="text-gray-900">₹{summary.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="mt-4">
        <Button
          onClick={handleCheckout}
          disabled={items.length === 0}
          className="w-full h-11"
          aria-label="Proceed to checkout"
        >
          Checkout
        </Button>
      </div>
    </div>
  );
}
