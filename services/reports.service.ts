/**
 * Reports Service
 * 
 * Handles all report generation and export operations including
 * sales, inventory, customer, and product performance reports.
 */

import apiClient from '@/lib/axios';
import type {
  ApiResponse,
  ReportFilters,
  SalesReportResponse,
  InventoryReportResponse,
  CustomerReportResponse,
  ExportRequest,
  ExportResponse,
} from '@/types/api';

export const reportsService = {
  /**
   * Generate sales report
   */
  getSalesReport: async (filters: ReportFilters): Promise<ApiResponse<SalesReportResponse>> => {
    const response = await apiClient.get<ApiResponse<SalesReportResponse>>('/reports/sales', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Generate inventory report
   */
  getInventoryReport: async (
    filters?: ReportFilters
  ): Promise<ApiResponse<InventoryReportResponse>> => {
    const response = await apiClient.get<ApiResponse<InventoryReportResponse>>(
      '/reports/inventory',
      {
        params: filters,
      }
    );
    return response.data;
  },

  /**
   * Generate customer report
   */
  getCustomerReport: async (
    filters?: ReportFilters
  ): Promise<ApiResponse<CustomerReportResponse>> => {
    const response = await apiClient.get<ApiResponse<CustomerReportResponse>>(
      '/reports/customers',
      {
        params: filters,
      }
    );
    return response.data;
  },

  /**
   * Generate product performance report
   */
  getProductPerformanceReport: async (
    filters: ReportFilters
  ): Promise<
    ApiResponse<{
      topProducts: Array<{
        productId: string;
        productName: string;
        quantity: number;
        revenue: number;
      }>;
      bottomProducts: Array<{
        productId: string;
        productName: string;
        quantity: number;
        revenue: number;
      }>;
    }>
  > => {
    const response = await apiClient.get<
      ApiResponse<{
        topProducts: Array<{
          productId: string;
          productName: string;
          quantity: number;
          revenue: number;
        }>;
        bottomProducts: Array<{
          productId: string;
          productName: string;
          quantity: number;
          revenue: number;
        }>;
      }>
    >('/reports/products', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Generate payment method report
   */
  getPaymentMethodReport: async (
    filters: ReportFilters
  ): Promise<
    ApiResponse<{
      paymentMethods: Array<{
        method: string;
        transactions: number;
        totalAmount: number;
        percentage: number;
      }>;
    }>
  > => {
    const response = await apiClient.get<
      ApiResponse<{
        paymentMethods: Array<{
          method: string;
          transactions: number;
          totalAmount: number;
          percentage: number;
        }>;
      }>
    >('/reports/payment-methods', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Generate profit and loss report
   */
  getProfitLossReport: async (
    filters: ReportFilters
  ): Promise<
    ApiResponse<{
      revenue: number;
      costs: number;
      profit: number;
      profitMargin: number;
      breakdown: Array<{
        date: string;
        revenue: number;
        costs: number;
        profit: number;
      }>;
    }>
  > => {
    const response = await apiClient.get<
      ApiResponse<{
        revenue: number;
        costs: number;
        profit: number;
        profitMargin: number;
        breakdown: Array<{
          date: string;
          revenue: number;
          costs: number;
          profit: number;
        }>;
      }>
    >('/reports/profit-loss', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Export report to PDF or CSV
   */
  exportReport: async (
    reportType: string,
    request: ExportRequest
  ): Promise<ApiResponse<ExportResponse>> => {
    const response = await apiClient.post<ApiResponse<ExportResponse>>(
      `/reports/${reportType}/export`,
      request
    );
    return response.data;
  },

  /**
   * Get scheduled reports
   */
  getScheduledReports: async (): Promise<
    ApiResponse<
      Array<{
        id: string;
        reportType: string;
        schedule: string;
        recipients: string[];
        format: string;
      }>
    >
  > => {
    const response = await apiClient.get<
      ApiResponse<
        Array<{
          id: string;
          reportType: string;
          schedule: string;
          recipients: string[];
          format: string;
        }>
      >
    >('/reports/scheduled');
    return response.data;
  },

  /**
   * Create scheduled report
   */
  createScheduledReport: async (data: {
    reportType: string;
    schedule: string;
    recipients: string[];
    format: string;
    filters?: ReportFilters;
  }): Promise<ApiResponse<{ id: string }>> => {
    const response = await apiClient.post<ApiResponse<{ id: string }>>(
      '/reports/scheduled',
      data
    );
    return response.data;
  },
};
