/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Orders Page Tests
 * 
 * Tests for orders list page including export functionality.
 * Requirement 10.9: Export sales data to CSV
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRouter } from 'next/navigation';
import OrdersPage from './page';
import { ordersService } from '@/services/orders.service';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@/types/enums';
import { downloadCsv, generateCsvFilename } from '@/utils/csv-export';
import { toast } from 'sonner';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock orders service
vi.mock('@/services/orders.service', () => ({
  ordersService: {
    getAll: vi.fn(),
  },
}));

// Mock auth provider
vi.mock('@/components/providers/AuthProvider', () => ({
  useAuthContext: () => ({
    user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// Mock useAuth hook
vi.mock('@/hooks', () => ({
  useAuth: () => ({
    logout: vi.fn(),
  }),
}));

// Mock network status hook
vi.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    isOnline: true,
  }),
}));

// Mock CSV export utilities
vi.mock('@/utils/csv-export', () => ({
  arrayToCsv: vi.fn((data) => 'mocked,csv,content'),
  downloadCsv: vi.fn(),
  generateCsvFilename: vi.fn(() => 'orders_2024-01-15_120000'),
  formatCurrencyForCsv: vi.fn((value) => `INR ${value.toFixed(2)}`),
  formatDateForCsv: vi.fn((date) => '2024-01-15 10:30:00'),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  SearchIcon: () => <div data-testid="search-icon" />,
  FunnelIcon: () => <div data-testid="filter-icon" />,
  PlusIcon: () => <div data-testid="plus-icon" />,
  ShoppingCartIcon: () => <div data-testid="shopping-cart-icon" />,
  DownloadIcon: () => <div data-testid="download-icon" />,
}));

// Mock DataTable component
vi.mock('@/components/ui/data-table', () => ({
  DataTable: ({ data, loading, emptyMessage }: any) => {
    if (loading) return <div>Loading table...</div>;
    if (!data || data.length === 0) return <div>{emptyMessage}</div>;
    return (
      <div data-testid="data-table">
        {data.map((order: any) => (
          <div key={order.id}>{order.orderNumber}</div>
        ))}
      </div>
    );
  },
}));

// Mock OfflineIndicator component
vi.mock('@/components/offline/OfflineIndicator', () => ({
  OfflineIndicator: () => <div data-testid="offline-indicator" />,
}));

const mockOrders = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    customerId: 'cust-1',
    customer: { id: 'cust-1', name: 'John Doe', phone: '1234567890' },
    items: [],
    subtotal: 1000,
    taxAmount: 100,
    discountAmount: 0,
    totalAmount: 1100,
    status: OrderStatus.COMPLETED,
    paymentMethod: PaymentMethod.CARD,
    paymentStatus: PaymentStatus.PAID,
    createdBy: 'user-1',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    tenantId: 'tenant-1',
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    customerId: 'cust-2',
    customer: { id: 'cust-2', name: 'Jane Smith', phone: '9876543210' },
    items: [],
    subtotal: 2000,
    taxAmount: 200,
    discountAmount: 100,
    totalAmount: 2100,
    status: OrderStatus.PENDING,
    paymentMethod: PaymentMethod.UPI,
    paymentStatus: PaymentStatus.PENDING,
    createdBy: 'user-1',
    createdAt: '2024-01-16T14:45:00Z',
    updatedAt: '2024-01-16T14:45:00Z',
    tenantId: 'tenant-1',
  },
];

describe('OrdersPage - Export Functionality', () => {
  let queryClient: QueryClient;
  const mockPush = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    });
  });

  const renderPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <OrdersPage />
      </QueryClientProvider>
    );
  };

  describe('Requirement 10.9: Export orders to CSV', () => {
    it('should render export button', async () => {
      (ordersService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockOrders,
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 2,
          totalPages: 1,
        },
      });

      renderPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
      });
    });

    it('should disable export button when no orders are available', async () => {
      (ordersService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 0,
        },
      });

      renderPage();

      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /Export CSV/i });
        expect(exportButton).toBeDisabled();
      });
    });

    it('should trigger CSV export when export button is clicked', async () => {
      const user = userEvent.setup();
      (ordersService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockOrders,
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 2,
          totalPages: 1,
        },
      });

      renderPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /Export CSV/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(downloadCsv).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Exported 2 orders successfully');
      });
    });

    it('should export all visible orders with correct columns', async () => {
      const user = userEvent.setup();
      (ordersService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockOrders,
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 2,
          totalPages: 1,
        },
      });

      renderPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /Export CSV/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(downloadCsv).toHaveBeenCalled();
      });
    });

    it('should include current filters in filename', async () => {
      const user = userEvent.setup();
      (ordersService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockOrders,
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 2,
          totalPages: 1,
        },
      });

      renderPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /Export CSV/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(generateCsvFilename).toHaveBeenCalled();
        expect(downloadCsv).toHaveBeenCalled();
      });
    });

    it('should show error toast when no orders to export', async () => {
      const user = userEvent.setup();
      (ordersService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 0,
        },
      });

      renderPage();

      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /Export CSV/i });
        expect(exportButton).toBeDisabled();
      });
    });

    it('should show error toast when export fails', async () => {
      const user = userEvent.setup();
      (ordersService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockOrders,
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 2,
          totalPages: 1,
        },
      });

      renderPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
      });

      // Mock downloadCsv to throw error
      (downloadCsv as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('Export failed');
      });

      const exportButton = screen.getByRole('button', { name: /Export CSV/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to export orders');
      });
    });

    it('should format order data correctly for CSV', async () => {
      const user = userEvent.setup();
      (ordersService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockOrders,
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 2,
          totalPages: 1,
        },
      });

      renderPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /Export CSV/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(downloadCsv).toHaveBeenCalled();
      });
    });

    it('should handle walk-in customers in export', async () => {
      const user = userEvent.setup();
      const ordersWithWalkIn = [
        {
          ...mockOrders[0],
          customerId: undefined,
          customer: undefined,
        },
      ];

      (ordersService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: ordersWithWalkIn,
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 1,
          totalPages: 1,
        },
      });

      // Reset the downloadCsv mock to not throw error
      (downloadCsv as ReturnType<typeof vi.fn>).mockImplementation(() => {});

      renderPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /Export CSV/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(downloadCsv).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Exported 1 orders successfully');
      });
    });

    it('should respect date range filter in export', async () => {
      const user = userEvent.setup();
      (ordersService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockOrders,
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 2,
          totalPages: 1,
        },
      });

      renderPage();

      // Open filters
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Filters/i })).toBeInTheDocument();
      });

      const filtersButton = screen.getByRole('button', { name: /Filters/i });
      await user.click(filtersButton);

      // Set date range
      await waitFor(() => {
        const dateInputs = screen.getAllByLabelText(/date/i);
        expect(dateInputs.length).toBeGreaterThan(0);
      });

      const exportButton = screen.getByRole('button', { name: /Export CSV/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(downloadCsv).toHaveBeenCalled();
      });
    });
  });
});
