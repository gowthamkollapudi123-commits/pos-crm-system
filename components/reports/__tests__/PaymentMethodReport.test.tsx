/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * PaymentMethodReport Component Tests
 *
 * Tests for the payment method report component including data fetching,
 * transaction distribution, revenue comparison, trends, and CSV export.
 *
 * Validates: Requirements 12.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaymentMethodReport } from '../PaymentMethodReport';
import { ordersService } from '@/services/orders.service';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/services/orders.service');
vi.mock('sonner');

// Mock Recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ children }: any) => <div data-testid="bar">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

// Mock CSV export utilities
vi.mock('@/utils/csv-export', () => ({
  arrayToCsv: vi.fn(() => 'mocked,csv,data'),
  downloadCsv: vi.fn(),
  generateCsvFilename: vi.fn(
    () => 'payment_method_report_2024-01-01_to_2024-01-31_20240101_120000'
  ),
  formatCurrencyForCsv: vi.fn((value: number) => `INR ${value.toFixed(2)}`),
}));

const mockSalesData = {
  totalSales: 150000,
  totalOrders: 60,
  averageOrderValue: 2500,
  salesByCategory: [
    { category: 'Electronics', sales: 100000 },
    { category: 'Clothing', sales: 50000 },
  ],
  salesByPaymentMethod: [
    { method: 'card', sales: 90000 },
    { method: 'cash', sales: 45000 },
    { method: 'upi', sales: 15000 },
  ],
};

