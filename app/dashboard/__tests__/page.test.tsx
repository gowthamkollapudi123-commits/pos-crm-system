/**
 * Dashboard Page Tests
 * 
 * Tests for dashboard layout, data fetching, and offline support
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.9, 6.10
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from '../page';
import * as dashboardService from '@/services/dashboard.service';
import * as useAuthContext from '@/components/providers/AuthProvider';
import * as useAuth from '@/hooks/useAuth';
import * as useNetworkStatus from '@/hooks/useNetworkStatus';

// Mock modules
vi.mock('@/services/dashboard.service');
vi.mock('@/components/providers/AuthProvider');
vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useNetworkStatus');
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock OfflineIndicator component
vi.mock('@/components/offline/OfflineIndicator', () => ({
  OfflineIndicator: () => <div data-testid="offline-indicator">Offline Indicator</div>,
}));

describe('DashboardPage', () => {
  let queryClient: QueryClient;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'Admin',
    tenantId: 'tenant1',
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  const mockMetrics = {
    sales: {
      today: 1500.50,
      week: 10000.00,
      month: 45000.00,
    },
    transactions: {
      today: 25,
      week: 150,
      month: 600,
    },
    inventory: {
      totalValue: 50000.00,
      lowStockCount: 5,
    },
    customers: {
      total: 100,
      newThisMonth: 10,
    },
    recentTransactions: [],
    topProducts: [],
    salesTrend: [],
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Setup default mocks
    vi.mocked(useAuthContext.useAuthContext).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    });

    vi.mocked(useAuth.useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      resetPassword: vi.fn(),
      confirmResetPassword: vi.fn(),
    });

    vi.mocked(useNetworkStatus.useNetworkStatus).mockReturnValue({
      isOnline: true,
    });

    vi.mocked(dashboardService.dashboardService.getMetrics).mockResolvedValue({
      success: true,
      data: mockMetrics,
      timestamp: new Date().toISOString(),
    });
  });

  it('should render dashboard with metrics when authenticated', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Total Sales Today')).toBeInTheDocument();
    });

    // Requirement 6.1: Display total sales
    expect(screen.getByText('Total Sales Today')).toBeInTheDocument();

    // Requirement 6.2: Display total transactions
    expect(screen.getByText('Transactions Today')).toBeInTheDocument();

    // Requirement 6.3: Display inventory value
    expect(screen.getByText('Inventory Value')).toBeInTheDocument();

    // Requirement 6.4: Display low stock alerts
    expect(screen.getByText('Low Stock Items')).toBeInTheDocument();
  });

  it('should display offline indicator', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    );

    // Requirement 6.10: Display offline indicator
    await waitFor(() => {
      expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
    });
  });

  it('should show loading state while fetching data', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    );

    expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument();
  });

  it('should show error state when data fetch fails', async () => {
    vi.mocked(dashboardService.dashboardService.getMetrics).mockRejectedValue(
      new Error('Failed to fetch')
    );

    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load dashboard data/)).toBeInTheDocument();
    });
  });

  it('should highlight low stock items with alert badge', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Alert')).toBeInTheDocument();
    });
  });

  it('should display user information in header', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('(Admin)')).toBeInTheDocument();
    });
  });

  it('should redirect to login when not authenticated', () => {
    vi.mocked(useAuthContext.useAuthContext).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    );

    // Should render nothing when not authenticated
    expect(container.firstChild).toBeNull();
  });
});
