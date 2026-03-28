/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * NotificationBell Component Tests
 * 
 * Tests for the notification bell component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { NotificationBell } from './NotificationBell';
import { useOverdueTasks } from '@/hooks/useOverdueTasks';

// Mock dependencies
vi.mock('@/hooks/useOverdueTasks');

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('NotificationBell', () => {
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

  it('should render bell icon', () => {
    vi.mocked(useOverdueTasks).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    render(<NotificationBell />, { wrapper });

    const button = screen.getByRole('button', { name: /notifications/i });
    expect(button).toBeInTheDocument();
  });

  it('should display badge with overdue count', () => {
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

    render(<NotificationBell />, { wrapper });

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should display 99+ for counts over 99', () => {
    const tasks = Array.from({ length: 150 }, (_, i) => ({
      id: `${i}`,
      leadId: `lead-${i}`,
      leadName: `Lead ${i}`,
      title: 'Task',
      dueDate: new Date().toISOString(),
      daysOverdue: 1,
      isCompleted: false,
      assignedTo: 'user-1',
      createdAt: new Date().toISOString(),
    }));

    vi.mocked(useOverdueTasks).mockReturnValue({
      data: tasks,
      isLoading: false,
    } as any);

    render(<NotificationBell />, { wrapper });

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('should open dropdown when bell is clicked', async () => {
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
      ],
      isLoading: false,
    } as any);

    render(<NotificationBell />, { wrapper });

    const button = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Overdue Follow-up Tasks')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Follow up call')).toBeInTheDocument();
    expect(screen.getByText(/2 days overdue/i)).toBeInTheDocument();
  });

  it('should close dropdown when close button is clicked', async () => {
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

    render(<NotificationBell />, { wrapper });

    // Open dropdown
    const bellButton = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Overdue Follow-up Tasks')).toBeInTheDocument();
    });

    // Close dropdown
    const closeButton = screen.getByRole('button', { name: /close notifications/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Overdue Follow-up Tasks')).not.toBeInTheDocument();
    });
  });

  it('should display empty state when no overdue tasks', async () => {
    vi.mocked(useOverdueTasks).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    render(<NotificationBell />, { wrapper });

    const button = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('No overdue tasks')).toBeInTheDocument();
    });

    expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
  });

  it('should display loading state', async () => {
    vi.mocked(useOverdueTasks).mockReturnValue({
      data: [],
      isLoading: true,
    } as any);

    render(<NotificationBell />, { wrapper });

    const button = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  it('should close dropdown on Escape key', async () => {
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

    render(<NotificationBell />, { wrapper });

    // Open dropdown
    const button = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Overdue Follow-up Tasks')).toBeInTheDocument();
    });

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('Overdue Follow-up Tasks')).not.toBeInTheDocument();
    });
  });

  it('should have proper ARIA attributes', () => {
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

    render(<NotificationBell />, { wrapper });

    const button = screen.getByRole('button', { name: /notifications.*1 overdue tasks/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-haspopup', 'true');
  });
});
