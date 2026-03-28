/**
 * Dashboard Service
 * 
 * Handles dashboard-related API calls including metrics,
 * recent transactions, and analytics data.
 */

import apiClient from '@/lib/axios';
import type { ApiResponse, DashboardMetrics } from '@/types/api';

export const dashboardService = {
  /**
   * Get dashboard metrics
   */
  getMetrics: async (): Promise<ApiResponse<DashboardMetrics>> => {
    const response = await apiClient.get<ApiResponse<DashboardMetrics>>('/dashboard/metrics');
    return response.data;
  },

  /**
   * Get sales trends for dashboard charts
   */
  getSalesTrends: async (
    period: 'day' | 'week' | 'month' | 'year'
  ): Promise<ApiResponse<Array<{ date: string; sales: number }>>> => {
    const response = await apiClient.get<ApiResponse<Array<{ date: string; sales: number }>>>(
      '/dashboard/sales-trends',
      {
        params: { period },
      }
    );
    return response.data;
  },

  /**
   * Get top selling products
   */
  getTopProducts: async (
    limit: number = 10
  ): Promise<
    ApiResponse<
      Array<{
        productId: string;
        productName: string;
        quantity: number;
        revenue: number;
      }>
    >
  > => {
    const response = await apiClient.get<
      ApiResponse<
        Array<{
          productId: string;
          productName: string;
          quantity: number;
          revenue: number;
        }>
      >
    >('/dashboard/top-products', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Get customer acquisition trends
   */
  getCustomerAcquisition: async (
    period: 'day' | 'week' | 'month' | 'year'
  ): Promise<
    ApiResponse<
      Array<{
        date: string;
        newCustomers: number;
        totalCustomers: number;
      }>
    >
  > => {
    const response = await apiClient.get<
      ApiResponse<
        Array<{
          date: string;
          newCustomers: number;
          totalCustomers: number;
        }>
      >
    >('/dashboard/customer-acquisition', {
      params: { period },
    });
    return response.data;
  },
};
