/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * LowStockWidget Component Tests
 * 
 * Tests for the low stock dashboard widget.
 * Requirements: 11.6, 29.1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { LowStockWidget } from '../LowStockWidget';
import { useLowStockProducts } from '@/hooks/useLowStockProducts';
import type { LowStockProduct } from '@/hooks/useLowStockProducts';

// Mock dependencies
vi.mock('@/hooks/useLowStockProducts');

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('LowStockWidget', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );

  const createMockProduct = (overrides: Partial<LowStockProduct> = {}): LowStockProduct => ({
    id: 'prod-1',
    tenantId: 'tenant-1',
    sku: 'SKU-001',
    name: 'Test Product',
    category: 'Electronics',
    price: 100,
    stockQuantity: 5,
    minStockLevel: 10,
    stockPercentage: 50,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  it('should render widget title', () => {
    vi.mocked(useLowStockProducts).mockReturnValue({
      data: { products: [], count: 0 },
      isLoading: false,
    } as any);

    render(<LowStockWidget />, { wrapper });

    expect(screen.getByText('Low Stock Alerts')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    vi.mocked(useLowStockProducts).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    render(<LowStockWidget />, { wrapper });

    expect(screen.getByText('Low Stock Alerts')).toBeInTheDocument();
    // Loading spinner should be present
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should display empty state when no low stock products', () => {
    vi.mocked(useLowStockProducts).mockReturnValue({
      data: { products: [], count: 0 },
      isLoading: false,
    } as any);

    render(<LowStockWidget />, { wrapper });

    expect(screen.getByText('All products well stocked')).toBeInTheDocument();
    expect(screen.getByText('No low stock alerts')).toBeInTheDocument();
  });

  it('should display low stock products', () => {
    const products = [
      createMockProduct({ id: 'prod-1', name: 'Product A', sku: 'SKU-A', stockQuantity: 5, minStockLevel: 10, stockPercentage: 50 }),
      createMockProduct({ id: 'prod-2', name: 'Product B', sku: 'SKU-B', stockQuantity: 2, minStockLevel: 10, stockPercentage: 20 }),
    ];

    vi.mocked(useLowStockProducts).mockReturnValue({
      data: { products, count: 2 },
      isLoading: false,
    } as any);

    render(<LowStockWidget />, { wrapper });

    expect(screen.getByText('Product A')).toBeInTheDocument();
    expect(screen.getByText('SKU: SKU-A')).toBeInTheDocument();
    expect(screen.getByText('5 / 10')).toBeInTheDocument();

    expect(screen.getByText('Product B')).toBeInTheDocument();
    expect(screen.getByText('SKU: SKU-B')).toBeInTheDocument();
    expect(screen.getByText('2 / 10')).toBeInTheDocument();
  });

  it('should display count badge', () => {
    const products = [
      createMockProduct({ id: 'prod-1' }),
      createMockProduct({ id: 'prod-2' }),
      createMockProduct({ id: 'prod-3' }),
    ];

    vi.mocked(useLowStockProducts).mockReturnValue({
      data: { products, count: 3 },
      isLoading: false,
    } as any);

    render(<LowStockWidget />, { wrapper });

    expect(screen.getByText('3 items')).toBeInTheDocument();
  });

  it('should display singular item text for 1 product', () => {
    const products = [createMockProduct()];

    vi.mocked(useLowStockProducts).mockReturnValue({
      data: { products, count: 1 },
      isLoading: false,
    } as any);

    render(<LowStockWidget />, { wrapper });

    expect(screen.getByText('1 item')).toBeInTheDocument();
  });

  it('should limit display to 5 products', () => {
    const products = Array.from({ length: 10 }, (_, i) => 
      createMockProduct({ id: `prod-${i}`, name: `Product ${i}`, sku: `SKU-${i}` })
    );

    vi.mocked(useLowStockProducts).mockReturnValue({
      data: { products, count: 10 },
      isLoading: false,
    } as any);

    render(<LowStockWidget />, { wrapper });

    // Should only display first 5 products
    expect(screen.getByText('Product 0')).toBeInTheDocument();
    expect(screen.getByText('Product 4')).toBeInTheDocument();
    expect(screen.queryByText('Product 5')).not.toBeInTheDocument();

    // Should show "View all" link
    expect(screen.getByText('View all 10 low stock items')).toBeInTheDocument();
  });

  it('should apply critical severity styling for stock <= 25%', () => {
    const products = [
      createMockProduct({ id: 'prod-1', name: 'Critical Product', stockPercentage: 20 }),
    ];

    vi.mocked(useLowStockProducts).mockReturnValue({
      data: { products, count: 1 },
      isLoading: false,
    } as any);

    render(<LowStockWidget />, { wrapper });

    const productButton = screen.getByText('Critical Product').closest('button');
    expect(productButton).toHaveClass('bg-red-50');
  });

  it('should apply warning severity styling for stock <= 50%', () => {
    const products = [
      createMockProduct({ id: 'prod-1', name: 'Warning Product', stockPercentage: 40 }),
    ];

    vi.mocked(useLowStockProducts).mockReturnValue({
      data: { products, count: 1 },
      isLoading: false,
    } as any);

    render(<LowStockWidget />, { wrapper });

    const productButton = screen.getByText('Warning Product').closest('button');
    expect(productButton).toHaveClass('bg-orange-50');
  });

  it('should apply low severity styling for stock > 50%', () => {
    const products = [
      createMockProduct({ id: 'prod-1', name: 'Low Product', stockPercentage: 70 }),
    ];

    vi.mocked(useLowStockProducts).mockReturnValue({
      data: { products, count: 1 },
      isLoading: false,
    } as any);

    render(<LowStockWidget />, { wrapper });

    const productButton = screen.getByText('Low Product').closest('button');
    expect(productButton).toHaveClass('bg-yellow-50');
  });

  it('should handle product click', () => {
    const products = [
      createMockProduct({ id: 'prod-1', name: 'Product A' }),
    ];

    vi.mocked(useLowStockProducts).mockReturnValue({
      data: { products, count: 1 },
      isLoading: false,
    } as any);

    render(<LowStockWidget />, { wrapper });

    const productButton = screen.getByText('Product A').closest('button');
    if (productButton) {
      fireEvent.click(productButton);
      expect(mockPush).toHaveBeenCalledWith('/products/prod-1');
    }
  });

  it('should handle view all click', () => {
    const products = Array.from({ length: 6 }, (_, i) => 
      createMockProduct({ id: `prod-${i}`, name: `Product ${i}` })
    );

    vi.mocked(useLowStockProducts).mockReturnValue({
      data: { products, count: 6 },
      isLoading: false,
    } as any);

    render(<LowStockWidget />, { wrapper });

    const viewAllButton = screen.getByText('View all 6 low stock items');
    fireEvent.click(viewAllButton);
    expect(mockPush).toHaveBeenCalledWith('/products?filter=low-stock');
  });

  it('should handle manage inventory button click', () => {
    const products = [createMockProduct()];

    vi.mocked(useLowStockProducts).mockReturnValue({
      data: { products, count: 1 },
      isLoading: false,
    } as any);

    render(<LowStockWidget />, { wrapper });

    const manageButton = screen.getByText('Manage Inventory');
    fireEvent.click(manageButton);
    expect(mockPush).toHaveBeenCalledWith('/products?filter=low-stock');
  });

  it('should have proper accessibility attributes', () => {
    const products = [
      createMockProduct({ id: 'prod-1', name: 'Product A' }),
    ];

    vi.mocked(useLowStockProducts).mockReturnValue({
      data: { products, count: 1 },
      isLoading: false,
    } as any);

    render(<LowStockWidget />, { wrapper });

    const productButton = screen.getByLabelText('View details for Product A');
    expect(productButton).toBeInTheDocument();
  });

  it('should render progress bar with correct width', () => {
    const products = [
      createMockProduct({ id: 'prod-1', name: 'Product A', stockPercentage: 50 }),
    ];

    vi.mocked(useLowStockProducts).mockReturnValue({
      data: { products, count: 1 },
      isLoading: false,
    } as any);

    const { container } = render(<LowStockWidget />, { wrapper });

    // Find progress bar
    const progressBar = container.querySelector('.h-1\\.5.rounded-full:not(.bg-gray-200)');
    expect(progressBar).toHaveStyle({ width: '50%' });
  });
});
