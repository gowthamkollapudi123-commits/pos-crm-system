/**
 * Leads Service
 * 
 * Handles all lead-related API calls including CRUD operations,
 * lead conversion, activity tracking, and follow-up tasks.
 */

import apiClient from '@/lib/axios';
import type {
  ApiResponse,
  PaginatedResponse,
  CreateLeadRequest,
  UpdateLeadRequest,
  ConvertLeadToCustomerRequest,
  AddLeadActivityRequest,
  CreateFollowUpTaskRequest,
  SearchParams,
} from '@/types/api';
import type { Lead, Customer } from '@/types/entities';

export const leadsService = {
  /**
   * Get all leads with optional search and filters
   */
  getAll: async (params?: SearchParams): Promise<PaginatedResponse<Lead>> => {
    const response = await apiClient.get<PaginatedResponse<Lead>>('/leads', {
      params,
    });
    return response.data;
  },

  /**
   * Get a single lead by ID
   */
  getById: async (id: string): Promise<ApiResponse<Lead>> => {
    const response = await apiClient.get<ApiResponse<Lead>>(`/leads/${id}`);
    return response.data;
  },

  /**
   * Create a new lead
   */
  create: async (data: CreateLeadRequest): Promise<ApiResponse<Lead>> => {
    const response = await apiClient.post<ApiResponse<Lead>>('/leads', data);
    return response.data;
  },

  /**
   * Update an existing lead
   */
  update: async (id: string, data: UpdateLeadRequest): Promise<ApiResponse<Lead>> => {
    const response = await apiClient.put<ApiResponse<Lead>>(`/leads/${id}`, data);
    return response.data;
  },

  /**
   * Delete a lead
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/leads/${id}`);
    return response.data;
  },

  /**
   * Convert lead to customer
   */
  convertToCustomer: async (
    data: ConvertLeadToCustomerRequest
  ): Promise<ApiResponse<Customer>> => {
    const response = await apiClient.post<ApiResponse<Customer>>(
      `/leads/${data.leadId}/convert`,
      data
    );
    return response.data;
  },

  /**
   * Add activity to lead timeline
   */
  addActivity: async (
    id: string,
    data: AddLeadActivityRequest
  ): Promise<ApiResponse<Lead>> => {
    const response = await apiClient.post<ApiResponse<Lead>>(
      `/leads/${id}/activities`,
      data
    );
    return response.data;
  },

  /**
   * Get lead activity timeline
   */
  getActivities: async (
    id: string
  ): Promise<ApiResponse<Array<{ type: string; description: string; timestamp: string }>>> => {
    const response = await apiClient.get<
      ApiResponse<Array<{ type: string; description: string; timestamp: string }>>
    >(`/leads/${id}/activities`);
    return response.data;
  },

  /**
   * Create follow-up task for lead
   */
  createFollowUpTask: async (
    id: string,
    data: CreateFollowUpTaskRequest
  ): Promise<ApiResponse<Lead>> => {
    const response = await apiClient.post<ApiResponse<Lead>>(
      `/leads/${id}/tasks`,
      data
    );
    return response.data;
  },

  /**
   * Get lead conversion metrics
   */
  getConversionMetrics: async (): Promise<
    ApiResponse<{
      totalLeads: number;
      convertedLeads: number;
      conversionRate: number;
      averageConversionTime: number;
    }>
  > => {
    const response = await apiClient.get<
      ApiResponse<{
        totalLeads: number;
        convertedLeads: number;
        conversionRate: number;
        averageConversionTime: number;
      }>
    >('/leads/metrics');
    return response.data;
  },

  /**
   * Get overdue follow-up tasks
   */
  getOverdueTasks: async (): Promise<
    ApiResponse<
      Array<{
        leadId: string;
        leadName: string;
        taskTitle: string;
        dueDate: string;
      }>
    >
  > => {
    const response = await apiClient.get<
      ApiResponse<
        Array<{
          leadId: string;
          leadName: string;
          taskTitle: string;
          dueDate: string;
        }>
      >
    >('/leads/tasks/overdue');
    return response.data;
  },
};
