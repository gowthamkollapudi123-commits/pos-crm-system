/**
 * Settings Service
 * 
 * Handles all settings-related API calls including business information,
 * tax settings, branding, and system configuration.
 */

import apiClient from '@/lib/axios';
import type {
  ApiResponse,
  UpdateBusinessInfoRequest,
  UpdateTenantSettingsRequest,
  UpdateBrandingRequest,
} from '@/types/api';
import type { Tenant } from '@/types/entities';

export const settingsService = {
  /**
   * Get current tenant configuration
   */
  getConfiguration: async (): Promise<ApiResponse<Tenant>> => {
    const response = await apiClient.get<ApiResponse<Tenant>>('/settings');
    return response.data;
  },

  /**
   * Update business information
   */
  updateBusinessInfo: async (
    data: UpdateBusinessInfoRequest
  ): Promise<ApiResponse<Tenant>> => {
    const response = await apiClient.put<ApiResponse<Tenant>>('/settings/business-info', data);
    return response.data;
  },

  /**
   * Update tenant settings (tax, currency, thresholds)
   */
  updateTenantSettings: async (
    data: UpdateTenantSettingsRequest
  ): Promise<ApiResponse<Tenant>> => {
    const response = await apiClient.put<ApiResponse<Tenant>>('/settings/tenant', data);
    return response.data;
  },

  /**
   * Update branding (logo and colors)
   */
  updateBranding: async (data: UpdateBrandingRequest): Promise<ApiResponse<Tenant>> => {
    const response = await apiClient.put<ApiResponse<Tenant>>('/settings/branding', data);
    return response.data;
  },

  /**
   * Update receipt template
   */
  updateReceiptTemplate: async (template: string): Promise<ApiResponse<Tenant>> => {
    const response = await apiClient.put<ApiResponse<Tenant>>('/settings/receipt-template', {
      template,
    });
    return response.data;
  },

  /**
   * Update payment gateway settings
   */
  updatePaymentGateway: async (data: {
    provider: string;
    apiKey: string;
    apiSecret: string;
    testMode: boolean;
  }): Promise<ApiResponse<Tenant>> => {
    const response = await apiClient.put<ApiResponse<Tenant>>('/settings/payment-gateway', data);
    return response.data;
  },

  /**
   * Update notification preferences
   */
  updateNotificationPreferences: async (data: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    lowStockAlerts: boolean;
    orderNotifications: boolean;
  }): Promise<ApiResponse<Tenant>> => {
    const response = await apiClient.put<ApiResponse<Tenant>>(
      '/settings/notifications',
      data
    );
    return response.data;
  },

  /**
   * Upload logo
   */
  uploadLogo: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      '/settings/logo',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};
