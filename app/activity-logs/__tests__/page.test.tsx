/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Activity Log Viewer Page Tests
 *
 * Tests for the admin-only activity log viewer including:
 * - Auth guard (Admin only)
 * - Renders table with correct columns
 * - Filter controls (date range, user, action type)
 * - Export CSV button
 * - Pagination
 * - Empty and error states
 *
 * Requirements: 30.6, 30.7, 30.8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ActivityLogsPage from '../page';
import { activityLogService } from '@/services/activity-log.service';
import { useAuthContext } from '@/components/providers/AuthProvider';
import type { ActivityLog } from '@/types/entities';
import { Role, ActivityType } from '@/types/enums';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/components/providers/AuthProvider', () => ({
  useAuthContext: vi.fn(() => ({
    user: { id: 'u1', name: 'Admin User', email: 'admin@example.com', role: Role.ADMIN },
    isAuthenticated: true,
    isLoading: false,
  })),
}));

vi.mock('@/hooks', () => ({
  useAuth: () => ({ logout: vi.fn() }),
}));

vi.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({ isOnline: true }),
}));

vi.mock('@/components/offline/OfflineIndicator', () => ({
  OfflineIndicator: () => <div>Offline Indicator</div>,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/services/activity-log.service', () => ({
  activityLogService: {
    getAll: vi.fn(),
    exportCsv: vi.fn(),
    getQueue: vi.fn(() => []),
  },
}));

