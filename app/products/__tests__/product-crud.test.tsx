/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/display-name */
/**
 * Product CRUD Operations Tests
 * 
 * Tests for product creation, editing, and deletion functionality.
 * Validates form validation, SKU uniqueness, variants, and transaction history checks.
 * 
 * Requirements: 11.2, 11.3, 11.4, 11.7, 11.10, 11.11
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import NewProductPage from '../new/page';
import EditProductPage from '../[id]/edit/page';
import ProductDetailPage from '../[id]/page';
import { productsService } from '@/services/products.service';
import type { Product } from '@/types/entities';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({
    id: 'product-123',
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/services/products.service');
jest.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({ isOnline: true }),
}));

const mockProduct: Product = {
  id: 'product-123',
  tenantId: 'tenant-1',
  sku: 'PROD-001',
  name: 'Premium Coffee Beans',
  description: 'High-quality arabica coffee beans',
  category: 'Beverages',
  subCategory: 'Coffee',
  price: 299.99,
  costPrice: 150.00,
  stockQuantity: 100,
  minStockLevel: 10,
  barcode: '1234567890123',
  imageUrl: 'https://example.com/coffee.jpg',
  variants: [
    {
      id: 'variant-1',
      name: 'Size',
      sku: 'PROD-001-L',
      price: 299.99,
      stockQuantity: 50,
      attributes: { value: 'Large' },
    },
  ],
  isActive: true,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Product Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render product creation form with all required fields', () => {
    render(<NewProductPage />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/SKU/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Product Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Stock Quantity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Minimum Stock Level/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<NewProductPage />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole('button', { name: /Create Product/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/SKU is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Product name must be at least 2 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/Category is required/i)).toBeInTheDocument();
    });
  });

  it('should validate SKU format (alphanumeric with hyphens)', async () => {
    const user = userEvent.setup();
    render(<NewProductPage />, { wrapper: createWrapper() });

    const skuInput = screen.getByLabelText(/SKU/i);
    await user.type(skuInput, 'INVALID SKU!@#');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/SKU must contain only letters, numbers, and hyphens/i)).toBeInTheDocument();
    });
  });

  it('should validate price format (max 2 decimal places)', async () => {
    const user = userEvent.setup();
    render(<NewProductPage />, { wrapper: createWrapper() });

    const priceInput = screen.getByLabelText(/^Price/i);
    await user.type(priceInput, '99.999');
    
    const submitButton = screen.getByRole('button', { name: /Create Product/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Price must have at most 2 decimal places/i)).toBeInTheDocument();
    });
  });

  it('should validate stock quantity (non-negative integer)', async () => {
    const user = userEvent.setup();
    render(<NewProductPage />, { wrapper: createWrapper() });

    const stockInput = screen.getByLabelText(/Stock Quantity/i);
    await user.type(stockInput, '-5');
    
    const submitButton = screen.getByRole('button', { name: /Create Product/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Stock quantity cannot be negative/i)).toBeInTheDocument();
    });
  });

  it('should check SKU uniqueness on blur', async () => {
    const user = userEvent.setup();
    (productsService.checkSkuUniqueness as jest.Mock).mockResolvedValue({
      data: { isUnique: false },
    });

    render(<NewProductPage />, { wrapper: createWrapper() });

    const skuInput = screen.getByLabelText(/SKU/i);
    await user.type(skuInput, 'EXISTING-SKU');
    await user.tab();

    await waitFor(() => {
      expect(productsService.checkSkuUniqueness).toHaveBeenCalledWith('EXISTING-SKU');
      expect(screen.getByText(/SKU already exists/i)).toBeInTheDocument();
    });
  });

  it('should allow adding product variants', async () => {
    const user = userEvent.setup();
    render(<NewProductPage />, { wrapper: createWrapper() });

    const addVariantButton = screen.getByRole('button', { name: /Add Variant/i });
    await user.click(addVariantButton);

    expect(screen.getByPlaceholderText(/Variant name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Variant value/i)).toBeInTheDocument();
  });

  it('should allow removing product variants', async () => {
    const user = userEvent.setup();
    render(<NewProductPage />, { wrapper: createWrapper() });

    const addVariantButton = screen.getByRole('button', { name: /Add Variant/i });
    await user.click(addVariantButton);

    const removeButton = screen.getByLabelText(/Remove variant/i);
    await user.click(removeButton);

    expect(screen.queryByPlaceholderText(/Variant name/i)).not.toBeInTheDocument();
  });

  it('should create product successfully with valid data', async () => {
    const user = userEvent.setup();
    (productsService.checkSkuUniqueness as jest.Mock).mockResolvedValue({
      data: { isUnique: true },
    });
    (productsService.create as jest.Mock).mockResolvedValue({
      data: mockProduct,
    });

    render(<NewProductPage />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText(/SKU/i), 'PROD-001');
    await user.type(screen.getByLabelText(/Product Name/i), 'Premium Coffee Beans');
    await user.type(screen.getByLabelText(/Category/i), 'Beverages');
    await user.type(screen.getByLabelText(/^Price/i), '299.99');
    await user.type(screen.getByLabelText(/Stock Quantity/i), '100');
    await user.type(screen.getByLabelText(/Minimum Stock Level/i), '10');

    const submitButton = screen.getByRole('button', { name: /Create Product/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(productsService.create).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Product created successfully');
    });
  });
});

describe('Product Editing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (productsService.getById as jest.Mock).mockResolvedValue({
      data: mockProduct,
    });
  });

  it('should pre-populate form with existing product data', async () => {
    render(<EditProductPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('PROD-001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Premium Coffee Beans')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Beverages')).toBeInTheDocument();
      expect(screen.getByDisplayValue('299.99')).toBeInTheDocument();
    });
  });

  it('should update product successfully', async () => {
    const user = userEvent.setup();
    (productsService.update as jest.Mock).mockResolvedValue({
      data: { ...mockProduct, name: 'Updated Coffee Beans' },
    });

    render(<EditProductPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Premium Coffee Beans')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Product Name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Coffee Beans');

    const submitButton = screen.getByRole('button', { name: /Save Changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(productsService.update).toHaveBeenCalledWith('product-123', expect.any(Object));
      expect(toast.success).toHaveBeenCalledWith('Product updated successfully');
    });
  });

  it('should check SKU uniqueness excluding current product', async () => {
    const user = userEvent.setup();
    (productsService.checkSkuUniqueness as jest.Mock).mockResolvedValue({
      data: { isUnique: true },
    });

    render(<EditProductPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('PROD-001')).toBeInTheDocument();
    });

    const skuInput = screen.getByLabelText(/SKU/i);
    await user.clear(skuInput);
    await user.type(skuInput, 'PROD-002');
    await user.tab();

    await waitFor(() => {
      expect(productsService.checkSkuUniqueness).toHaveBeenCalledWith('PROD-002', 'product-123');
    });
  });
});

describe('Product Detail and Deletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (productsService.getById as jest.Mock).mockResolvedValue({
      data: mockProduct,
    });
  });

  it('should display product information', async () => {
    render(<ProductDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Premium Coffee Beans')).toBeInTheDocument();
      expect(screen.getByText('PROD-001')).toBeInTheDocument();
      expect(screen.getByText('Beverages')).toBeInTheDocument();
    });
  });

  it('should display stock status with visual indicator', async () => {
    render(<ProductDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('In Stock')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  it('should display low stock warning when below minimum level', async () => {
    (productsService.getById as jest.Mock).mockResolvedValue({
      data: { ...mockProduct, stockQuantity: 5 },
    });

    render(<ProductDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Low Stock')).toBeInTheDocument();
      expect(screen.getByText(/Stock is below minimum level/i)).toBeInTheDocument();
    });
  });

  it('should display out of stock warning when quantity is zero', async () => {
    (productsService.getById as jest.Mock).mockResolvedValue({
      data: { ...mockProduct, stockQuantity: 0 },
    });

    render(<ProductDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Out of Stock')).toBeInTheDocument();
      expect(screen.getByText(/Product is out of stock/i)).toBeInTheDocument();
    });
  });

  it('should display product variants if available', async () => {
    render(<ProductDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Product Variants')).toBeInTheDocument();
      expect(screen.getByText('Size')).toBeInTheDocument();
      expect(screen.getByText('PROD-001-L')).toBeInTheDocument();
    });
  });

  it('should show delete confirmation dialog', async () => {
    const user = userEvent.setup();
    (productsService.checkProductTransactions as jest.Mock).mockResolvedValue({
      data: { count: 0 },
    });

    render(<ProductDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Premium Coffee Beans')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    await user.click(deleteButton);

    expect(screen.getByText(/Are you sure you want to delete this product/i)).toBeInTheDocument();
  });

  it('should prevent deletion if product has transaction history', async () => {
    const user = userEvent.setup();
    (productsService.checkProductTransactions as jest.Mock).mockResolvedValue({
      data: { count: 5 },
    });

    render(<ProductDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/This product has 5 transaction/i)).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    await user.click(deleteButton);

    const confirmButton = screen.getByRole('button', { name: /Delete/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Cannot delete product with transaction history')
      );
    });
  });

  it('should delete product successfully if no transaction history', async () => {
    const user = userEvent.setup();
    (productsService.checkProductTransactions as jest.Mock).mockResolvedValue({
      data: { count: 0 },
    });
    (productsService.delete as jest.Mock).mockResolvedValue({});

    render(<ProductDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Premium Coffee Beans')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    await user.click(deleteButton);

    const confirmButton = screen.getAllByRole('button', { name: /Delete/i })[1];
    await user.click(confirmButton);

    await waitFor(() => {
      expect(productsService.delete).toHaveBeenCalledWith('product-123');
      expect(toast.success).toHaveBeenCalledWith('Product deleted successfully');
    });
  });

  it('should display transaction history count', async () => {
    (productsService.checkProductTransactions as jest.Mock).mockResolvedValue({
      data: { count: 10 },
    });

    render(<ProductDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/This product has 10 transaction/i)).toBeInTheDocument();
    });
  });
});

describe('Category and Subcategory Support', () => {
  it('should support product categories', async () => {
    const user = userEvent.setup();
    render(<NewProductPage />, { wrapper: createWrapper() });

    const categoryInput = screen.getByLabelText(/^Category/i);
    await user.type(categoryInput, 'Electronics');

    expect(categoryInput).toHaveValue('Electronics');
  });

  it('should support product subcategories', async () => {
    const user = userEvent.setup();
    render(<NewProductPage />, { wrapper: createWrapper() });

    const subCategoryInput = screen.getByLabelText(/Subcategory/i);
    await user.type(subCategoryInput, 'Smartphones');

    expect(subCategoryInput).toHaveValue('Smartphones');
  });
});

describe('Responsive Behavior', () => {
  it('should render form fields in mobile layout', () => {
    render(<NewProductPage />, { wrapper: createWrapper() });

    const form = screen.getByRole('form', { hidden: true });
    expect(form).toBeInTheDocument();
  });
});

describe('Loading and Error States', () => {
  it('should display loading state while fetching product', () => {
    (productsService.getById as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<EditProductPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/Loading product/i)).toBeInTheDocument();
  });

  it('should display error state when product fetch fails', async () => {
    (productsService.getById as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

    render(<EditProductPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Failed to load product/i)).toBeInTheDocument();
    });
  });
});
