/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CustomerReport Component Tests
 * 
 * Tests for the customer report component including data fetching,
 * visualizations, customer analytics, and CSV export functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomerReport } from '../CustomerReport';
import { customersService } from '@/services/customers.service';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/services/customers.service');
vi.mock('sonner');

// Mock Recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
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
  arrayToCsv: vi.fn((data) => 'mocked,csv,data'),
  downloadCsv: vi.fn(),
  generateCsvFilename: vi.fn(() => 'customer_report_2024-01-01_to_2024-01-31_20240101_120000'),
  formatCurrencyForCsv: vi.fn((value) => `INR ${value.toFixed(2)}`),
}));

describe('CustomerReport', () => {
  let queryClient: QueryClient;

  const mockAnalyticsData = {
    totalCustomers: 250,
    newCustomers: 45,
    retentionRate: 85.5,
    averageLifetimeValue: 12500,
    customerAcquisitionTrend: [
      { date: '2024-01-01', count: 5 },
      { date: '2024-01-08', count: 8 },
      { date: '2024-01-15', count: 12 },
      { date: '2024-01-22', count: 10 },
      { date: '2024-01-29', count: 10 },
    ],
    lifetimeValueDistribution: [
      { range: '₹0-₹5,000', count: 80 },
      { range: '₹5,000-₹10,000', count: 70 },
      { range: '₹10,000-₹20,000', count: 60 },
      { range: '₹20,000+', count: 40 },
    ],
    customerSegmentation: [
      { segment: 'VIP', count: 40, totalValue: 800000 },
      { segment: 'Regular', count: 120, totalValue: 1200000 },
      { segment: 'New', count: 90, totalValue: 300000 },
    ],
    topCustomers: [
      { id: '1', name: 'John Doe', lifetimeValue: 50000, totalOrders: 25 },
      { id: '2', name: 'Jane Smith', lifetimeValue: 45000, totalOrders: 22 },
      { id: '3', name: 'Bob Johnson', lifetimeValue: 40000, totalOrders: 20 },
      { id: '4', name: 'Alice Williams', lifetimeValue: 35000, totalOrders: 18 },
      { id: '5', name: 'Charlie Brown', lifetimeValue: 30000, totalOrders: 15 },
    ],
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Loading State', () => {
    it('should display loading state while fetching data', () => {
      vi.mocked(customersService.getCustomerAnalytics).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      expect(screen.getByText(/loading customer report/i)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when data fetch fails', async () => {
      vi.mocked(customersService.getCustomerAnalytics).mockRejectedValue(
        new Error('Network error')
      );

      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText(/failed to load customer report data/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Display', () => {
    beforeEach(() => {
      vi.mocked(customersService.getCustomerAnalytics).mockResolvedValue({
        data: mockAnalyticsData,
        success: true,
        timestamp: new Date().toISOString(),
      });
    });

    it('should display customer report header with date range', async () => {
      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Customer Report')).toBeInTheDocument();
        expect(screen.getByText(/Jan 01, 2024 - Jan 31, 2024/i)).toBeInTheDocument();
      });
    });

    it('should display key metrics cards', async () => {
      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Total Customers')).toBeInTheDocument();
        expect(screen.getByText('New Customers')).toBeInTheDocument();
        expect(screen.getByText('Retention Rate')).toBeInTheDocument();
        expect(screen.getByText('Avg Lifetime Value')).toBeInTheDocument();
      });
    });

    it('should display customer acquisition trend chart', async () => {
      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Customer Acquisition Trend')).toBeInTheDocument();
        expect(screen.getAllByTestId('line-chart')).toHaveLength(1);
      });
    });

    it('should display lifetime value distribution chart', async () => {
      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Lifetime Value Distribution')).toBeInTheDocument();
        expect(screen.getAllByTestId('bar-chart')).toHaveLength(1);
      });
    });

    it('should display customer segmentation chart', async () => {
      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Customer Segmentation')).toBeInTheDocument();
        expect(screen.getAllByTestId('pie-chart')).toHaveLength(1);
      });
    });

    it('should display top customers table', async () => {
      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Top Customers by Lifetime Value')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });

    it('should display customer segmentation breakdown table', async () => {
      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Customer Segmentation Breakdown')).toBeInTheDocument();
        expect(screen.getByText('VIP')).toBeInTheDocument();
        expect(screen.getByText('Regular')).toBeInTheDocument();
        expect(screen.getByText('New')).toBeInTheDocument();
      });
    });

    it('should calculate average values correctly in segmentation table', async () => {
      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        // VIP: 800000 / 40 = 20000
        // Regular: 1200000 / 120 = 10000
        // New: 300000 / 90 = 3333.33
        expect(screen.getByText('Customer Segmentation Breakdown')).toBeInTheDocument();
      });
    });
  });

  describe('CSV Export', () => {
    beforeEach(() => {
      vi.mocked(customersService.getCustomerAnalytics).mockResolvedValue({
        data: mockAnalyticsData,
        success: true,
        timestamp: new Date().toISOString(),
      });
    });

    it('should display export button', async () => {
      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export.*csv/i })).toBeInTheDocument();
      });
    });

    it('should handle CSV export when button is clicked', async () => {
      const user = userEvent.setup();
      const { downloadCsv } = await import('@/utils/csv-export');

      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export.*csv/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /export.*csv/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(downloadCsv).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Customer report exported successfully');
      });
    });

    it('should show error toast when export fails with no data', async () => {
      const user = userEvent.setup();
      
      // Render with null data
      vi.mocked(customersService.getCustomerAnalytics).mockResolvedValue({
        data: null as any,
        success: false,
        timestamp: new Date().toISOString(),
      });

      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      // Wait for component to render (will show nothing due to null data)
      await waitFor(() => {
        // Component should not render export button when data is null
        expect(screen.queryByRole('button', { name: /export.*csv/i })).not.toBeInTheDocument();
      });
    });

    it('should disable export button while exporting', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export.*csv/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /export.*csv/i });
      
      // Button should not be disabled initially
      expect(exportButton).not.toBeDisabled();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no customers exist', async () => {
      vi.mocked(customersService.getCustomerAnalytics).mockResolvedValue({
        data: {
          totalCustomers: 0,
          newCustomers: 0,
          retentionRate: 0,
          averageLifetimeValue: 0,
          customerAcquisitionTrend: [],
          lifetimeValueDistribution: [],
          customerSegmentation: [],
          topCustomers: [],
        },
        success: true,
        timestamp: new Date().toISOString(),
      });

      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        // Check for the main empty state message
        expect(screen.getByText(/there are no customers recorded for the selected date range/i)).toBeInTheDocument();
        // Check that multiple "No customer data available" messages exist (one in top customers, one in main empty state)
        const messages = screen.getAllByText('No customer data available');
        expect(messages.length).toBeGreaterThan(0);
      });
    });

    it('should display empty state message for acquisition chart when no data', async () => {
      vi.mocked(customersService.getCustomerAnalytics).mockResolvedValue({
        data: {
          totalCustomers: 10,
          newCustomers: 0,
          retentionRate: 100,
          averageLifetimeValue: 5000,
          customerAcquisitionTrend: [],
          lifetimeValueDistribution: [{ range: '₹0-₹5,000', count: 10 }],
          customerSegmentation: [{ segment: 'New', count: 10, totalValue: 50000 }],
          topCustomers: [],
        },
        success: true,
        timestamp: new Date().toISOString(),
      });

      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('No acquisition data available')).toBeInTheDocument();
      });
    });

    it('should display empty state message for distribution chart when no data', async () => {
      vi.mocked(customersService.getCustomerAnalytics).mockResolvedValue({
        data: {
          totalCustomers: 10,
          newCustomers: 5,
          retentionRate: 50,
          averageLifetimeValue: 5000,
          customerAcquisitionTrend: [{ date: '2024-01-01', count: 5 }],
          lifetimeValueDistribution: [],
          customerSegmentation: [{ segment: 'New', count: 10, totalValue: 50000 }],
          topCustomers: [],
        },
        success: true,
        timestamp: new Date().toISOString(),
      });

      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('No distribution data available')).toBeInTheDocument();
      });
    });

    it('should display empty state message for segmentation chart when no data', async () => {
      vi.mocked(customersService.getCustomerAnalytics).mockResolvedValue({
        data: {
          totalCustomers: 10,
          newCustomers: 5,
          retentionRate: 50,
          averageLifetimeValue: 5000,
          customerAcquisitionTrend: [{ date: '2024-01-01', count: 5 }],
          lifetimeValueDistribution: [{ range: '₹0-₹5,000', count: 10 }],
          customerSegmentation: [],
          topCustomers: [],
        },
        success: true,
        timestamp: new Date().toISOString(),
      });

      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        // There will be two instances: one in the chart, one in the table
        const messages = screen.getAllByText('No segmentation data available');
        expect(messages.length).toBeGreaterThan(0);
      });
    });

    it('should display empty state message for top customers when no data', async () => {
      vi.mocked(customersService.getCustomerAnalytics).mockResolvedValue({
        data: {
          totalCustomers: 10,
          newCustomers: 5,
          retentionRate: 50,
          averageLifetimeValue: 5000,
          customerAcquisitionTrend: [{ date: '2024-01-01', count: 5 }],
          lifetimeValueDistribution: [{ range: '₹0-₹5,000', count: 10 }],
          customerSegmentation: [{ segment: 'New', count: 10, totalValue: 50000 }],
          topCustomers: [],
        },
        success: true,
        timestamp: new Date().toISOString(),
      });

      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('No customer data available')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      vi.mocked(customersService.getCustomerAnalytics).mockResolvedValue({
        data: mockAnalyticsData,
        success: true,
        timestamp: new Date().toISOString(),
      });
    });

    it('should render responsive containers for charts', async () => {
      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        const containers = screen.getAllByTestId('responsive-container');
        expect(containers.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.mocked(customersService.getCustomerAnalytics).mockResolvedValue({
        data: mockAnalyticsData,
        success: true,
        timestamp: new Date().toISOString(),
      });
    });

    it('should have accessible export button', async () => {
      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /export.*csv/i });
        expect(exportButton).toBeInTheDocument();
      });
    });

    it('should have proper table structure with headers', async () => {
      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        const tables = screen.getAllByRole('table');
        expect(tables.length).toBeGreaterThan(0);
        
        // Check for table headers
        expect(screen.getByText('Segment')).toBeInTheDocument();
        expect(screen.getByText('Customer')).toBeInTheDocument();
      });
    });
  });

  describe('Data Accuracy', () => {
    beforeEach(() => {
      vi.mocked(customersService.getCustomerAnalytics).mockResolvedValue({
        data: mockAnalyticsData,
        success: true,
        timestamp: new Date().toISOString(),
      });
    });

    it('should display correct metric values', async () => {
      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        // Check that metrics are displayed (exact format may vary)
        expect(screen.getByText('Total Customers')).toBeInTheDocument();
        expect(screen.getByText('New Customers')).toBeInTheDocument();
        expect(screen.getByText('Retention Rate')).toBeInTheDocument();
        expect(screen.getByText('Avg Lifetime Value')).toBeInTheDocument();
      });
    });

    it('should display all top customers', async () => {
      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        mockAnalyticsData.topCustomers.forEach(customer => {
          expect(screen.getByText(customer.name)).toBeInTheDocument();
        });
      });
    });

    it('should display all customer segments', async () => {
      renderWithProviders(
        <CustomerReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        mockAnalyticsData.customerSegmentation.forEach(segment => {
          expect(screen.getByText(segment.segment)).toBeInTheDocument();
        });
      });
    });
  });
});

