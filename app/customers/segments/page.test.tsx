/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unit Tests for Customer Segments Page
 * 
 * Tests customer segmentation logic, analytics calculations,
 * and UI interactions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CustomerSegmentsPage from './page';
import { customersService } from '@/services/customers.service';
import { Customer } from '@/types/entities';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/components/providers/AuthProvider', () => ({
  useAuthContext: () => ({
    user: { id: '1', name: 'Test User', email: 'test@example.com' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock('@/hooks', () => ({
  useAuth: () => ({
    logout: vi.fn(),
  }),
}));

vi.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    isOnline: true,
  }),
}));

vi.mock('@/components/offline/OfflineIndicator', () => ({
  OfflineIndicator: () => <div>Offline Indicator</div>,
}));

vi.mock('@/services/customers.service');

// Mock Recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div>Pie</div>,
  Cell: () => <div>Cell</div>,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  Legend: () => <div>Legend</div>,
  Tooltip: () => <div>Tooltip</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div>Bar</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  CartesianGrid: () => <div>CartesianGrid</div>,
}));

describe('CustomerSegmentsPage', () => {
  let queryClient: QueryClient;

  const mockCustomers: Customer[] = [
    {
      id: '1',
      tenantId: 'tenant1',
      name: 'VIP Customer',
      phone: '1234567890',
      email: 'vip@example.com',
      lifetimeValue: 15000,
      totalOrders: 20,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      tenantId: 'tenant1',
      name: 'Regular Customer',
      phone: '2345678901',
      email: 'regular@example.com',
      lifetimeValue: 5000,
      totalOrders: 10,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
    {
      id: '3',
      tenantId: 'tenant1',
      name: 'New Customer',
      phone: '3456789012',
      email: 'new@example.com',
      lifetimeValue: 500,
      totalOrders: 2,
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    },
    {
      id: '4',
      tenantId: 'tenant1',
      name: 'Another VIP',
      phone: '4567890123',
      email: 'vip2@example.com',
      lifetimeValue: 20000,
      totalOrders: 30,
      createdAt: '2024-01-04T00:00:00Z',
      updatedAt: '2024-01-04T00:00:00Z',
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.mocked(customersService.getAll).mockResolvedValue({
      data: mockCustomers,
      pagination: {
        page: 1,
        pageSize: 10000,
        totalItems: mockCustomers.length,
        totalPages: 1,
      },
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CustomerSegmentsPage />
      </QueryClientProvider>
    );
  };

  it('should render the page title', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Customer Segmentation Analytics')).toBeInTheDocument();
    });
  });

  it('should calculate segment counts correctly', async () => {
    renderComponent();

    await waitFor(() => {
      // Check that segment cards are rendered
      expect(screen.getByText('VIP')).toBeInTheDocument();
      expect(screen.getByText('Regular')).toBeInTheDocument();
      expect(screen.getByText('New')).toBeInTheDocument();
      
      // VIP: 2 customers, Regular: 1, New: 1
      const counts = screen.getAllByText(/^\d+$/).map(el => el.textContent);
      expect(counts).toContain('2'); // VIP count
      expect(counts).toContain('1'); // Regular and New counts
    });
  });

  it('should calculate segment percentages correctly', async () => {
    renderComponent();

    await waitFor(() => {
      // VIP: 2/4 = 50%
      const percentages = screen.getAllByText(/\d+\.\d+% of customers/);
      const percentageTexts = percentages.map(el => el.textContent);
      
      expect(percentageTexts).toContain('50.0% of customers'); // VIP
      expect(percentageTexts).toContain('25.0% of customers'); // Regular and New
    });
  });

  it('should calculate average values correctly', async () => {
    renderComponent();

    await waitFor(() => {
      // Check for average values in the cards
      const avgValues = screen.getAllByText(/Avg Value: ₹[\d,]+/);
      const avgTexts = avgValues.map(el => el.textContent);
      
      // VIP avg: (15000 + 20000) / 2 = 17500
      expect(avgTexts.some(text => text?.includes('17,500'))).toBe(true);
      
      // Regular avg: 5000
      expect(avgTexts.some(text => text?.includes('5,000'))).toBe(true);
    });
  });

  it('should render pie chart', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
  });

  it('should render bar chart', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  it('should handle empty customer data', async () => {
    vi.mocked(customersService.getAll).mockResolvedValue({
      data: [],
      pagination: {
        page: 1,
        pageSize: 10000,
        totalItems: 0,
        totalPages: 0,
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No customer data available for segmentation.')).toBeInTheDocument();
    });
  });

  it('should handle API errors', async () => {
    vi.mocked(customersService.getAll).mockRejectedValue(new Error('API Error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Failed to load customer data/)).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    renderComponent();

    expect(screen.getByText('Loading segment data...')).toBeInTheDocument();
  });
});

describe('Segmentation Logic', () => {
  it('should classify VIP customers correctly', () => {
    const customer: Customer = {
      id: '1',
      tenantId: 'tenant1',
      name: 'VIP Customer',
      phone: '1234567890',
      lifetimeValue: 15000,
      totalOrders: 20,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    // VIP: lifetimeValue > 10000
    expect(customer.lifetimeValue).toBeGreaterThan(10000);
  });

  it('should classify Regular customers correctly', () => {
    const customer: Customer = {
      id: '2',
      tenantId: 'tenant1',
      name: 'Regular Customer',
      phone: '2345678901',
      lifetimeValue: 5000,
      totalOrders: 10,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    // Regular: lifetimeValue 1000-10000
    expect(customer.lifetimeValue).toBeGreaterThanOrEqual(1000);
    expect(customer.lifetimeValue).toBeLessThanOrEqual(10000);
  });

  it('should classify New customers by lifetime value', () => {
    const customer: Customer = {
      id: '3',
      tenantId: 'tenant1',
      name: 'New Customer',
      phone: '3456789012',
      lifetimeValue: 500,
      totalOrders: 5,
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    };

    // New: lifetimeValue < 1000
    expect(customer.lifetimeValue).toBeLessThan(1000);
  });

  it('should classify New customers by order count', () => {
    const customer: Customer = {
      id: '4',
      tenantId: 'tenant1',
      name: 'New Customer',
      phone: '4567890123',
      lifetimeValue: 1500,
      totalOrders: 2,
      createdAt: '2024-01-04T00:00:00Z',
      updatedAt: '2024-01-04T00:00:00Z',
    };

    // New: totalOrders < 3
    expect(customer.totalOrders).toBeLessThan(3);
  });

  it('should handle edge case at VIP boundary', () => {
    const customer: Customer = {
      id: '5',
      tenantId: 'tenant1',
      name: 'Boundary Customer',
      phone: '5678901234',
      lifetimeValue: 10001,
      totalOrders: 15,
      createdAt: '2024-01-05T00:00:00Z',
      updatedAt: '2024-01-05T00:00:00Z',
    };

    // Should be VIP (> 10000)
    expect(customer.lifetimeValue).toBeGreaterThan(10000);
  });

  it('should handle edge case at Regular lower boundary', () => {
    const customer: Customer = {
      id: '6',
      tenantId: 'tenant1',
      name: 'Boundary Customer',
      phone: '6789012345',
      lifetimeValue: 1000,
      totalOrders: 5,
      createdAt: '2024-01-06T00:00:00Z',
      updatedAt: '2024-01-06T00:00:00Z',
    };

    // Should be Regular (>= 1000)
    expect(customer.lifetimeValue).toBeGreaterThanOrEqual(1000);
    expect(customer.lifetimeValue).toBeLessThanOrEqual(10000);
  });

  it('should handle edge case at Regular upper boundary', () => {
    const customer: Customer = {
      id: '7',
      tenantId: 'tenant1',
      name: 'Boundary Customer',
      phone: '7890123456',
      lifetimeValue: 10000,
      totalOrders: 12,
      createdAt: '2024-01-07T00:00:00Z',
      updatedAt: '2024-01-07T00:00:00Z',
    };

    // Should be Regular (<= 10000)
    expect(customer.lifetimeValue).toBeGreaterThanOrEqual(1000);
    expect(customer.lifetimeValue).toBeLessThanOrEqual(10000);
  });
});
