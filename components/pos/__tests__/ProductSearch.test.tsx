/**
 * ProductSearch Component Tests
 * 
 * Tests for product search functionality including:
 * - Search input and debouncing
 * - Product grid display
 * - Barcode scanning
 * - Offline support
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductSearch } from '../ProductSearch';
import { productsService } from '@/services/products.service';
import * as indexedDB from '@/lib/indexeddb';
import * as networkHook from '@/hooks/useNetworkStatus';
import type { Product } from '@/types/entities';

// Mock dependencies
vi.mock('@/services/products.service');
vi.mock('@/lib/indexeddb');
vi.mock('@/hooks/useNetworkStatus');
vi.mock('@/utils/notifications');

const mockProducts: Product[] = [
  {
    id: '1',
    tenantId: 'tenant1',
    sku: 'SKU001',
    name: 'Test Product 1',
    description: 'Test description',
    category: 'Electronics',
    price: 99.99,
    stockQuantity: 10,
    minStockLevel: 5,
    barcode: '123456789',
    imageUrl: 'https://example.com/image1.jpg',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    tenantId: 'tenant1',
    sku: 'SKU002',
    name: 'Test Product 2',
    description: 'Test description 2',
    category: 'Clothing',
    price: 49.99,
    stockQuantity: 2,
    minStockLevel: 5,
    barcode: '987654321',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    tenantId: 'tenant1',
    sku: 'SKU003',
    name: 'Out of Stock Product',
    description: 'Test description 3',
    category: 'Books',
    price: 19.99,
    stockQuantity: 0,
    minStockLevel: 5,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

describe('ProductSearch', () => {
  let queryClient: QueryClient;
  const mockOnProductSelect = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Default to online mode
    vi.mocked(networkHook.useNetworkStatus).mockReturnValue({
      isOnline: true,
      isOffline: false,
    });

    // Mock IndexedDB functions
    vi.mocked(indexedDB.getAll).mockResolvedValue([]);
    vi.mocked(indexedDB.search).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ProductSearch onProductSelect={mockOnProductSelect} />
      </QueryClientProvider>
    );
  };

  describe('Search Input', () => {
    it('should render search input', () => {
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText(/search products/i);
      expect(searchInput).toBeDefined();
    });

    it('should update search query on input', () => {
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText(/search products/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      expect(searchInput).toHaveValue('test');
    });

    it('should show clear button when search has value', () => {
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText(/search products/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      const clearButton = screen.getByLabelText(/clear search/i);
      expect(clearButton).toBeDefined();
    });

    it('should clear search when clear button is clicked', () => {
      renderComponent();
      
      const searchInput = screen.getByPlaceholderText(/search products/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      const clearButton = screen.getByLabelText(/clear search/i);
      fireEvent.click(clearButton);
      
      expect(searchInput).toHaveValue('');
    });

    it('should debounce search query (300ms)', async () => {
      vi.mocked(productsService.getAll).mockResolvedValue({
        success: true,
        data: mockProducts,
        pagination: {
          page: 1,
          pageSize: 50,
          totalItems: 3,
          totalPages: 1,
        },
        timestamp: new Date().toISOString(),
      });

      renderComponent();
      
      const searchInput = screen.getByPlaceholderText(/search products/i);
      
      // Type quickly
      fireEvent.change(searchInput, { target: { value: 't' } });
      fireEvent.change(searchInput, { target: { value: 'te' } });
      fireEvent.change(searchInput, { target: { value: 'tes' } });
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      // Should not call API immediately
      expect(productsService.getAll).not.toHaveBeenCalled();
      
      // Wait for debounce
      await waitFor(() => {
        expect(productsService.getAll).toHaveBeenCalledTimes(1);
      }, { timeout: 500 });
    });
  });

  describe('Barcode Scanner', () => {
    it('should render barcode scanner button', () => {
      renderComponent();
      
      const scanButton = screen.getByLabelText(/scan barcode/i);
      expect(scanButton).toBeDefined();
    });

    it('should show scanning state when clicked', () => {
      // Mock prompt to return null (cancel)
      vi.spyOn(window, 'prompt').mockReturnValue(null);
      
      renderComponent();
      
      const scanButton = screen.getByLabelText(/scan barcode/i);
      fireEvent.click(scanButton);
      
      expect(window.prompt).toHaveBeenCalled();
    });
  });

  describe('Product Display', () => {
    it('should show empty state when no search query', () => {
      renderComponent();
      
      const emptyMessage = screen.getByText(/start typing to search products/i);
      expect(emptyMessage).toBeDefined();
    });

    it('should display products in grid when search returns results', async () => {
      vi.mocked(productsService.getAll).mockResolvedValue({
        success: true,
        data: mockProducts,
        pagination: {
          page: 1,
          pageSize: 50,
          totalItems: 3,
          totalPages: 1,
        },
        timestamp: new Date().toISOString(),
      });

      renderComponent();
      
      const searchInput = screen.getByPlaceholderText(/search products/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeDefined();
        expect(screen.getByText('Test Product 2')).toBeDefined();
      });
    });

    it('should show loading state while fetching products', async () => {
      vi.mocked(productsService.getAll).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      renderComponent();
      
      const searchInput = screen.getByPlaceholderText(/search products/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      await waitFor(() => {
        expect(screen.getByText(/loading products/i)).toBeDefined();
      });
    });

    it('should show "No products found" when search returns empty', async () => {
      vi.mocked(productsService.getAll).mockResolvedValue({
        success: true,
        data: [],
        pagination: {
          page: 1,
          pageSize: 50,
          totalItems: 0,
          totalPages: 0,
        },
        timestamp: new Date().toISOString(),
      });

      renderComponent();
      
      const searchInput = screen.getByPlaceholderText(/search products/i);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      
      await waitFor(() => {
        expect(screen.getByText(/no products found/i)).toBeDefined();
      });
    });
  });

  describe('Product Cards', () => {
    it('should display product information correctly', async () => {
      vi.mocked(productsService.getAll).mockResolvedValue({
        success: true,
        data: [mockProducts[0]],
        pagination: {
          page: 1,
          pageSize: 50,
          totalItems: 1,
          totalPages: 1,
        },
        timestamp: new Date().toISOString(),
      });

      renderComponent();
      
      const searchInput = screen.getByPlaceholderText(/search products/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeDefined();
        expect(screen.getByText('SKU: SKU001')).toBeDefined();
        expect(screen.getByText('₹99.99')).toBeDefined();
        expect(screen.getByText('In Stock')).toBeDefined();
      });
    });

    it('should show low stock badge for products below minimum', async () => {
      vi.mocked(productsService.getAll).mockResolvedValue({
        success: true,
        data: [mockProducts[1]],
        pagination: {
          page: 1,
          pageSize: 50,
          totalItems: 1,
          totalPages: 1,
        },
        timestamp: new Date().toISOString(),
      });

      renderComponent();
      
      const searchInput = screen.getByPlaceholderText(/search products/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      await waitFor(() => {
        expect(screen.getByText('Low Stock')).toBeDefined();
      });
    });

    it('should show out of stock badge and disable button', async () => {
      vi.mocked(productsService.getAll).mockResolvedValue({
        success: true,
        data: [mockProducts[2]],
        pagination: {
          page: 1,
          pageSize: 50,
          totalItems: 1,
          totalPages: 1,
        },
        timestamp: new Date().toISOString(),
      });

      renderComponent();
      
      const searchInput = screen.getByPlaceholderText(/search products/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      await waitFor(() => {
        expect(screen.getByText('Out of Stock')).toBeDefined();
        const productButton = screen.getByLabelText(/add out of stock product to cart/i);
        expect(productButton).toBeDisabled();
      });
    });

    it('should call onProductSelect when product is clicked', async () => {
      vi.mocked(productsService.getAll).mockResolvedValue({
        success: true,
        data: [mockProducts[0]],
        pagination: {
          page: 1,
          pageSize: 50,
          totalItems: 1,
          totalPages: 1,
        },
        timestamp: new Date().toISOString(),
      });

      renderComponent();
      
      const searchInput = screen.getByPlaceholderText(/search products/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      await waitFor(() => {
        const productButton = screen.getByLabelText(/add test product 1 to cart/i);
        fireEvent.click(productButton);
        
        expect(mockOnProductSelect).toHaveBeenCalledWith(mockProducts[0]);
      });
    });
  });

  describe('Offline Support', () => {
    it('should load products from IndexedDB when offline', async () => {
      vi.mocked(networkHook.useNetworkStatus).mockReturnValue({
        isOnline: false,
        isOffline: true,
      });

      vi.mocked(indexedDB.getAll).mockResolvedValue(mockProducts);

      renderComponent();
      
      await waitFor(() => {
        expect(indexedDB.getAll).toHaveBeenCalledWith('products');
      });
    });

    it('should use offline data when network is unavailable', async () => {
      vi.mocked(networkHook.useNetworkStatus).mockReturnValue({
        isOnline: false,
        isOffline: true,
      });

      vi.mocked(indexedDB.getAll).mockResolvedValue(mockProducts);

      renderComponent();
      
      // Component should render without errors when offline
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search products/i)).toBeDefined();
      });
      
      // Should have called IndexedDB instead of API
      expect(productsService.getAll).not.toHaveBeenCalled();
    });
  });

  describe('Responsive Grid', () => {
    it('should render products in a grid layout', async () => {
      vi.mocked(productsService.getAll).mockResolvedValue({
        success: true,
        data: mockProducts,
        pagination: {
          page: 1,
          pageSize: 50,
          totalItems: 3,
          totalPages: 1,
        },
        timestamp: new Date().toISOString(),
      });

      renderComponent();
      
      const searchInput = screen.getByPlaceholderText(/search products/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeDefined();
      });
      
      // Check that grid classes are present
      const productCard = screen.getByText('Test Product 1').closest('button');
      const gridContainer = productCard?.parentElement;
      expect(gridContainer?.className).toContain('grid');
    });
  });
});
