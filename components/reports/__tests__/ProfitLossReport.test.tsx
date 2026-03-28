/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ProfitLossReport Component Tests
 *
 * Tests for the P&L report component including data fetching,
 * metric calculations, chart rendering, and CSV export.
 *
 * Requirements: 12.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfitLossReport } from '../ProfitLossReport';
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
    () => 'profit_loss_report_2024-01-01_to_2024-01-31_20240101_120000'
  ),
  formatCurrencyForCsv: vi.fn((value: number) => `INR ${value.toFixed(2)}`),
}));

const mockSalesData = {
  success: true as const,
  timestamp: '2024-01-31T00:00:00Z',
  data: {
    totalSales: 200000,
    totalOrders: 80,
    averageOrderValue: 2500,
    salesByCategory: [
      { category: 'Electronics', sales: 120000 },
      { category: 'Clothing', sales: 80000 },
    ],
    salesByPaymentMethod: [
      { method: 'card', sales: 140000 },
      { method: 'cash', sales: 60000 },
    ],
  },
};

describe('ProfitLossReport', () => {
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
        () => new Promise(() => {})
      );

      renderWithProviders(
        <ProfitLossReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      expect(
        screen.getByText(/loading profit & loss report/i)
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
        <ProfitLossReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/failed to load profit & loss report data/i)
        ).toBeInTheDocument();
      });
    });
  });

  // ─── Data Display ─────────────────────────────────────────────────────────

  describe('Data Display', () => {
    beforeEach(() => {
      vi.mocked(ordersService.getSalesAnalytics).mockResolvedValue(mockSalesData);
    });

    it('should display the report header with date range', async () => {
      renderWithProviders(
        <ProfitLossReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Profit & Loss Report')).toBeInTheDocument();
        expect(screen.getByText(/Jan 01, 2024 - Jan 31, 2024/i)).toBeInTheDocument();
      });
    });

    it('should display the estimation disclaimer', async () => {
      renderWithProviders(
        <ProfitLossReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText(/estimated values/i)).toBeInTheDocument();
        // "60%" appears in multiple places; just verify the disclaimer text is present
        expect(
          screen.getByText(/COGS is estimated at 60% of revenue/i)
        ).toBeInTheDocument();
      });
    });

    it('should display all four key metric cards', async () => {
      renderWithProviders(
        <ProfitLossReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        // These labels appear in metric cards (and some also in the table)
        expect(screen.getAllByText('Total Revenue').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('COGS (est.)')).toBeInTheDocument();
        expect(screen.getAllByText('Gross Profit').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Net Profit (est.)')).toBeInTheDocument();
      });
    });

    it('should calculate COGS as 60% of revenue', async () => {
      renderWithProviders(
        <ProfitLossReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        // COGS = 200000 * 0.6 = 120000
        // Gross Profit = 200000 - 120000 = 80000
        // Gross Margin = 80000 / 200000 * 100 = 40%
        const elements = screen.getAllByText(/40\.0%/);
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it('should calculate net profit correctly', async () => {
      renderWithProviders(
        <ProfitLossReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        // Net Profit = 80000 - (200000 * 0.15) = 80000 - 30000 = 50000
        // Net Margin = 50000 / 200000 * 100 = 25%
        const elements = screen.getAllByText(/25\.0%/);
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it('should render the P&L overview bar chart', async () => {
      renderWithProviders(
        <ProfitLossReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('P&L Overview')).toBeInTheDocument();
        expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);
      });
    });

    it('should render the profit margin trend line chart', async () => {
      renderWithProviders(
        <ProfitLossReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Profit Margin Trend')).toBeInTheDocument();
        expect(screen.getAllByTestId('line-chart').length).toBeGreaterThan(0);
      });
    });

    it('should render the P&L summary table', async () => {
      renderWithProviders(
        <ProfitLossReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('P&L Summary')).toBeInTheDocument();
        // "Total Revenue" appears in both the metric card and the table
        const totalRevenueElements = screen.getAllByText('Total Revenue');
        expect(totalRevenueElements.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Cost of Goods Sold (COGS)')).toBeInTheDocument();
        // "Gross Profit" appears in both the metric card and the table
        const grossProfitElements = screen.getAllByText('Gross Profit');
        expect(grossProfitElements.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Operating Expenses')).toBeInTheDocument();
        expect(screen.getByText('Net Profit')).toBeInTheDocument();
      });
    });

    it('should show "Estimated" labels in the summary table', async () => {
      renderWithProviders(
        <ProfitLossReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        const estimatedLabels = screen.getAllByText('Estimated');
        expect(estimatedLabels.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should render responsive containers for charts', async () => {
      renderWithProviders(
        <ProfitLossReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        const containers = screen.getAllByTestId('responsive-container');
        expect(containers.length).toBeGreaterThan(0);
      });
    });
  });

  // ─── Empty State ──────────────────────────────────────────────────────────

  describe('Empty State', () => {
    it('should display empty state when no orders exist', async () => {
      vi.mocked(ordersService.getSalesAnalytics).mockResolvedValue({
        success: true,
        timestamp: '2024-01-31T00:00:00Z',
        data: {
          totalSales: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          salesByCategory: [],
          salesByPaymentMethod: [],
        },
      });

      renderWithProviders(
        <ProfitLossReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('No revenue data available')).toBeInTheDocument();
        expect(
          screen.getByText(/there are no sales recorded for the selected date range/i)
        ).toBeInTheDocument();
      });
    });
  });

  // ─── CSV Export ───────────────────────────────────────────────────────────

  describe('CSV Export', () => {
    beforeEach(() => {
      vi.mocked(ordersService.getSalesAnalytics).mockResolvedValue(mockSalesData);
    });

    it('should display the export button', async () => {
      renderWithProviders(
        <ProfitLossReport startDate="2024-01-01" endDate="2024-01-31" />
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
        <ProfitLossReport startDate="2024-01-01" endDate="2024-01-31" />
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
          'Profit & Loss report exported successfully'
        );
      });
    });
  });

  // ─── Accessibility ────────────────────────────────────────────────────────

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.mocked(ordersService.getSalesAnalytics).mockResolvedValue(mockSalesData);
    });

    it('should have an accessible export button', async () => {
      renderWithProviders(
        <ProfitLossReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /export.*csv/i });
        expect(btn).toBeInTheDocument();
      });
    });

    it('should have a proper table structure with column headers', async () => {
      renderWithProviders(
        <ProfitLossReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        const tables = screen.getAllByRole('table');
        expect(tables.length).toBeGreaterThan(0);
        expect(screen.getByText('Line Item')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
        expect(screen.getByText('% of Revenue')).toBeInTheDocument();
      });
    });
  });
});

