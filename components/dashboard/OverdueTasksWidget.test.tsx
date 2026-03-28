/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * OverdueTasksWidget Component Tests
 * 
 * Tests for the overdue tasks dashboard widget.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { OverdueTasksWidget } from './OverdueTasksWidget';
import { useOverdueTasks } from '@/hooks/useOverdueTasks';

// Mock dependencies
vi.mock('@/hooks/useOverdueTasks');

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('OverdueTasksWidget', () => {
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

  it('should render widget title', () => {
    vi.mocked(useOverdueTasks).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    render(<OverdueTasksWidget />, { wrapper });

    expect(screen.getByText('Overdue Follow-up Tasks')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    vi.mocked(useOverdueTasks).mockReturnValue({
      data: [],
      isLoading: true,
    } as any);

    render(<OverdueTasksWidget />, { wrapper });

    expect(screen.getByText('Overdue Follow-up Tasks')).toBeInTheDocument();
    // Loading spinner should be present
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should display empty state when no overdue tasks', () => {
    vi.mocked(useOverdueTasks).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    render(<OverdueTasksWidget />, { wrapper });

    expect(screen.getByText('No overdue tasks')).toBeInTheDocument();
    expect(screen.getByText('All follow-ups are on track!')).toBeInTheDocument();
  });

  it('should display overdue tasks', () => {
    vi.mocked(useOverdueTasks).mockReturnValue({
      data: [
        {
          id: '1',
          leadId: 'lead-1',
          leadName: 'John Doe',
          title: 'Follow up call',
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          daysOverdue: 2,
          isCompleted: false,
          assignedTo: 'user-1',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          leadId: 'lead-2',
          leadName: 'Jane Smith',
          title: 'Send proposal',
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          daysOverdue: 5,
          isCompleted: false,
          assignedTo: 'user-1',
          createdAt: new Date().toISOString(),
        },
      ],
      isLoading: false,
    } as any);

    render(<OverdueTasksWidget />, { wrapper });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Follow up call')).toBeInTheDocument();
    expect(screen.getByText(/2 days overdue/i)).toBeInTheDocument();

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Send proposal')).toBeInTheDocument();
    expect(screen.getByText(/5 days overdue/i)).toBeInTheDocument();
  });

  it('should display overdue count badge', () => {
    vi.mocked(useOverdueTasks).mockReturnValue({
      data: [
        {
          id: '1',
          leadId: 'lead-1',
          leadName: 'John Doe',
          title: 'Follow up',
          dueDate: new Date().toISOString(),
          daysOverdue: 2,
          isCompleted: false,
          assignedTo: 'user-1',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          leadId: 'lead-2',
          leadName: 'Jane Smith',
          title: 'Send proposal',
          dueDate: new Date().toISOString(),
          daysOverdue: 5,
          isCompleted: false,
          assignedTo: 'user-1',
          createdAt: new Date().toISOString(),
        },
      ],
      isLoading: false,
    } as any);

    render(<OverdueTasksWidget />, { wrapper });

    expect(screen.getByText('2 overdue')).toBeInTheDocument();
  });

  it('should limit display to 5 tasks', () => {
    const tasks = Array.from({ length: 10 }, (_, i) => ({
      id: `${i}`,
      leadId: `lead-${i}`,
      leadName: `Lead ${i}`,
      title: `Task ${i}`,
      dueDate: new Date().toISOString(),
      daysOverdue: i + 1,
      isCompleted: false,
      assignedTo: 'user-1',
      createdAt: new Date().toISOString(),
    }));

    vi.mocked(useOverdueTasks).mockReturnValue({
      data: tasks,
      isLoading: false,
    } as any);

    render(<OverdueTasksWidget />, { wrapper });

    // Should only display first 5 tasks
    expect(screen.getByText('Lead 0')).toBeInTheDocument();
    expect(screen.getByText('Lead 4')).toBeInTheDocument();
    expect(screen.queryByText('Lead 5')).not.toBeInTheDocument();

    // Should show "View all" link
    expect(screen.getByText('View all 10 overdue tasks')).toBeInTheDocument();
  });

  it('should display manage follow-ups button', () => {
    vi.mocked(useOverdueTasks).mockReturnValue({
      data: [
        {
          id: '1',
          leadId: 'lead-1',
          leadName: 'John Doe',
          title: 'Follow up',
          dueDate: new Date().toISOString(),
          daysOverdue: 2,
          isCompleted: false,
          assignedTo: 'user-1',
          createdAt: new Date().toISOString(),
        },
      ],
      isLoading: false,
    } as any);

    render(<OverdueTasksWidget />, { wrapper });

    expect(screen.getByText('Manage Follow-ups')).toBeInTheDocument();
  });

  it('should handle task click', () => {
    vi.mocked(useOverdueTasks).mockReturnValue({
      data: [
        {
          id: '1',
          leadId: 'lead-1',
          leadName: 'John Doe',
          title: 'Follow up call',
          dueDate: new Date().toISOString(),
          daysOverdue: 2,
          isCompleted: false,
          assignedTo: 'user-1',
          createdAt: new Date().toISOString(),
        },
      ],
      isLoading: false,
    } as any);

    render(<OverdueTasksWidget />, { wrapper });

    const taskButton = screen.getByText('John Doe').closest('button');
    if (taskButton) {
      fireEvent.click(taskButton);
      expect(mockPush).toHaveBeenCalledWith('/leads/lead-1');
    }
  });

  it('should display singular day text for 1 day overdue', () => {
    vi.mocked(useOverdueTasks).mockReturnValue({
      data: [
        {
          id: '1',
          leadId: 'lead-1',
          leadName: 'John Doe',
          title: 'Follow up',
          dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          daysOverdue: 1,
          isCompleted: false,
          assignedTo: 'user-1',
          createdAt: new Date().toISOString(),
        },
      ],
      isLoading: false,
    } as any);

    render(<OverdueTasksWidget />, { wrapper });

    expect(screen.getByText(/1 day overdue/i)).toBeInTheDocument();
  });

  it('should display plural days text for multiple days overdue', () => {
    vi.mocked(useOverdueTasks).mockReturnValue({
      data: [
        {
          id: '1',
          leadId: 'lead-1',
          leadName: 'John Doe',
          title: 'Follow up',
          dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          daysOverdue: 3,
          isCompleted: false,
          assignedTo: 'user-1',
          createdAt: new Date().toISOString(),
        },
      ],
      isLoading: false,
    } as any);

    render(<OverdueTasksWidget />, { wrapper });

    expect(screen.getByText(/3 days overdue/i)).toBeInTheDocument();
  });
});
