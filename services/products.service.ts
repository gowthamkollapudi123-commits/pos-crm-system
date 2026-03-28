/**
 * Products Service
 * 
 * Handles all product-related API calls including CRUD operations,
 * bulk import, and inventory management.
 */

import apiClient from '@/lib/axios';
import type {
  ApiResponse,
  PaginatedResponse,
  CreateProductRequest,
  UpdateProductRequest,
  BulkImportProductsRequest,
  BulkImportProductsResponse,
  SearchParams,
} from '@/types/api';
import type { Product, InventoryMovement } from '@/types/entities';

export const productsService = {
  /**
   * Get all products with optional search and filters
   */
  getAll: async (params?: SearchParams): Promise<PaginatedResponse<Product>> => {
    const response = await apiClient.get<PaginatedResponse<Product>>('/products', {
      params,
    });
    return response.data;
  },

  /**
   * Get a single product by ID
   */
  getById: async (id: string): Promise<ApiResponse<Product>> => {
    const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  },

  /**
   * Create a new product
   */
  create: async (data: CreateProductRequest): Promise<ApiResponse<Product>> => {
    const response = await apiClient.post<ApiResponse<Product>>('/products', data);
    return response.data;
  },

  /**
   * Update an existing product
   */
  update: async (id: string, data: UpdateProductRequest): Promise<ApiResponse<Product>> => {
    const response = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, data);
    return response.data;
  },

  /**
   * Delete a product
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/products/${id}`);
    return response.data;
  },

  /**
   * Bulk import products from CSV
   */
  bulkImport: async (
    data: BulkImportProductsRequest
  ): Promise<ApiResponse<BulkImportProductsResponse>> => {
    const response = await apiClient.post<ApiResponse<BulkImportProductsResponse>>(
      '/products/bulk-import',
      data
    );
    return response.data;
  },

  /**
   * Get low stock products
   */
  getLowStock: async (): Promise<ApiResponse<Product[]>> => {
    const response = await apiClient.get<ApiResponse<Product[]>>('/products/low-stock');
    return response.data;
  },

  /**
   * Search products by barcode
   */
  searchByBarcode: async (barcode: string): Promise<ApiResponse<Product>> => {
    const response = await apiClient.get<ApiResponse<Product>>('/products/barcode', {
      params: { barcode },
    });
    return response.data;
  },

  /**
   * Check if product has transaction history
   */
  checkProductTransactions: async (id: string): Promise<ApiResponse<{ count: number }>> => {
    const response = await apiClient.get<ApiResponse<{ count: number }>>(
      `/products/${id}/transactions/count`
    );
    return response.data;
  },

  /**
   * Check if SKU is unique
   */
  checkSkuUniqueness: async (sku: string, excludeId?: string): Promise<ApiResponse<{ isUnique: boolean }>> => {
    const response = await apiClient.get<ApiResponse<{ isUnique: boolean }>>(
      '/products/check-sku',
      {
        params: { sku, excludeId },
      }
    );
    return response.data;
  },

  /**
   * Update product stock and create inventory movement record
   */
  updateStock: async (
    productId: string,
    quantity: number,
    movementType: 'sale' | 'purchase' | 'adjustment' | 'return' | 'transfer',
    referenceId: string,
    referenceType: 'order' | 'transaction' | 'manual',
    variantId?: string,
    notes?: string
  ): Promise<ApiResponse<{ product: Product; movement: InventoryMovement }>> => {
    const response = await apiClient.post<ApiResponse<{ product: Product; movement: InventoryMovement }>>(
      `/products/${productId}/stock`,
      {
        quantity,
        movementType,
        referenceId,
        referenceType,
        variantId,
        notes,
      }
    );
    return response.data;
  },

  /**
   * Get inventory movements for a product
   */
  getInventoryMovements: async (
    productId: string,
    params?: {
      page?: number;
      limit?: number;
      movementType?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<PaginatedResponse<InventoryMovement>> => {
    const response = await apiClient.get<PaginatedResponse<InventoryMovement>>(
      `/products/${productId}/inventory-movements`,
      { params }
    );
    return response.data;
  },

  /**
   * Manually adjust product stock
   */
  adjustStock: async (
    productId: string,
    quantity: number,
    reason: string,
    variantId?: string
  ): Promise<ApiResponse<{ product: Product; movement: InventoryMovement }>> => {
    const response = await apiClient.post<ApiResponse<{ product: Product; movement: InventoryMovement }>>(
      `/products/${productId}/adjust-stock`,
      {
        quantity,
        reason,
        variantId,
      }
    );
    return response.data;
  },

  /**
   * Record inventory movement
   */
  recordInventoryMovement: async (
    data: {
      productId: string;
      variantId?: string;
      movementType: 'sale' | 'purchase' | 'adjustment' | 'return' | 'transfer';
      quantity: number;
      previousStock: number;
      newStock: number;
      referenceType: 'order' | 'transaction' | 'manual';
      referenceId: string;
      notes?: string;
    }
  ): Promise<ApiResponse<InventoryMovement>> => {
    const response = await apiClient.post<ApiResponse<InventoryMovement>>(
      '/inventory-movements',
      data
    );
    return response.data;
  },

  /**
   * Get inventory history for a product
   */
  getInventoryHistory: async (
    productId: string,
    params?: {
      page?: number;
      limit?: number;
      movementType?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<PaginatedResponse<InventoryMovement>> => {
    return productsService.getInventoryMovements(productId, params);
  },
};
