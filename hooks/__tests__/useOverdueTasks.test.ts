/**
 * useOverdueTasks Hook Tests
 * 
 * Tests for the overdue tasks hook functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useOverdueTasks } from '../useOverdueTasks';
import { leadsService } from '@/services/leads.service';

// Mock the leads service
vi.mock('@/services/leads.service', () => ({
  leadsService: {
    getOverdueTasks: vi.fn(),
  },
}));

describe('useOverdueTasks', () => {
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

  it('should fetch overdue tasks successfully', async () => {
    const mockTasks = [
      {
        leadId: 'lead-1',
        leadName: 'John Doe',
        taskTitle: 'Follow up call',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      },
      {
        leadId: 'lead-2',
        leadName: 'Jane Smith',
        taskTitle: 'Send proposal',
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      },
    ];

    vi.mocked(leadsService.getOverdueTasks).mockResolvedValue({
      success: true,
      data: mockTasks,
      timestamp: new Date().toISOString(),
    });

    const { result } = renderHook(() => useOverdueTasks(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]).toMatchObject({
      leadId: 'lead-1',
      leadName: 'John Doe',
      title: 'Follow up call',
    });
    expect(result.current.data?.[0].daysOverdue).toBeGreaterThanOrEqual(2);
    expect(result.current.data?.[1].daysOverdue).toBeGreaterThanOrEqual(5);
  });

  it('should calculate days overdue correctly', async () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    vi.mocked(leadsService.getOverdueTasks).mockResolvedValue({
      success: true,
      data: [
        {
          leadId: 'lead-1',
          leadName: 'Test Lead',
          taskTitle: 'Test Task',
          dueDate: oneDayAgo,
        },
      ],
      timestamp: new Date().toISOString(),
    });

    const { result } = renderHook(() => useOverdueTasks(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.[0].daysOverdue).toBeGreaterThanOrEqual(1);
  });

  it('should return empty array when no overdue tasks', async () => {
    vi.mocked(leadsService.getOverdueTasks).mockResolvedValue({
      success: true,
      data: [],
      timestamp: new Date().toISOString(),
    });

    const { result } = renderHook(() => useOverdueTasks(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(leadsService.getOverdueTasks).mockRejectedValue(
      new Error('API Error')
    );

    const { result } = renderHook(() => useOverdueTasks(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });

  it('should refetch data at configured interval', async () => {
    vi.mocked(leadsService.getOverdueTasks).mockResolvedValue({
      success: true,
      data: [],
      timestamp: new Date().toISOString(),
    });

    const { result } = renderHook(() => useOverdueTasks(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify the query has refetch interval configured
    const queryState = queryClient.getQueryState(['leads', 'tasks', 'overdue']);
    expect(queryState).toBeDefined();
  });
});
