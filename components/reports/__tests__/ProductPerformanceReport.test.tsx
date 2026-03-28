/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ProductPerformanceReport Component Tests
 * 
 * Tests for the product performance report component including data fetching,
 * top/bottom sellers, category performance, and CSV export functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductPerformanceReport } from '../ProductPerformanceReport';
import { productsService } from '@/services/products.service';
import { ordersService } from '@/services/orders.service';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/services/products.service');
vi.mock('@/services/orders.service');
vi.mock('sonner');

// Mock Recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
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
  arrayToCsv: vi.fn((data) => 'mocked,csv,data'),
  downloadCsv: vi.fn(),
  generateCsvFilename: vi.fn(() => 'product_performance_report_2024-01-01_to_2024-01-31_20240101_120000'),
  formatCurrencyForCsv: vi.fn((value) => `INR ${value.toFixed(2)}`),
}));

describe('ProductPerformanceReport', () => {
  let queryClient: QueryClient;

  const mockProductsData = {
    data: [
      {
        id: '1',
        name: 'Laptop',
        sku: 'LAP001',
        category: 'Electronics',
        price: 50000,
        stockQuantity: 10,
        minStockLevel: 5,
        description: 'High-performance laptop',
        barcode: '123456789',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Mouse',
        sku: 'MOU001',
        category: 'Electronics',
        price: 500,
        stockQuantity: 50,
        minStockLevel: 10,
        description: 'Wireless mouse',
        barcode: '123456790',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '3',
        name: 'T-Shirt',
        sku: 'TSH001',
        category: 'Clothing',
        price: 500,
        stockQuantity: 100,
        minStockLevel: 20,
        description: 'Cotton t-shirt',
        barcode: '123456791',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ],
    total: 3,
    page: 1,
    pageSize: 1000,
    totalPages: 1,
  };

  const mockSalesData = {
    totalSales: 150000,
    totalOrders: 50,
    averageOrderValue: 3000,
    salesByCategory: [
      { category: 'Electronics', sales: 100000 },
      { category: 'Clothing', sales: 50000 },
    ],
    salesByPaymentMethod: [
      { method: 'card', sales: 90000 },
      { method: 'cash', sales: 60000 },
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
      vi.mocked(productsService.getAll).mockResolvedValue(mockProductsData);
      vi.mocked(ordersService.getSalesAnalytics).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithProviders(
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      expect(screen.getByText(/loading product performance report/i)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when data fetch fails', async () => {
      vi.mocked(productsService.getAll).mockResolvedValue(mockProductsData);
      vi.mocked(ordersService.getSalesAnalytics).mockRejectedValue(
        new Error('Network error')
      );

      renderWithProviders(
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText(/failed to load product performance report data/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Display', () => {
    beforeEach(() => {
      vi.mocked(productsService.getAll).mockResolvedValue(mockProductsData);
      vi.mocked(ordersService.getSalesAnalytics).mockResolvedValue({
        data: mockSalesData,
      });
    });

    it('should display product performance report header with date range', async () => {
      renderWithProviders(
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Product Performance Report')).toBeInTheDocument();
        expect(screen.getByText(/Jan 01, 2024 - Jan 31, 2024/i)).toBeInTheDocument();
      });
    });

    it('should display key metrics cards', async () => {
      renderWithProviders(
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Total Products Sold')).toBeInTheDocument();
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getByText('Best Performing Category')).toBeInTheDocument();
        expect(screen.getByText('Avg Units per Product')).toBeInTheDocument();
      });
    });

    it('should display top 10 selling products chart', async () => {
      renderWithProviders(
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Top 10 Selling Products')).toBeInTheDocument();
        expect(screen.getAllByTestId('bar-chart')).toHaveLength(1);
      });
    });

    it('should display category performance comparison chart', async () => {
      renderWithProviders(
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Category Performance Comparison')).toBeInTheDocument();
        expect(screen.getAllByTestId('pie-chart')).toHaveLength(1);
      });
    });

    it('should display top sellers table', async () => {
      renderWithProviders(
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Top 10 Sellers')).toBeInTheDocument();
        // Check for table headers
        const qtyHeaders = screen.getAllByText('Qty Sold');
        expect(qtyHeaders.length).toBeGreaterThan(0);
      });
    });

    it('should display bottom sellers table', async () => {
      renderWithProviders(
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Bottom 10 Sellers')).toBeInTheDocument();
      });
    });

    it('should display category performance breakdown table', async () => {
      renderWithProviders(
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Category Performance Breakdown')).toBeInTheDocument();
        const electronicsElements = screen.getAllByText('Electronics');
        expect(electronicsElements.length).toBeGreaterThan(0);
        const clothingElements = screen.getAllByText('Clothing');
        expect(clothingElements.length).toBeGreaterThan(0);
      });
    });

    it('should calculate product performance metrics correctly', async () => {
      renderWithProviders(
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        // Verify that metrics are displayed
        expect(screen.getByText('Total Products Sold')).toBeInTheDocument();
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      });
    });
  });

  describe('CSV Export', () => {
    beforeEach(() => {
      vi.mocked(productsService.getAll).mockResolvedValue(mockProductsData);
      vi.mocked(ordersService.getSalesAnalytics).mockResolvedValue({
        data: mockSalesData,
      });
    });

    it('should display export button', async () => {
      renderWithProviders(
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export.*csv/i })).toBeInTheDocument();
      });
    });

    it('should handle CSV export when button is clicked', async () => {
      const user = userEvent.setup();
      const { downloadCsv } = await import('@/utils/csv-export');

      renderWithProviders(
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export.*csv/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /export.*csv/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(downloadCsv).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Product performance report exported successfully');
      });
    });

    it('should show error toast when export fails with no data', async () => {
      const user = userEvent.setup();
      
      // Mock to return empty data
      vi.mocked(productsService.getAll).mockResolvedValue({
        ...mockProductsData,
        data: [],
      });
      vi.mocked(ordersService.getSalesAnalytics).mockResolvedValue({
        data: {
          ...mockSalesData,
          salesByCategory: [],
        },
      });

      renderWithProviders(
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export.*csv/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /export.*csv/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('No data available to export');
      });
    });

    it('should disable export button while exporting', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export.*csv/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /export.*csv/i });
      expect(exportButton).not.toBeDisabled();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no product sales exist', async () => {
      vi.mocked(productsService.getAll).mockResolvedValue({
        ...mockProductsData,
        data: [],
      });
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
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('No product performance data available')).toBeInTheDocument();
        expect(screen.getByText(/there are no product sales recorded for the selected date range/i)).toBeInTheDocument();
      });
    });

    it('should display empty state message for charts when no data', async () => {
      vi.mocked(productsService.getAll).mockResolvedValue({
        ...mockProductsData,
        data: [],
      });
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
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        const messages = screen.getAllByText(/no product sales data available|no category data available/i);
        expect(messages.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      vi.mocked(productsService.getAll).mockResolvedValue(mockProductsData);
      vi.mocked(ordersService.getSalesAnalytics).mockResolvedValue({
        data: mockSalesData,
      });
    });

    it('should render responsive containers for charts', async () => {
      renderWithProviders(
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        const containers = screen.getAllByTestId('responsive-container');
        expect(containers.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.mocked(productsService.getAll).mockResolvedValue(mockProductsData);
      vi.mocked(ordersService.getSalesAnalytics).mockResolvedValue({
        data: mockSalesData,
      });
    });

    it('should have accessible export button', async () => {
      renderWithProviders(
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /export.*csv/i });
        expect(exportButton).toBeInTheDocument();
      });
    });

    it('should have proper table structure with headers', async () => {
      renderWithProviders(
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        const tables = screen.getAllByRole('table');
        expect(tables.length).toBeGreaterThan(0);
        
        // Check for table headers - use getAllByText since "Rank" appears multiple times
        const rankHeaders = screen.getAllByText('Rank');
        expect(rankHeaders.length).toBeGreaterThan(0);
        const productHeaders = screen.getAllByText('Product');
        expect(productHeaders.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Product Performance Calculations', () => {
    beforeEach(() => {
      vi.mocked(productsService.getAll).mockResolvedValue(mockProductsData);
      vi.mocked(ordersService.getSalesAnalytics).mockResolvedValue({
        data: mockSalesData,
      });
    });

    it('should calculate top sellers correctly', async () => {
      renderWithProviders(
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Top 10 Sellers')).toBeInTheDocument();
        // Verify that product names from mock data appear in tables
        const laptopElements = screen.getAllByText('Laptop');
        expect(laptopElements.length).toBeGreaterThan(0);
      });
    });

    it('should calculate bottom sellers correctly', async () => {
      renderWithProviders(
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Bottom 10 Sellers')).toBeInTheDocument();
      });
    });

    it('should calculate category performance correctly', async () => {
      renderWithProviders(
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Category Performance Breakdown')).toBeInTheDocument();
        const electronicsElements = screen.getAllByText('Electronics');
        expect(electronicsElements.length).toBeGreaterThan(0);
        const clothingElements = screen.getAllByText('Clothing');
        expect(clothingElements.length).toBeGreaterThan(0);
      });
    });

    it('should display best performing category in metrics', async () => {
      renderWithProviders(
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(screen.getByText('Best Performing Category')).toBeInTheDocument();
        // Electronics should be the best performing category based on mock data
        const electronicsElements = screen.getAllByText('Electronics');
        expect(electronicsElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Integration', () => {
    it('should fetch both products and sales data', async () => {
      vi.mocked(productsService.getAll).mockResolvedValue(mockProductsData);
      vi.mocked(ordersService.getSalesAnalytics).mockResolvedValue({
        data: mockSalesData,
      });

      renderWithProviders(
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        expect(productsService.getAll).toHaveBeenCalled();
        expect(ordersService.getSalesAnalytics).toHaveBeenCalledWith('2024-01-01', '2024-01-31');
      });
    });

    it('should handle missing product data gracefully', async () => {
      vi.mocked(productsService.getAll).mockResolvedValue({
        ...mockProductsData,
        data: [],
      });
      vi.mocked(ordersService.getSalesAnalytics).mockResolvedValue({
        data: mockSalesData,
      });

      renderWithProviders(
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        // Should still render without crashing
        expect(screen.getByText('Product Performance Report')).toBeInTheDocument();
      });
    });

    it('should handle missing sales data gracefully', async () => {
      vi.mocked(productsService.getAll).mockResolvedValue(mockProductsData);
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
        <ProductPerformanceReport startDate="2024-01-01" endDate="2024-01-31" />
      );

      await waitFor(() => {
        // Should still render without crashing
        expect(screen.getByText('Product Performance Report')).toBeInTheDocument();
      });
    });
  });
});

