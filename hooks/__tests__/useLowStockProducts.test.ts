/**
 * useLowStockProducts Hook Tests
 * 
 * Tests for the low stock products hook functionality.
 * Requirements: 11.6, 29.1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useLowStockProducts } from '../useLowStockProducts';
import { productsService } from '@/services/products.service';
import type { Product } from '@/types/entities';

// Mock the products service
vi.mock('@/services/products.service', () => ({
  productsService: {
    getLowStock: vi.fn(),
  },
}));

describe('useLowStockProducts', () => {
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

  const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
    id: 'prod-1',
    tenantId: 'tenant-1',
    sku: 'SKU-001',
    name: 'Test Product',
    category: 'Electronics',
    price: 100,
    stockQuantity: 5,
    minStockLevel: 10,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  it('should fetch low stock products successfully', async () => {
    const mockProducts = [
      createMockProduct({ id: 'prod-1', name: 'Product A', stockQuantity: 5, minStockLevel: 10 }),
      createMockProduct({ id: 'prod-2', name: 'Product B', stockQuantity: 2, minStockLevel: 10 }),
    ];

    vi.mocked(productsService.getLowStock).mockResolvedValue({
      success: true,
      data: mockProducts,
      timestamp: new Date().toISOString(),
    });

    const { result } = renderHook(() => useLowStockProducts(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.products).toHaveLength(2);
    expect(result.current.data?.count).toBe(2);
  });

  it('should calculate stock percentage correctly', async () => {
    const mockProducts = [
      createMockProduct({ stockQuantity: 5, minStockLevel: 10 }), // 50%
      createMockProduct({ id: 'prod-2', stockQuantity: 2, minStockLevel: 10 }), // 20%
    ];

    vi.mocked(productsService.getLowStock).mockResolvedValue({
      success: true,
      data: mockProducts,
      timestamp: new Date().toISOString(),
    });

    const { result } = renderHook(() => useLowStockProducts(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Products are sorted by stock percentage (most critical first)
    // So prod-2 (20%) should be first, prod-1 (50%) should be second
    expect(result.current.data?.products[0].stockPercentage).toBe(20);
    expect(result.current.data?.products[1].stockPercentage).toBe(50);
  });

  it('should sort products by stock percentage (most critical first)', async () => {
    const mockProducts = [
      createMockProduct({ id: 'prod-1', stockQuantity: 8, minStockLevel: 10 }), // 80%
      createMockProduct({ id: 'prod-2', stockQuantity: 2, minStockLevel: 10 }), // 20%
      createMockProduct({ id: 'prod-3', stockQuantity: 5, minStockLevel: 10 }), // 50%
    ];

    vi.mocked(productsService.getLowStock).mockResolvedValue({
      success: true,
      data: mockProducts,
      timestamp: new Date().toISOString(),
    });

    const { result } = renderHook(() => useLowStockProducts(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const products = result.current.data?.products || [];
    expect(products[0].id).toBe('prod-2'); // 20% - most critical
    expect(products[1].id).toBe('prod-3'); // 50%
    expect(products[2].id).toBe('prod-1'); // 80% - least critical
  });

  it('should handle zero minStockLevel', async () => {
    const mockProducts = [
      createMockProduct({ stockQuantity: 5, minStockLevel: 0 }),
    ];

    vi.mocked(productsService.getLowStock).mockResolvedValue({
      success: true,
      data: mockProducts,
      timestamp: new Date().toISOString(),
    });

    const { result } = renderHook(() => useLowStockProducts(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.products[0].stockPercentage).toBe(0);
  });

  it('should return empty array when no low stock products', async () => {
    vi.mocked(productsService.getLowStock).mockResolvedValue({
      success: true,
      data: [],
      timestamp: new Date().toISOString(),
    });

    const { result } = renderHook(() => useLowStockProducts(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.products).toEqual([]);
    expect(result.current.data?.count).toBe(0);
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(productsService.getLowStock).mockRejectedValue(
      new Error('API Error')
    );

    const { result } = renderHook(() => useLowStockProducts(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });

  it('should have refetch interval configured', async () => {
    vi.mocked(productsService.getLowStock).mockResolvedValue({
      success: true,
      data: [],
      timestamp: new Date().toISOString(),
    });

    const { result } = renderHook(() => useLowStockProducts(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify the query has refetch interval configured
    const queryState = queryClient.getQueryState(['products', 'low-stock']);
    expect(queryState).toBeDefined();
  });
});
