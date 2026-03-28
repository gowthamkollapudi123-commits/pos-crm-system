/**
 * Customer List Page Tests
 * 
 * Tests for customer list view functionality including:
 * - Rendering customer list
 * - Search functionality
 * - Filter functionality
 * - Pagination
 * - Responsive layout
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CustomersPage from '../page';
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
    user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'Admin' },
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

// Mock customer data
const mockCustomers: Customer[] = [
  {
    id: '1',
    tenantId: 'tenant1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    lifetimeValue: 5000,
    totalOrders: 10,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    tenantId: 'tenant1',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1234567891',
    lifetimeValue: 3000,
    totalOrders: 5,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

describe('CustomersPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock the customers service
    vi.mocked(customersService.getAll).mockResolvedValue({
      success: true,
      data: mockCustomers,
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 2,
        totalPages: 1,
      },
      timestamp: new Date().toISOString(),
    });
  });

  const renderPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CustomersPage />
      </QueryClientProvider>
    );
  };

  it('renders customer list page with header', async () => {
    renderPage();

    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('Customer Management')).toBeInTheDocument();
    expect(screen.getByText('Add Customer')).toBeInTheDocument();
  });

  it('displays customer data in table', async () => {
    renderPage();

    await waitFor(() => {
      // Use getAllByText since elements appear in both desktop and mobile views
      const johnDoe = screen.getAllByText('John Doe');
      const janeSmith = screen.getAllByText('Jane Smith');
      expect(johnDoe.length).toBeGreaterThan(0);
      expect(janeSmith.length).toBeGreaterThan(0);
    });
  });

  it('displays search input', () => {
    renderPage();

    const searchInput = screen.getByPlaceholderText('Search by name, phone, or email...');
    expect(searchInput).toBeInTheDocument();
  });

  it('displays filter button', () => {
    renderPage();

    const filterButton = screen.getByText('Filters');
    expect(filterButton).toBeInTheDocument();
  });

  it('shows filter panel when filter button is clicked', async () => {
    renderPage();

    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);

    await waitFor(() => {
      expect(screen.getByText('Created Date Range')).toBeInTheDocument();
      expect(screen.getByText('Lifetime Value Range (₹)')).toBeInTheDocument();
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });
  });

  it('displays customer count', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Showing 2 of 2 customers/)).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    renderPage();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays Add Customer button', () => {
    renderPage();

    const addButton = screen.getByText('Add Customer');
    expect(addButton).toBeInTheDocument();
  });

  it('displays customer email and phone', async () => {
    renderPage();

    await waitFor(() => {
      // Use getAllByText since elements appear in both desktop and mobile views
      const emailElements = screen.getAllByText('john@example.com');
      const phoneElements = screen.getAllByText('+1234567890');
      expect(emailElements.length).toBeGreaterThan(0);
      expect(phoneElements.length).toBeGreaterThan(0);
    });
  });

  it('displays customer lifetime value', async () => {
    renderPage();

    await waitFor(() => {
      // Use getAllByText since elements appear in both desktop and mobile views
      const ltv1 = screen.getAllByText(/₹5,000.00/);
      const ltv2 = screen.getAllByText(/₹3,000.00/);
      expect(ltv1.length).toBeGreaterThan(0);
      expect(ltv2.length).toBeGreaterThan(0);
    });
  });

  it('displays customer total orders', async () => {
    renderPage();

    await waitFor(() => {
      // Check for total orders in the table cells
      const cells = screen.getAllByRole('cell');
      const orderCells = cells.filter(cell => cell.textContent === '10' || cell.textContent === '5');
      expect(orderCells.length).toBeGreaterThan(0);
    });
  });

  it('handles empty customer list', async () => {
    vi.mocked(customersService.getAll).mockResolvedValue({
      success: true,
      data: [],
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
      },
      timestamp: new Date().toISOString(),
    });

    renderPage();

    await waitFor(() => {
      // Use getAllByText since the message appears in both desktop and mobile views
      const messages = screen.getAllByText(/No customers found/);
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  it('handles API error', async () => {
    vi.mocked(customersService.getAll).mockRejectedValue(new Error('API Error'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Failed to load customers/)).toBeInTheDocument();
    });
  });

  it('displays navigation back to dashboard', () => {
    renderPage();

    expect(screen.getByText('← Back to Dashboard')).toBeInTheDocument();
  });

  it('displays user information in header', () => {
    renderPage();

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});
