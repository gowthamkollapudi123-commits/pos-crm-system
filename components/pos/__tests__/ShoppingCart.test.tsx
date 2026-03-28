/**
 * Shopping Cart Component Tests
 * 
 * Tests for shopping cart functionality including item management,
 * quantity controls, discount application, and total calculations.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ShoppingCart, type CartItem } from '../ShoppingCart';
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
  imageUrl: 'https://example.com/image.jpg',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockCartItems: CartItem[] = [
  { product: mockProduct1, quantity: 2 },
  { product: mockProduct2, quantity: 1 },
];

describe('ShoppingCart', () => {
  const mockOnUpdateQuantity = vi.fn();
  const mockOnRemoveItem = vi.fn();
  const mockOnApplyDiscount = vi.fn();
  const mockOnCheckout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty Cart', () => {
    it('should display empty cart message when no items', () => {
      render(
        <ShoppingCart
          items={[]}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onApplyDiscount={mockOnApplyDiscount}
        />
      );

      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
      expect(screen.getByText('Add products to get started')).toBeInTheDocument();
    });
  });

  describe('Cart Items Display', () => {
    it('should display all cart items', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onApplyDiscount={mockOnApplyDiscount}
        />
      );

      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    });

    it('should display product prices', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onApplyDiscount={mockOnApplyDiscount}
        />
      );

      expect(screen.getByText('₹100.00 each')).toBeInTheDocument();
      expect(screen.getByText('₹200.00 each')).toBeInTheDocument();
    });

    it('should display product quantities', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onApplyDiscount={mockOnApplyDiscount}
        />
      );

      const quantities = screen.getAllByText(/^[0-9]+$/);
      expect(quantities).toHaveLength(2);
    });

    it('should display line totals', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onApplyDiscount={mockOnApplyDiscount}
        />
      );

      // Product 1: 100 * 2 = 200, Product 2: 200 * 1 = 200
      // Both have the same line total, so we should find multiple instances
      const lineTotals = screen.getAllByText('₹200.00');
      expect(lineTotals.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Quantity Controls', () => {
    it('should call onUpdateQuantity when increase button is clicked', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onApplyDiscount={mockOnApplyDiscount}
        />
      );

      const increaseButtons = screen.getAllByLabelText('Increase quantity');
      fireEvent.click(increaseButtons[0]);

      expect(mockOnUpdateQuantity).toHaveBeenCalledWith('prod-1', 3);
    });

    it('should call onUpdateQuantity when decrease button is clicked', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onApplyDiscount={mockOnApplyDiscount}
        />
      );

      const decreaseButtons = screen.getAllByLabelText('Decrease quantity');
      fireEvent.click(decreaseButtons[0]);

      expect(mockOnUpdateQuantity).toHaveBeenCalledWith('prod-1', 1);
    });

    it('should disable decrease button when quantity is 1', () => {
      const singleItem: CartItem[] = [{ product: mockProduct1, quantity: 1 }];
      
      render(
        <ShoppingCart
          items={singleItem}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onApplyDiscount={mockOnApplyDiscount}
        />
      );

      const decreaseButton = screen.getByLabelText('Decrease quantity');
      expect(decreaseButton).toBeDisabled();
    });
  });

  describe('Item Removal', () => {
    it('should call onRemoveItem when remove button is clicked', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onApplyDiscount={mockOnApplyDiscount}
        />
      );

      const removeButtons = screen.getAllByLabelText('Remove item');
      fireEvent.click(removeButtons[0]);

      expect(mockOnRemoveItem).toHaveBeenCalledWith('prod-1');
    });
  });

  describe('Cart Summary Calculations', () => {
    it('should calculate subtotal correctly', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onApplyDiscount={mockOnApplyDiscount}
          taxRate={0.18}
        />
      );

      // Subtotal: (100 * 2) + (200 * 1) = 400
      expect(screen.getByText('₹400.00')).toBeInTheDocument();
    });

    it('should calculate tax correctly', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onApplyDiscount={mockOnApplyDiscount}
          taxRate={0.18}
        />
      );

      // Tax: 400 * 0.18 = 72
      expect(screen.getByText('₹72.00')).toBeInTheDocument();
    });

    it('should calculate total correctly', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onApplyDiscount={mockOnApplyDiscount}
          taxRate={0.18}
        />
      );

      // Total: 400 + 72 = 472
      expect(screen.getByText('₹472.00')).toBeInTheDocument();
    });

    it('should use custom tax rate', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onApplyDiscount={mockOnApplyDiscount}
          taxRate={0.10}
        />
      );

      // Tax: 400 * 0.10 = 40
      expect(screen.getByText('₹40.00')).toBeInTheDocument();
      // Total: 400 + 40 = 440
      expect(screen.getByText('₹440.00')).toBeInTheDocument();
    });
  });

  describe('Discount Code Application', () => {
    it('should allow entering discount code', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onApplyDiscount={mockOnApplyDiscount}
        />
      );

      const discountInput = screen.getByPlaceholderText('Discount code');
      fireEvent.change(discountInput, { target: { value: 'SAVE10' } });

      expect(discountInput).toHaveValue('SAVE10');
    });

    it('should call onApplyDiscount when apply button is clicked', async () => {
      mockOnApplyDiscount.mockResolvedValue({
        success: true,
        discount: 40,
        message: 'Discount applied',
      });

      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onApplyDiscount={mockOnApplyDiscount}
        />
      );

      const discountInput = screen.getByPlaceholderText('Discount code');
      const applyButton = screen.getByLabelText('Apply discount code');

      fireEvent.change(discountInput, { target: { value: 'SAVE10' } });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(mockOnApplyDiscount).toHaveBeenCalledWith('SAVE10');
      });
    });

    it('should display success message when discount is applied', async () => {
      mockOnApplyDiscount.mockResolvedValue({
        success: true,
        discount: 40,
        message: 'Discount of ₹40.00 applied',
      });

      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onApplyDiscount={mockOnApplyDiscount}
        />
      );

      const discountInput = screen.getByPlaceholderText('Discount code');
      const applyButton = screen.getByLabelText('Apply discount code');

      fireEvent.change(discountInput, { target: { value: 'SAVE10' } });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Discount of ₹40.00 applied')).toBeInTheDocument();
      });
    });

    it('should display error message for invalid discount code', async () => {
      mockOnApplyDiscount.mockResolvedValue({
        success: false,
        discount: 0,
        message: 'Invalid discount code',
      });

      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onApplyDiscount={mockOnApplyDiscount}
        />
      );

      const discountInput = screen.getByPlaceholderText('Discount code');
      const applyButton = screen.getByLabelText('Apply discount code');

      fireEvent.change(discountInput, { target: { value: 'INVALID' } });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid discount code')).toBeInTheDocument();
      });
    });

    it('should update totals when discount is applied', async () => {
      mockOnApplyDiscount.mockResolvedValue({
        success: true,
        discount: 40,
        message: 'Discount applied',
      });

      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onApplyDiscount={mockOnApplyDiscount}
          taxRate={0.18}
        />
      );

      const discountInput = screen.getByPlaceholderText('Discount code');
      const applyButton = screen.getByLabelText('Apply discount code');

      fireEvent.change(discountInput, { target: { value: 'SAVE10' } });
      fireEvent.click(applyButton);

      await waitFor(() => {
        // Discount should be displayed
        expect(screen.getByText('-₹40.00')).toBeInTheDocument();
        // Tax: (400 - 40) * 0.18 = 64.80
        expect(screen.getByText('₹64.80')).toBeInTheDocument();
        // Total: 360 + 64.80 = 424.80
        expect(screen.getByText('₹424.80')).toBeInTheDocument();
      });
    });
  });

  describe('Checkout', () => {
    it('should call onCheckout when checkout button is clicked', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onApplyDiscount={mockOnApplyDiscount}
          onCheckout={mockOnCheckout}
        />
      );

      const checkoutButton = screen.getByLabelText('Proceed to checkout');
      fireEvent.click(checkoutButton);

      expect(mockOnCheckout).toHaveBeenCalled();
    });

    it('should disable checkout button when cart is empty', () => {
      render(
        <ShoppingCart
          items={[]}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onApplyDiscount={mockOnApplyDiscount}
          onCheckout={mockOnCheckout}
        />
      );

      // Empty cart doesn't render checkout button in the same way
      expect(screen.queryByLabelText('Proceed to checkout')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <ShoppingCart
          items={mockCartItems}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemoveItem={mockOnRemoveItem}
          onApplyDiscount={mockOnApplyDiscount}
        />
      );

      expect(screen.getByLabelText('Discount code')).toBeInTheDocument();
      expect(screen.getByLabelText('Apply discount code')).toBeInTheDocument();
      expect(screen.getAllByLabelText('Increase quantity')).toHaveLength(2);
      expect(screen.getAllByLabelText('Decrease quantity')).toHaveLength(2);
      expect(screen.getAllByLabelText('Remove item')).toHaveLength(2);
    });
  });
});
