/**
 * Users Service
 *
 * Handles all user-related API calls including CRUD operations
 * and user management.
 */

import apiClient from '@/lib/axios';
import type {
  ApiResponse,
  PaginatedResponse,
  CreateUserRequest,
  UpdateUserRequest,
  SearchParams,
} from '@/types/api';
import type { User } from '@/types/entities';

export const usersService = {
  /**
   * Get all users with optional search and filters
   */
  getAll: async (params?: SearchParams): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get<PaginatedResponse<User>>('/users', { params });
    return response.data;
  },

  /**
   * Get a single user by ID
   */
  getById: async (id: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  },

  /**
   * Create a new user
   */
  create: async (data: CreateUserRequest): Promise<ApiResponse<User>> => {
    const response = await apiClient.post<ApiResponse<User>>('/users', data);
    return response.data;
  },

  /**
   * Update an existing user
   */
  update: async (id: string, data: UpdateUserRequest): Promise<ApiResponse<User>> => {
    const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Deactivate a user account
   */
  deactivate: async (id: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.patch<ApiResponse<User>>(`/users/${id}/deactivate`);
    return response.data;
  },
};
