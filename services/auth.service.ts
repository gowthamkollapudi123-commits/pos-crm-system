/**
 * Authentication Service
 * 
 * Handles all authentication-related API calls using the configured Axios client.
 * This service demonstrates the proper usage of the API client.
 */

import apiClient from '@/lib/axios';
import type {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  ResetPasswordRequest,
  ApiResponse,
} from '@/types/api';

export const authService = {
  /**
   * Authenticate user with email and password
   */
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      credentials
    );
    return response.data;
  },

  /**
   * Refresh the current session
   */
  refresh: async (): Promise<ApiResponse<RefreshResponse>> => {
    const response = await apiClient.post<ApiResponse<RefreshResponse>>('/auth/refresh');
    return response.data;
  },

  /**
   * Verify current session
   */
  me: async (): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.get<ApiResponse<LoginResponse>>('/auth/me');
    return response.data;
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<ApiResponse<void>> => {
    const response = await apiClient.post<ApiResponse<void>>('/auth/logout');
    return response.data;
  },

  /**
   * Request password reset
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<ApiResponse<void>> => {
    const response = await apiClient.post<ApiResponse<void>>(
      '/auth/reset-password',
      data
    );
    return response.data;
  },

  /**
   * Confirm password reset with token
   */
  resetPasswordConfirm: async (data: { token: string; newPassword: string }): Promise<ApiResponse<void>> => {
    const response = await apiClient.post<ApiResponse<void>>(
      '/auth/reset-password/confirm',
      data
    );
    return response.data;
  },
};
