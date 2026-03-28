/**
 * Customer Detail Page Tests
 * 
 * Tests for customer detail view functionality including:
 * - Rendering customer details
 * - Order history display
 * - Order history filtering (status and date range)
 * - Navigation to order details
 * - Notes functionality
 * - Edit and delete actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CustomerDetailPage from '../page';
import { customersService } from '@/services/customers.service';
import { Customer, Order } from '@/types/entities';
import { OrderStatus } from '@/types/enums';

// Mock dependencies
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
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
const mockCustomer: Customer = {
  id: 'customer-1',
  tenantId: 'tenant1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  address: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
  },
  dateOfBirth: '1990-01-15',
  notes: 'VIP customer',
  lifetimeValue: 15000,
  totalOrders: 5,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// Mock order data
const mockOrders: Order[] = [
  {
    id: 'order-1',
    tenantId: 'tenant1',
    orderNumber: 'ORD-001',
    customerId: 'customer-1',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        quantity: 2,
        unitPrice: 100,
        totalPrice: 200,
      },
    ],
    subtotal: 200,
    taxAmount: 20,
    discountAmount: 0,
    totalAmount: 220,
    status: OrderStatus.COMPLETED,
    paymentMethod: 'card' as any,
    paymentStatus: 'success' as any,
    createdBy: 'user-1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'order-2',
    tenantId: 'tenant1',
    orderNumber: 'ORD-002',
    customerId: 'customer-1',
    items: [
      {
        id: 'item-2',
        productId: 'prod-2',
        quantity: 1,
        unitPrice: 500,
        totalPrice: 500,
      },
    ],
    subtotal: 500,
    taxAmount: 50,
    discountAmount: 0,
    totalAmount: 550,
    status: OrderStatus.PENDING,
    paymentMethod: 'cash' as any,
    paymentStatus: 'pending' as any,
    createdBy: 'user-1',
    createdAt: '2024-02-01T14:30:00Z',
    updatedAt: '2024-02-01T14:30:00Z',
  },
  {
    id: 'order-3',
    tenantId: 'tenant1',
    orderNumber: 'ORD-003',
    customerId: 'customer-1',
    items: [
      {
        id: 'item-3',
        productId: 'prod-3',
        quantity: 3,
        unitPrice: 150,
        totalPrice: 450,
      },
    ],
    subtotal: 450,
    taxAmount: 45,
    discountAmount: 50,
    totalAmount: 445,
    status: OrderStatus.CANCELLED,
    paymentMethod: 'upi' as any,
    paymentStatus: 'failed' as any,
    createdBy: 'user-1',
    createdAt: '2024-03-10T09:15:00Z',
    updatedAt: '2024-03-10T09:15:00Z',
  },
];

describe('CustomerDetailPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    mockPush.mockClear();

    // Mock the customers service
    vi.mocked(customersService.getById).mockResolvedValue({
      success: true,
      data: mockCustomer,
      timestamp: new Date().toISOString(),
    });

    vi.mocked(customersService.getPurchaseHistory).mockResolvedValue({
      success: true,
      data: mockOrders,
      timestamp: new Date().toISOString(),
    });

    vi.mocked(customersService.getLifetimeValue).mockResolvedValue({
      success: true,
      data: { lifetimeValue: 15000 },
      timestamp: new Date().toISOString(),
    });
  });

  const renderPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CustomerDetailPage params={{ id: 'customer-1' }} />
      </QueryClientProvider>
    );
  };

  describe('Customer Details Display', () => {
    it('renders customer name and basic info', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('+1234567890')).toBeInTheDocument();
      });
    });

    it('displays customer address', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
        expect(screen.getByText(/New York, NY 10001/)).toBeInTheDocument();
      });
    });

    it('displays lifetime value prominently', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Lifetime Value')).toBeInTheDocument();
        expect(screen.getByText(/₹15,000.00/)).toBeInTheDocument();
      });
    });

    it('displays customer notes', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('VIP customer')).toBeInTheDocument();
      });
    });
  });

  describe('Order History Display', () => {
    it('renders order history section', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Order History')).toBeInTheDocument();
      });
    });

    it('displays all orders initially', async () => {
      renderPage();

      await waitFor(() => {
        const ord001 = screen.getAllByText('ORD-001');
        const ord002 = screen.getAllByText('ORD-002');
        const ord003 = screen.getAllByText('ORD-003');
        expect(ord001.length).toBeGreaterThan(0);
        expect(ord002.length).toBeGreaterThan(0);
        expect(ord003.length).toBeGreaterThan(0);
      });
    });

    it('displays order count', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText(/3 orders/)).toBeInTheDocument();
      });
    });

    it('displays order status badges', async () => {
      renderPage();

      await waitFor(() => {
        const completed = screen.getAllByText('Completed');
        const pending = screen.getAllByText('Pending');
        const cancelled = screen.getAllByText('Cancelled');
        expect(completed.length).toBeGreaterThan(0);
        expect(pending.length).toBeGreaterThan(0);
        expect(cancelled.length).toBeGreaterThan(0);
      });
    });

    it('displays order amounts', async () => {
      renderPage();

      await waitFor(() => {
        const amount1 = screen.getAllByText(/₹220.00/);
        const amount2 = screen.getAllByText(/₹550.00/);
        const amount3 = screen.getAllByText(/₹445.00/);
        expect(amount1.length).toBeGreaterThan(0);
        expect(amount2.length).toBeGreaterThan(0);
        expect(amount3.length).toBeGreaterThan(0);
      });
    });

    it('shows empty state when customer has no orders', async () => {
      vi.mocked(customersService.getPurchaseHistory).mockResolvedValue({
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      });

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('No order history available.')).toBeInTheDocument();
      });
    });
  });

  describe('Order History Filtering', () => {
    it('displays filter button', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument();
      });
    });

    it('shows filter panel when filter button is clicked', async () => {
      renderPage();

      await waitFor(() => {
        const filterButton = screen.getByText('Filters');
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Order Status')).toBeInTheDocument();
        expect(screen.getByText('Date Range')).toBeInTheDocument();
      });
    });

    it('filters orders by status', async () => {
      renderPage();

      await waitFor(() => {
        const filterButton = screen.getByText('Filters');
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        const statusSelect = screen.getByLabelText('Order Status');
        fireEvent.change(statusSelect, { target: { value: OrderStatus.COMPLETED } });
      });

      await waitFor(() => {
        const ord001 = screen.getAllByText('ORD-001');
        expect(ord001.length).toBeGreaterThan(0);
        expect(screen.queryByText('ORD-002')).not.toBeInTheDocument();
        expect(screen.queryByText('ORD-003')).not.toBeInTheDocument();
      });
    });

    it('filters orders by date range', async () => {
      renderPage();

      await waitFor(() => {
        const filterButton = screen.getByText('Filters');
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        const startDateInput = screen.getByLabelText('Start date');
        const endDateInput = screen.getByLabelText('End date');
        
        fireEvent.change(startDateInput, { target: { value: '2024-02-01' } });
        fireEvent.change(endDateInput, { target: { value: '2024-02-28' } });
      });

      await waitFor(() => {
        expect(screen.queryByText('ORD-001')).not.toBeInTheDocument();
        const ord002 = screen.getAllByText('ORD-002');
        expect(ord002.length).toBeGreaterThan(0);
        expect(screen.queryByText('ORD-003')).not.toBeInTheDocument();
      });
    });

    it('shows active filter indicator when filters are applied', async () => {
      renderPage();

      await waitFor(() => {
        const filterButton = screen.getByText('Filters');
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        const statusSelect = screen.getByLabelText('Order Status');
        fireEvent.change(statusSelect, { target: { value: OrderStatus.PENDING } });
      });

      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    it('displays filtered count when filters are active', async () => {
      renderPage();

      await waitFor(() => {
        const filterButton = screen.getByText('Filters');
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        const statusSelect = screen.getByLabelText('Order Status');
        fireEvent.change(statusSelect, { target: { value: OrderStatus.COMPLETED } });
      });

      await waitFor(() => {
        expect(screen.getByText(/1 order \(filtered from 3 total\)/)).toBeInTheDocument();
      });
    });

    it('clears filters when clear button is clicked', async () => {
      renderPage();

      await waitFor(() => {
        const filterButton = screen.getByText('Filters');
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        const statusSelect = screen.getByLabelText('Order Status');
        fireEvent.change(statusSelect, { target: { value: OrderStatus.PENDING } });
      });

      await waitFor(() => {
        const clearButton = screen.getByText('Clear Filters');
        fireEvent.click(clearButton);
      });

      await waitFor(() => {
        const ord001 = screen.getAllByText('ORD-001');
        const ord002 = screen.getAllByText('ORD-002');
        const ord003 = screen.getAllByText('ORD-003');
        expect(ord001.length).toBeGreaterThan(0);
        expect(ord002.length).toBeGreaterThan(0);
        expect(ord003.length).toBeGreaterThan(0);
      });
    });

    it('shows empty state message when no orders match filters', async () => {
      renderPage();

      await waitFor(() => {
        const filterButton = screen.getByText('Filters');
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        const statusSelect = screen.getByLabelText('Order Status');
        fireEvent.change(statusSelect, { target: { value: OrderStatus.REFUNDED } });
      });

      await waitFor(() => {
        expect(screen.getByText('No orders match the selected filters.')).toBeInTheDocument();
        expect(screen.getByText('Clear filters to see all orders')).toBeInTheDocument();
      });
    });
  });

  describe('Order Navigation', () => {
    it('navigates to order detail when order is clicked', async () => {
      renderPage();

      await waitFor(() => {
        const orderLinks = screen.getAllByText('ORD-001');
        fireEvent.click(orderLinks[0]);
      });

      expect(mockPush).toHaveBeenCalledWith('/orders/order-1');
    });
  });

  describe('Actions', () => {
    it('displays edit and delete buttons', async () => {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });

    it('navigates to edit page when edit button is clicked', async () => {
      renderPage();

      await waitFor(() => {
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);
      });

      expect(mockPush).toHaveBeenCalledWith('/customers/customer-1/edit');
    });

    it('navigates back to customer list', async () => {
      renderPage();

      await waitFor(() => {
        const backButton = screen.getByText('Back to Customers');
        fireEvent.click(backButton);
      });

      expect(mockPush).toHaveBeenCalledWith('/customers');
    });
  });

  describe('Loading States', () => {
    it('shows loading state initially', () => {
      renderPage();

      expect(screen.getByText('Loading customer details...')).toBeInTheDocument();
    });

    it('shows loading state for order history', async () => {
      vi.mocked(customersService.getPurchaseHistory).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Loading order history...')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles customer fetch error', async () => {
      vi.mocked(customersService.getById).mockRejectedValue(new Error('API Error'));

      renderPage();

      await waitFor(() => {
        expect(screen.getByText(/Failed to load customer details/)).toBeInTheDocument();
      });
    });
  });
});
