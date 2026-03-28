/**
 * Customers Service
 * 
 * Handles all customer-related API calls including CRUD operations,
 * purchase history, and customer analytics.
 */

import apiClient from '@/lib/axios';
import type {
  ApiResponse,
  PaginatedResponse,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  SearchParams,
} from '@/types/api';
import type { Customer, Order } from '@/types/entities';

export const customersService = {
  /**
   * Get all customers with optional search and filters
   */
  getAll: async (params?: SearchParams): Promise<PaginatedResponse<Customer>> => {
    const response = await apiClient.get<PaginatedResponse<Customer>>('/customers', {
      params,
    });
    return response.data;
  },

  /**
   * Get a single customer by ID
   */
  getById: async (id: string): Promise<ApiResponse<Customer>> => {
    const response = await apiClient.get<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data;
  },

  /**
   * Create a new customer
   */
  create: async (data: CreateCustomerRequest): Promise<ApiResponse<Customer>> => {
    const response = await apiClient.post<ApiResponse<Customer>>('/customers', data);
    return response.data;
  },

  /**
   * Update an existing customer
   */
  update: async (id: string, data: UpdateCustomerRequest): Promise<ApiResponse<Customer>> => {
    const response = await apiClient.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return response.data;
  },

  /**
   * Delete a customer
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/customers/${id}`);
    return response.data;
  },

  /**
   * Get customer purchase history
   */
  getPurchaseHistory: async (id: string): Promise<ApiResponse<Order[]>> => {
    const response = await apiClient.get<ApiResponse<Order[]>>(`/customers/${id}/orders`);
    return response.data;
  },

  /**
   * Get customer lifetime value
   */
  getLifetimeValue: async (id: string): Promise<ApiResponse<{ lifetimeValue: number }>> => {
    const response = await apiClient.get<ApiResponse<{ lifetimeValue: number }>>(
      `/customers/${id}/lifetime-value`
    );
    return response.data;
  },

  /**
   * Add note to customer record
   */
  addNote: async (id: string, note: string): Promise<ApiResponse<Customer>> => {
    const response = await apiClient.post<ApiResponse<Customer>>(
      `/customers/${id}/notes`,
      { note }
    );
    return response.data;
  },

  /**
   * Get customer segments
   */
  getSegments: async (): Promise<ApiResponse<Array<{ segment: string; count: number }>>> => {
    const response = await apiClient.get<ApiResponse<Array<{ segment: string; count: number }>>>(
      '/customers/segments'
    );
    return response.data;
  },

  /**
   * Get customer analytics by date range
   */
  getCustomerAnalytics: async (startDate: string, endDate: string): Promise<
    ApiResponse<{
      totalCustomers: number;
      newCustomers: number;
      retentionRate: number;
      averageLifetimeValue: number;
      customerAcquisitionTrend: Array<{ date: string; count: number }>;
      lifetimeValueDistribution: Array<{ range: string; count: number }>;
      customerSegmentation: Array<{ segment: string; count: number; totalValue: number }>;
      topCustomers: Array<{ id: string; name: string; lifetimeValue: number; totalOrders: number }>;
    }>
  > => {
    const response = await apiClient.get<
      ApiResponse<{
        totalCustomers: number;
        newCustomers: number;
        retentionRate: number;
        averageLifetimeValue: number;
        customerAcquisitionTrend: Array<{ date: string; count: number }>;
        lifetimeValueDistribution: Array<{ range: string; count: number }>;
        customerSegmentation: Array<{ segment: string; count: number; totalValue: number }>;
        topCustomers: Array<{ id: string; name: string; lifetimeValue: number; totalOrders: number }>;
      }>
    >('/customers/analytics', {
      params: { startDate, endDate },
    });
    return response.data;
  },
};