vi.mock('@/utils/csv-export', () => ({
  downloadCsv: vi.fn(),
  arrayToCsv: vi.fn(() => 'csv-content'),
  generateCsvFilename: vi.fn(() => 'activity-logs_2024-01-01'),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockLogs: ActivityLog[] = [
  {
    id: 'log1',
    tenantId: 't1',
    userId: 'u1',
    userName: 'Alice Admin',
    type: ActivityType.AUTH,
    action: 'login',
    entityType: 'auth',
    entityId: undefined,
    metadata: undefined,
    timestamp: '2024-01-15T10:00:00Z',
  },
  {
    id: 'log2',
    tenantId: 't1',
    userId: 'u2',
    userName: 'Bob Manager',
    type: ActivityType.TRANSACTION,
    action: 'create_order',
    entityType: 'transaction',
    entityId: 'order_42',
    metadata: { amount: 100 },
    timestamp: '2024-01-15T11:00:00Z',
  },
  {
    id: 'log3',
    tenantId: 't1',
    userId: 'u1',
    userName: 'Alice Admin',
    type: ActivityType.INVENTORY,
    action: 'stock_update',
    entityType: 'product',
    entityId: 'prod_5',
    metadata: undefined,
    timestamp: '2024-01-15T12:00:00Z',
  },
];

const mockPaginatedResponse = {
  success: true,
  data: mockLogs,
  pagination: { page: 1, pageSize: 20, totalItems: 3, totalPages: 1 },
  timestamp: new Date().toISOString(),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderPage(queryClient?: QueryClient) {
  const qc = queryClient ?? new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ActivityLogsPage />
    </QueryClientProvider>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ActivityLogsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthContext).mockReturnValue({
      user: { id: 'u1', name: 'Admin User', email: 'admin@example.com', role: Role.ADMIN },
      isAuthenticated: true,
      isLoading: false,
    } as any);
    vi.mocked(activityLogService.getAll).mockResolvedValue(mockPaginatedResponse);
    vi.mocked(activityLogService.exportCsv).mockResolvedValue(new Blob(['csv'], { type: 'text/csv' }));
  });

  describe('Auth guard', () => {
    it('redirects to /login when not authenticated', () => {
      vi.mocked(useAuthContext).mockReturnValueOnce({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      } as any);

      renderPage();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('redirects to /dashboard when user is not Admin', () => {
      vi.mocked(useAuthContext).mockReturnValueOnce({
        user: { id: 'u2', name: 'Staff User', email: 'staff@example.com', role: Role.STAFF },
        isAuthenticated: true,
        isLoading: false,
      } as any);

      renderPage();
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('shows loading spinner while auth is loading', () => {
      vi.mocked(useAuthContext).mockReturnValueOnce({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      } as any);

      renderPage();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Page structure', () => {
    it('renders page header', () => {
      renderPage();
      expect(screen.getByText('Activity Logs')).toBeInTheDocument();
      expect(screen.getByText('Activity Log Viewer')).toBeInTheDocument();
    });

    it('renders back to dashboard link', () => {
      renderPage();
      expect(screen.getByText('← Back to Dashboard')).toBeInTheDocument();
    });

    it('navigates back to dashboard on click', () => {
      renderPage();
      fireEvent.click(screen.getByText('← Back to Dashboard'));
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('renders Export CSV button', () => {
      renderPage();
      expect(screen.getByRole('button', { name: /export.*csv/i })).toBeInTheDocument();
    });

    it('renders user info in header', () => {
      renderPage();
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
  });

  describe('Filter controls', () => {
    it('renders start date picker', () => {
      renderPage();
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    });

    it('renders end date picker', () => {
      renderPage();
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    });

    it('renders user filter input', () => {
      renderPage();
      expect(screen.getByPlaceholderText('Filter by user...')).toBeInTheDocument();
    });

    it('renders action type select with all options', () => {
      renderPage();
      expect(screen.getByRole('option', { name: 'All Types' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Auth' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Transaction' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Inventory' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Config' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'User Management' })).toBeInTheDocument();
    });

    it('shows Clear Filters button when a filter is active', async () => {
      renderPage();
      const userInput = screen.getByPlaceholderText('Filter by user...');
      fireEvent.change(userInput, { target: { value: 'Alice' } });
      await waitFor(() => {
        expect(screen.getByText('Clear Filters')).toBeInTheDocument();
      });
    });

    it('clears all filters when Clear Filters is clicked', async () => {
      renderPage();
      const userInput = screen.getByPlaceholderText('Filter by user...');
      fireEvent.change(userInput, { target: { value: 'Alice' } });
      await waitFor(() => screen.getByText('Clear Filters'));
      fireEvent.click(screen.getByText('Clear Filters'));
      expect((userInput as HTMLInputElement).value).toBe('');
    });
  });

  describe('Table display', () => {
    it('renders table column headers', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Timestamp')).toBeInTheDocument();
        // "User" and "Action Type" appear as both filter labels and column headers
        expect(screen.getAllByText('User').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Action Type').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Action')).toBeInTheDocument();
        expect(screen.getByText('Entity')).toBeInTheDocument();
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
    });

    it('displays log entries after loading', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getAllByText('Alice Admin').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Bob Manager').length).toBeGreaterThan(0);
      });
    });

    it('displays action values', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getAllByText('login').length).toBeGreaterThan(0);
        expect(screen.getAllByText('create_order').length).toBeGreaterThan(0);
        expect(screen.getAllByText('stock_update').length).toBeGreaterThan(0);
      });
    });

    it('displays action type badges', async () => {
      renderPage();
      await waitFor(() => {
        // auth badge
        const authBadges = screen.getAllByText(ActivityType.AUTH);
        expect(authBadges.length).toBeGreaterThan(0);
      });
    });

    it('shows result count', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText(/Showing 3 of 3 entries/)).toBeInTheDocument();
      });
    });
  });

  describe('Empty and error states', () => {
    it('shows empty state when no logs', async () => {
      vi.mocked(activityLogService.getAll).mockResolvedValue({
        ...mockPaginatedResponse,
        data: [],
        pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
      });

      renderPage();
      await waitFor(() => {
        expect(screen.getAllByText('No activity logs found.').length).toBeGreaterThan(0);
      });
    });

    it('shows error message when API fails', async () => {
      vi.mocked(activityLogService.getAll).mockRejectedValue(new Error('API Error'));

      renderPage();
      await waitFor(() => {
        expect(screen.getByText(/Failed to load activity logs/)).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('does not render pagination when only one page', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /previous page/i })).not.toBeInTheDocument();
      });
    });

    it('renders pagination when multiple pages exist', async () => {
      vi.mocked(activityLogService.getAll).mockResolvedValue({
        ...mockPaginatedResponse,
        pagination: { page: 1, pageSize: 20, totalItems: 100, totalPages: 5 },
      });

      renderPage();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
      });
    });

    it('previous button is disabled on first page', async () => {
      vi.mocked(activityLogService.getAll).mockResolvedValue({
        ...mockPaginatedResponse,
        pagination: { page: 1, pageSize: 20, totalItems: 100, totalPages: 5 },
      });

      renderPage();
      await waitFor(() => {
        const prevBtn = screen.getByRole('button', { name: /previous page/i });
        expect(prevBtn).toBeDisabled();
      });
    });
  });

  describe('CSV Export', () => {
    it('calls exportCsv when Export CSV is clicked (online)', async () => {
      // Mock URL.createObjectURL and revokeObjectURL for jsdom
      global.URL.createObjectURL = vi.fn(() => 'blob:url');
      global.URL.revokeObjectURL = vi.fn();

      renderPage();

      // Wait for data to load first
      await waitFor(() => {
        expect(screen.getAllByText('Alice Admin').length).toBeGreaterThan(0);
      });

      fireEvent.click(screen.getByRole('button', { name: /export.*csv/i }));

      await waitFor(() => {
        expect(activityLogService.exportCsv).toHaveBeenCalled();
      });
    });
  });
});
