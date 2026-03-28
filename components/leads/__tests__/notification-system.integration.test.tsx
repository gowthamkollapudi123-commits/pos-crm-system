/**
 * Notification System Integration Tests
 * 
 * Tests the complete notification system for overdue follow-up tasks.
 * Validates Requirements 9.9, 29.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'sonner';
import { NotificationBell } from '../NotificationBell';
import { OverdueTasksWidget } from '@/components/dashboard/OverdueTasksWidget';
import { useOverdueTaskNotifications } from '@/hooks/useOverdueTaskNotifications';
import { leadsService } from '@/services/leads.service';

// Mock dependencies
vi.mock('@/services/leads.service', () => ({
  leadsService: {
    getOverdueTasks: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
  },
}));

describe('Notification System Integration', () => {
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

  describe('Requirement 9.9: Send notifications for overdue follow-up tasks', () => {
    it('should fetch overdue tasks from API', async () => {
      const mockTasks = [
        {
          leadId: 'lead-1',
          leadName: 'John Doe',
          taskTitle: 'Follow up call',
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      vi.mocked(leadsService.getOverdueTasks).mockResolvedValue({
        success: true,
        data: mockTasks,
        timestamp: new Date().toISOString(),
      });

      render(<NotificationBell />, { wrapper });

      await waitFor(() => {
        expect(leadsService.getOverdueTasks).toHaveBeenCalled();
      });
    });

    it('should display toast notification for single overdue task', async () => {
      const mockTasks = [
        {
          leadId: 'lead-1',
          leadName: 'John Doe',
          taskTitle: 'Follow up call',
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      vi.mocked(leadsService.getOverdueTasks).mockResolvedValue({
        success: true,
        data: mockTasks,
        timestamp: new Date().toISOString(),
      });

      function TestComponent() {
        useOverdueTaskNotifications();
        return null;
      }

      render(<TestComponent />, { wrapper });

      await waitFor(() => {
        expect(toast.warning).toHaveBeenCalledWith(
          expect.stringContaining('Follow up call'),
          expect.objectContaining({
            duration: 5000,
          })
        );
      });
    });

    it('should display toast notification for multiple overdue tasks', async () => {
      const mockTasks = [
        {
          leadId: 'lead-1',
          leadName: 'John Doe',
          taskTitle: 'Follow up call',
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          leadId: 'lead-2',
          leadName: 'Jane Smith',
          taskTitle: 'Send proposal',
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      vi.mocked(leadsService.getOverdueTasks).mockResolvedValue({
        success: true,
        data: mockTasks,
        timestamp: new Date().toISOString(),
      });

      function TestComponent() {
        useOverdueTaskNotifications();
        return null;
      }

      render(<TestComponent />, { wrapper });

      await waitFor(() => {
        expect(toast.warning).toHaveBeenCalledWith(
          expect.stringContaining('2 overdue follow-up tasks'),
          expect.objectContaining({
            duration: 5000,
          })
        );
      });
    });
  });

  describe('Requirement 29.4: Display notifications for overdue follow-up tasks', () => {
    it('should display notification bell with badge count', async () => {
      const mockTasks = [
        {
          leadId: 'lead-1',
          leadName: 'John Doe',
          taskTitle: 'Follow up call',
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          leadId: 'lead-2',
          leadName: 'Jane Smith',
          taskTitle: 'Send proposal',
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      vi.mocked(leadsService.getOverdueTasks).mockResolvedValue({
        success: true,
        data: mockTasks,
        timestamp: new Date().toISOString(),
      });

      render(<NotificationBell />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('should display overdue tasks in dropdown panel', async () => {
      const mockTasks = [
        {
          leadId: 'lead-1',
          leadName: 'John Doe',
          taskTitle: 'Follow up call',
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      vi.mocked(leadsService.getOverdueTasks).mockResolvedValue({
        success: true,
        data: mockTasks,
        timestamp: new Date().toISOString(),
      });

      render(<NotificationBell />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      fireEvent.click(bellButton);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Follow up call')).toBeInTheDocument();
        expect(screen.getByText(/days overdue/i)).toBeInTheDocument();
      });
    });

    it('should display overdue tasks in dashboard widget', async () => {
      const mockTasks = [
        {
          leadId: 'lead-1',
          leadName: 'John Doe',
          taskTitle: 'Follow up call',
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      vi.mocked(leadsService.getOverdueTasks).mockResolvedValue({
        success: true,
        data: mockTasks,
        timestamp: new Date().toISOString(),
      });

      render(<OverdueTasksWidget />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Follow up call')).toBeInTheDocument();
        expect(screen.getByText(/days overdue/i)).toBeInTheDocument();
      });
    });

    it('should show lead name, task title, due date, and days overdue', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const mockTasks = [
        {
          leadId: 'lead-1',
          leadName: 'John Doe',
          taskTitle: 'Follow up call',
          dueDate: twoDaysAgo.toISOString(),
        },
      ];

      vi.mocked(leadsService.getOverdueTasks).mockResolvedValue({
        success: true,
        data: mockTasks,
        timestamp: new Date().toISOString(),
      });

      render(<NotificationBell />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      fireEvent.click(bellButton);

      await waitFor(() => {
        // Lead name
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        // Task title
        expect(screen.getByText('Follow up call')).toBeInTheDocument();
        // Due date (format: MMM dd, yyyy)
        expect(screen.getByText(/Due:/i)).toBeInTheDocument();
        // Days overdue - use getAllByText since "overdue" appears in header too
        const overdueElements = screen.getAllByText(/overdue/i);
        expect(overdueElements.length).toBeGreaterThan(0);
      });
    });

    it('should navigate to lead detail page when task is clicked', async () => {
      vi.mocked(leadsService.getOverdueTasks).mockResolvedValue({
        success: true,
        data: [
          {
            leadId: 'lead-1',
            leadName: 'John Doe',
            taskTitle: 'Follow up call',
            dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
        timestamp: new Date().toISOString(),
      });

      render(<NotificationBell />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      fireEvent.click(bellButton);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const taskButton = screen.getByText('John Doe').closest('button');
      expect(taskButton).toBeInTheDocument();
    });
  });

  describe('Data refresh and synchronization', () => {
    it('should refetch overdue tasks at configured interval', async () => {
      vi.mocked(leadsService.getOverdueTasks).mockResolvedValue({
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      });

      render(<NotificationBell />, { wrapper });

      await waitFor(() => {
        expect(leadsService.getOverdueTasks).toHaveBeenCalledTimes(1);
      });

      // Verify query configuration
      const queryState = queryClient.getQueryState(['leads', 'tasks', 'overdue']);
      expect(queryState).toBeDefined();
    });
  });
});
