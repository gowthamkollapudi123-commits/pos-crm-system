/**
 * Orders Service
 * 
 * Handles all order-related API calls including CRUD operations,
 * order status management, and sales analytics.
 */

import apiClient from '@/lib/axios';
import type {
  ApiResponse,
  PaginatedResponse,
  CreateOrderRequest,
  UpdateOrderRequest,
  SearchParams,
  ExportRequest,
  ExportResponse,
} from '@/types/api';
import type { Order } from '@/types/entities';

export const ordersService = {
  /**
   * Get all orders with optional search and filters
   */
  getAll: async (params?: SearchParams): Promise<PaginatedResponse<Order>> => {
    const response = await apiClient.get<PaginatedResponse<Order>>('/orders', {
      params,
    });
    return response.data;
  },

  /**
   * Get a single order by ID
   */
  getById: async (id: string): Promise<ApiResponse<Order>> => {
    const response = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data;
  },

  /**
   * Create a new order (transaction)
   */
  create: async (data: CreateOrderRequest): Promise<ApiResponse<Order>> => {
    const response = await apiClient.post<ApiResponse<Order>>('/orders', data);
    return response.data;
  },

  /**
   * Update an existing order
   */
  update: async (id: string, data: UpdateOrderRequest): Promise<ApiResponse<Order>> => {
    const response = await apiClient.put<ApiResponse<Order>>(`/orders/${id}`, data);
    return response.data;
  },

  /**
   * Cancel an order
   */
  cancel: async (id: string): Promise<ApiResponse<Order>> => {
    const response = await apiClient.post<ApiResponse<Order>>(`/orders/${id}/cancel`);
    return response.data;
  },

  /**
   * Refund an order
   */
  refund: async (id: string, amount?: number): Promise<ApiResponse<Order>> => {
    const response = await apiClient.post<ApiResponse<Order>>(`/orders/${id}/refund`, {
      amount,
    });
    return response.data;
  },

  /**
   * Get sales analytics by date range
   */
  getSalesAnalytics: async (startDate: string, endDate: string): Promise<
    ApiResponse<{
      totalSales: number;
      totalOrders: number;
      averageOrderValue: number;
      salesByCategory: Array<{ category: string; sales: number }>;
      salesByPaymentMethod: Array<{ method: string; sales: number }>;
    }>
  > => {
    const response = await apiClient.get<
      ApiResponse<{
        totalSales: number;
        totalOrders: number;
        averageOrderValue: number;
        salesByCategory: Array<{ category: string; sales: number }>;
        salesByPaymentMethod: Array<{ method: string; sales: number }>;
      }>
    >('/orders/analytics', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  /**
   * Export orders data
   */
  export: async (request: ExportRequest): Promise<ApiResponse<ExportResponse>> => {
    const response = await apiClient.post<ApiResponse<ExportResponse>>(
      '/orders/export',
      request
    );
    return response.data;
  },

  /**
   * Create order with automatic stock updates
   */
  createWithStockUpdate: async (data: CreateOrderRequest): Promise<ApiResponse<Order>> => {
    const response = await apiClient.post<ApiResponse<Order>>('/orders/with-stock-update', data);
    return response.data;
  },

  /**
   * Cancel order and revert stock
   */
  cancelWithStockRevert: async (id: string): Promise<ApiResponse<Order>> => {
    const response = await apiClient.post<ApiResponse<Order>>(`/orders/${id}/cancel-with-stock-revert`);
    return response.data;
  },

  /**
   * Complete order and update stock
   */
  completeOrder: async (id: string): Promise<ApiResponse<Order>> => {
    const response = await apiClient.post<ApiResponse<Order>>(`/orders/${id}/complete`);
    return response.data;
  },
};