describe('PaymentMethodReport', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) =>
    render(
      <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
    );

  // ─── Loading State ────────────────────────────────────────────────────────

  describe('Loading State', () => {
    it('should display loading spinner while fetching data', () => {
      vi.mocked(ordersService.getSalesAnalytics).mockImplementation(
        () => new Promise(() => {}) // never resolves
      );

      renderWithProviders(
        <PaymentMethodReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      expect(
        screen.getByText(/loading payment method report/i)
      ).toBeInTheDocument();
    });
  });

  // ─── Error State ──────────────────────────────────────────────────────────

  describe('Error State', () => {
    it('should display error message when data fetch fails', async () => {
      vi.mocked(ordersService.getSalesAnalytics).mockRejectedValue(
        new Error('Network error')
      );

      renderWithProviders(
        <PaymentMethodReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/failed to load payment method report data/i)
        ).toBeInTheDocument();
      });
    });
  });

  // ─── Data Display ─────────────────────────────────────────────────────────

  describe('Data Display', () => {
    beforeEach(() => {
      vi.mocked(ordersService.getSalesAnalytics).mockResolvedValue({
        data: mockSalesData,
      });
    });

    it('should display report header with date range', async () => {
      renderWithProviders(
        <PaymentMethodReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Payment Method Report')).toBeInTheDocument();
        expect(screen.getByText(/Jan 01, 2024 - Jan 31, 2024/i)).toBeInTheDocument();
      });
    });

    it('should display all four key metric cards', async () => {
      renderWithProviders(
        <PaymentMethodReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Total Transactions')).toBeInTheDocument();
        expect(screen.getByText('Most Used Method')).toBeInTheDocument();
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getByText('Avg Transaction Value')).toBeInTheDocument();
      });
    });

    it('should show the most used payment method (highest revenue)', async () => {
      renderWithProviders(
        <PaymentMethodReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        // CARD has the highest revenue (90000) so it should be the most used
        const cardElements = screen.getAllByText('CARD');
        expect(cardElements.length).toBeGreaterThan(0);
      });
    });

    it('should render transaction distribution pie chart', async () => {
      renderWithProviders(
        <PaymentMethodReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(
          screen.getByText('Transaction Distribution by Payment Method')
        ).toBeInTheDocument();
        expect(screen.getAllByTestId('pie-chart').length).toBeGreaterThan(0);
      });
    });

    it('should render revenue comparison bar chart', async () => {
      renderWithProviders(
        <PaymentMethodReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(
          screen.getByText('Payment Method Revenue Comparison')
        ).toBeInTheDocument();
        expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);
      });
    });

    it('should render payment trends line chart', async () => {
      renderWithProviders(
        <PaymentMethodReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Payment Trends Over Time')).toBeInTheDocument();
        expect(screen.getAllByTestId('line-chart').length).toBeGreaterThan(0);
      });
    });

    it('should display detailed breakdown table with all payment methods', async () => {
      renderWithProviders(
        <PaymentMethodReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Payment Method Breakdown')).toBeInTheDocument();
        expect(screen.getAllByText('CARD').length).toBeGreaterThan(0);
        expect(screen.getAllByText('CASH').length).toBeGreaterThan(0);
        expect(screen.getAllByText('UPI').length).toBeGreaterThan(0);
      });
    });

    it('should display table column headers', async () => {
      renderWithProviders(
        <PaymentMethodReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeInTheDocument();
        expect(screen.getByText('Transactions')).toBeInTheDocument();
        expect(screen.getByText('Revenue')).toBeInTheDocument();
        expect(screen.getByText('% of Total')).toBeInTheDocument();
        expect(screen.getByText('Avg Transaction')).toBeInTheDocument();
      });
    });

    it('should display a totals row in the breakdown table', async () => {
      renderWithProviders(
        <PaymentMethodReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Total')).toBeInTheDocument();
        expect(screen.getByText('100%')).toBeInTheDocument();
      });
    });
  });

  // ─── CSV Export ───────────────────────────────────────────────────────────

  describe('CSV Export', () => {
    beforeEach(() => {
      vi.mocked(ordersService.getSalesAnalytics).mockResolvedValue({
        data: mockSalesData,
      });
    });

    it('should display the export button', async () => {
      renderWithProviders(
        <PaymentMethodReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /export.*csv/i })
        ).toBeInTheDocument();
      });
    });

    it('should trigger CSV download when export button is clicked', async () => {
      const user = userEvent.setup();
      const { downloadCsv } = await import('@/utils/csv-export');

      renderWithProviders(
        <PaymentMethodReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /export.*csv/i })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /export.*csv/i }));

      await waitFor(() => {
        expect(downloadCsv).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith(
          'Payment method report exported successfully'
        );
      });
    });

    it('should show error toast when there is no data to export', async () => {
      const user = userEvent.setup();

      vi.mocked(ordersService.getSalesAnalytics).mockResolvedValue({
        data: {
          ...mockSalesData,
          salesByPaymentMethod: [],
          totalOrders: 0,
          totalSales: 0,
        },
      });

      renderWithProviders(
        <PaymentMethodReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /export.*csv/i })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /export.*csv/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('No data available to export');
      });
    });
  });

  // ─── Empty State ──────────────────────────────────────────────────────────

  describe('Empty State', () => {
    it('should display empty state when there are no transactions', async () => {
      vi.mocked(ordersService.getSalesAnalytics).mockResolvedValue({
        data: {
          totalSales: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          salesByCategory: [],
          salesByPaymentMethod: [],
        },
      });

      renderWithProviders(
        <PaymentMethodReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('No payment data available')).toBeInTheDocument();
        expect(
          screen.getByText(
            /there are no transactions recorded for the selected date range/i
          )
        ).toBeInTheDocument();
      });
    });

    it('should show empty chart messages when no payment method data', async () => {
      vi.mocked(ordersService.getSalesAnalytics).mockResolvedValue({
        data: {
          totalSales: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          salesByCategory: [],
          salesByPaymentMethod: [],
        },
      });

      renderWithProviders(
        <PaymentMethodReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        const noDataMessages = screen.getAllByText(/no payment method data available|no revenue data available|no trend data available/i);
        expect(noDataMessages.length).toBeGreaterThan(0);
      });
    });
  });

  // ─── Responsive Design ────────────────────────────────────────────────────

  describe('Responsive Design', () => {
    beforeEach(() => {
      vi.mocked(ordersService.getSalesAnalytics).mockResolvedValue({
        data: mockSalesData,
      });
    });

    it('should render responsive containers for all charts', async () => {
      renderWithProviders(
        <PaymentMethodReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        const containers = screen.getAllByTestId('responsive-container');
        expect(containers.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  // ─── Accessibility ────────────────────────────────────────────────────────

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.mocked(ordersService.getSalesAnalytics).mockResolvedValue({
        data: mockSalesData,
      });
    });

    it('should have an accessible export button', async () => {
      renderWithProviders(
        <PaymentMethodReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /export.*csv/i });
        expect(btn).toBeInTheDocument();
      });
    });

    it('should render a table with proper structure', async () => {
      renderWithProviders(
        <PaymentMethodReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        const tables = screen.getAllByRole('table');
        expect(tables.length).toBeGreaterThan(0);
      });
    });
  });

  // ─── Data Integration ─────────────────────────────────────────────────────

  describe('Data Integration', () => {
    it('should call getSalesAnalytics with the correct date range', async () => {
      vi.mocked(ordersService.getSalesAnalytics).mockResolvedValue({
        data: mockSalesData,
      });

      renderWithProviders(
        <PaymentMethodReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(ordersService.getSalesAnalytics).toHaveBeenCalledWith(
          '2024-01-01',
          '2024-01-31'
        );
      });
    });

    it('should calculate percentage shares correctly', async () => {
      vi.mocked(ordersService.getSalesAnalytics).mockResolvedValue({
        data: mockSalesData,
      });

      renderWithProviders(
        <PaymentMethodReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        // CARD = 90000/150000 = 60%
        expect(screen.getByText('60.0%')).toBeInTheDocument();
      });
    });

    it('should handle a single payment method gracefully', async () => {
      vi.mocked(ordersService.getSalesAnalytics).mockResolvedValue({
        data: {
          ...mockSalesData,
          salesByPaymentMethod: [{ method: 'cash', sales: 150000 }],
        },
      });

      renderWithProviders(
        <PaymentMethodReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Payment Method Report')).toBeInTheDocument();
        expect(screen.getAllByText('CASH').length).toBeGreaterThan(0);
      });
    });
  });
});

