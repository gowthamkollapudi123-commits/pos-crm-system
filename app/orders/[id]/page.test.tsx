/**
 * Order Detail Page Tests
 * 
 * Tests for order detail view functionality including:
 * - Order information display
 * - Customer information display
 * - Payment status display
 * - Order status updates
 * - Navigation and actions
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OrderDetailPage from './page';
import { ordersService } from '@/services/orders.service';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@/types/enums';
import type { Order } from '@/types/entities';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
}));

vi.mock('@/services/orders.service');
vi.mock('@/hooks/useNetworkStatus');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock order data
const mockOrder: Order = {
  id: 'order-1',
  tenantId: 'tenant-1',
  orderNumber: 'ORD-2024-001',
  customerId: 'customer-1',
  customer: {
    id: 'customer-1',
    tenantId: 'tenant-1',
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
    lifetimeValue: 5000,
    totalOrders: 5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  items: [
    {
      id: 'item-1',
      productId: 'product-1',
      product: {
        id: 'product-1',
        tenantId: 'tenant-1',
        sku: 'SKU-001',
        name: 'Product 1',
        category: 'Electronics',
        price: 100,
        stockQuantity: 50,
        minStockLevel: 10,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      quantity: 2,
      unitPrice: 100,
      totalPrice: 200,
    },
    {
      id: 'item-2',
      productId: 'product-2',
      product: {
        id: 'product-2',
        tenantId: 'tenant-1',
        sku: 'SKU-002',
        name: 'Product 2',
        category: 'Accessories',
        price: 50,
        stockQuantity: 100,
        minStockLevel: 20,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      quantity: 1,
      unitPrice: 50,
      totalPrice: 50,
    },
  ],
  subtotal: 250,
  taxAmount: 25,
  discountAmount: 10,
  totalAmount: 265,
  status: OrderStatus.COMPLETED,
  paymentMethod: PaymentMethod.CARD,
  paymentStatus: PaymentStatus.SUCCESS,
  paymentTransactionId: 'TXN-123456',
  notes: 'Customer requested gift wrapping',
  createdBy: 'user-1',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
};

const mockWalkInOrder: Order = {
  ...mockOrder,
  id: 'order-2',
  orderNumber: 'ORD-2024-002',
  customerId: undefined,
  customer: undefined,
};

const mockOrdersService = ordersService as any;
const mockUseNetworkStatus = useNetworkStatus as any;

describe('OrderDetailPage', () => {
  let queryClient: QueryClient;
  const mockPush = vi.fn();
  const mockBack = vi.fn();

  beforeEach(async () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Setup navigation mocks
    const navigation = await import('next/navigation');
    vi.mocked(navigation.useRouter).mockReturnValue({
      push: mockPush,
      back: mockBack,
    } as any);

    vi.mocked(navigation.useParams).mockReturnValue({
      id: 'order-1',
    } as any);

    mockUseNetworkStatus.mockReturnValue({
      isOnline: true,
    });

    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <OrderDetailPage />
      </QueryClientProvider>
    );
  };

  describe('Loading and Error States', () => {
    it('should display loading state while fetching order', () => {
      mockOrdersService.getById.mockReturnValue(
        new Promise(() => {}) // Never resolves
      );

      renderComponent();

      expect(screen.getByText(/loading order/i)).toBeInTheDocument();
    });

    it('should display error state when order fetch fails', async () => {
      mockOrdersService.getById.mockRejectedValue(
        new Error('Failed to fetch')
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/failed to load order/i)).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /back to orders/i });
      await userEvent.click(backButton);
      expect(mockPush).toHaveBeenCalledWith('/orders');
    });
  });

  describe('Order Information Display', () => {
    beforeEach(() => {
      mockOrdersService.getById.mockResolvedValue({
        data: mockOrder,
      });
    });

    it('should display order number and date', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Order ORD-2024-001/i)).toBeInTheDocument();
        expect(screen.getByText(/January 15, 2024/i)).toBeInTheDocument();
      });
    });

    it('should display order items with details', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Product 1')).toBeInTheDocument();
        expect(screen.getByText('Product 2')).toBeInTheDocument();
      });

      // Check quantities
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('2'); // Product 1 quantity
      expect(rows[2]).toHaveTextContent('1'); // Product 2 quantity
    });

    it('should display order totals correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
        expect(screen.getByText('₹250.00')).toBeInTheDocument();
        expect(screen.getByText(/tax/i)).toBeInTheDocument();
        expect(screen.getByText('₹25.00')).toBeInTheDocument();
        expect(screen.getByText(/discount/i)).toBeInTheDocument();
        expect(screen.getByText('-₹10.00')).toBeInTheDocument();
        expect(screen.getByText('₹265.00')).toBeInTheDocument();
      });
    });

    it('should display order notes when present', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/notes/i)).toBeInTheDocument();
        expect(screen.getByText('Customer requested gift wrapping')).toBeInTheDocument();
      });
    });

    it('should not display notes section when notes are absent', async () => {
      const orderWithoutNotes = { ...mockOrder, notes: undefined };
      mockOrdersService.getById.mockResolvedValue({
        data: orderWithoutNotes,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Order ORD-2024-001/i)).toBeInTheDocument();
      });

      expect(screen.queryByText(/notes/i)).not.toBeInTheDocument();
    });
  });

  describe('Order Status Display', () => {
    it('should display order status with correct styling', async () => {
      mockOrdersService.getById.mockResolvedValue({
        data: mockOrder,
      });

      renderComponent();

      await waitFor(() => {
        const statusBadge = screen.getByText('Completed');
        expect(statusBadge).toBeInTheDocument();
        expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');
      });
    });

    it('should display pending status with yellow styling', async () => {
      const pendingOrder = { ...mockOrder, status: OrderStatus.PENDING };
      mockOrdersService.getById.mockResolvedValue({
        data: pendingOrder,
      });

      renderComponent();

      await waitFor(() => {
        const statusBadge = screen.getByText('Pending');
        expect(statusBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
      });
    });

    it('should display cancelled status with red styling', async () => {
      const cancelledOrder = { ...mockOrder, status: OrderStatus.CANCELLED };
      mockOrdersService.getById.mockResolvedValue({
        data: cancelledOrder,
      });

      renderComponent();

      await waitFor(() => {
        const statusBadge = screen.getByText('Cancelled');
        expect(statusBadge).toHaveClass('bg-red-100', 'text-red-800');
      });
    });
  });

  describe('Payment Status Display', () => {
    beforeEach(() => {
      mockOrdersService.getById.mockResolvedValue({
        data: mockOrder,
      });
    });

    it('should display payment status with success styling', async () => {
      renderComponent();

      await waitFor(() => {
        const paymentBadge = screen.getByText('Success');
        expect(paymentBadge).toBeInTheDocument();
        expect(paymentBadge).toHaveClass('bg-green-100', 'text-green-800');
      });
    });

    it('should display payment method', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/payment method/i)).toBeInTheDocument();
        expect(screen.getByText('card')).toBeInTheDocument();
      });
    });

    it('should display transaction ID when available', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/transaction id/i)).toBeInTheDocument();
        expect(screen.getByText('TXN-123456')).toBeInTheDocument();
      });
    });

    it('should display pending payment status with yellow styling', async () => {
      const pendingPaymentOrder = {
        ...mockOrder,
        paymentStatus: PaymentStatus.PENDING,
      };
      mockOrdersService.getById.mockResolvedValue({
        data: pendingPaymentOrder,
      });

      renderComponent();

      await waitFor(() => {
        const paymentBadge = screen.getByText('Pending');
        expect(paymentBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
      });
    });

    it('should display failed payment status with red styling', async () => {
      const failedPaymentOrder = {
        ...mockOrder,
        paymentStatus: PaymentStatus.FAILED,
      };
      mockOrdersService.getById.mockResolvedValue({
        data: failedPaymentOrder,
      });

      renderComponent();

      await waitFor(() => {
        const paymentBadge = screen.getByText('Failed');
        expect(paymentBadge).toHaveClass('bg-red-100', 'text-red-800');
      });
    });

    it('should display refunded payment status with purple styling', async () => {
      const refundedPaymentOrder = {
        ...mockOrder,
        paymentStatus: PaymentStatus.REFUNDED,
      };
      mockOrdersService.getById.mockResolvedValue({
        data: refundedPaymentOrder,
      });

      renderComponent();

      await waitFor(() => {
        const paymentBadge = screen.getByText('Refunded');
        expect(paymentBadge).toHaveClass('bg-purple-100', 'text-purple-800');
      });
    });
  });

  describe('Customer Information Display', () => {
    beforeEach(() => {
      mockOrdersService.getById.mockResolvedValue({
        data: mockOrder,
      });
    });

    it('should display customer information', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('+1234567890')).toBeInTheDocument();
      });
    });

    it('should display customer address', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/123 Main St/i)).toBeInTheDocument();
        expect(screen.getByText(/New York, NY 10001/i)).toBeInTheDocument();
      });
    });

    it('should navigate to customer detail page when clicking customer name', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const customerLink = screen.getByRole('button', { name: 'John Doe' });
      await user.click(customerLink);

      expect(mockPush).toHaveBeenCalledWith('/customers/customer-1');
    });

    it('should navigate to customer detail page when clicking view button', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const viewButton = screen.getByRole('button', { name: /view customer details/i });
      await user.click(viewButton);

      expect(mockPush).toHaveBeenCalledWith('/customers/customer-1');
    });

    it('should display walk-in customer message when no customer linked', async () => {
      mockOrdersService.getById.mockResolvedValue({
        data: mockWalkInOrder,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/walk-in customer/i)).toBeInTheDocument();
        expect(screen.getByText(/no customer linked to this order/i)).toBeInTheDocument();
      });
    });
  });

  describe('Order Status Updates', () => {
    beforeEach(() => {
      mockOrdersService.getById.mockResolvedValue({
        data: mockOrder,
      });
    });

    it('should open status update modal when clicking update button', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Order ORD-2024-001/i)).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /update status/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(screen.getByText(/update order status/i)).toBeInTheDocument();
      });
    });

    it('should display all status options in modal', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Order ORD-2024-001/i)).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /update status/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Pending')).toBeInTheDocument();
        expect(screen.getByLabelText('Processing')).toBeInTheDocument();
        expect(screen.getByLabelText('Completed')).toBeInTheDocument();
        expect(screen.getByLabelText('Cancelled')).toBeInTheDocument();
        expect(screen.getByLabelText('Refunded')).toBeInTheDocument();
      });
    });

    it('should update order status successfully', async () => {
      const user = userEvent.setup();
      mockOrdersService.update.mockResolvedValue({
        data: { ...mockOrder, status: OrderStatus.PROCESSING },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Order ORD-2024-001/i)).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /update status/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Processing')).toBeInTheDocument();
      });

      const processingRadio = screen.getByLabelText('Processing');
      await user.click(processingRadio);

      // Get the modal and find the button within it
      const modal = screen.getByRole('heading', { name: /update order status/i }).closest('div');
      const confirmButton = within(modal!).getAllByRole('button').find(btn => btn.textContent === 'Update Status');
      await user.click(confirmButton!);

      await waitFor(() => {
        expect(mockOrdersService.update).toHaveBeenCalledWith('order-1', {
          status: OrderStatus.PROCESSING,
        });
      });
    });

    it('should show confirmation for cancelled status', async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn(() => true);

      mockOrdersService.update.mockResolvedValue({
        data: { ...mockOrder, status: OrderStatus.CANCELLED },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Order ORD-2024-001/i)).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /update status/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Cancelled')).toBeInTheDocument();
      });

      const cancelledRadio = screen.getByLabelText('Cancelled');
      await user.click(cancelledRadio);

      // Get the modal and find the button within it
      const modal = screen.getByRole('heading', { name: /update order status/i }).closest('div');
      const confirmButton = within(modal!).getAllByRole('button').find(btn => btn.textContent === 'Update Status');
      await user.click(confirmButton!);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith(
          expect.stringContaining('cancel')
        );
      });
    });

    it('should show confirmation for refunded status', async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn(() => true);

      mockOrdersService.update.mockResolvedValue({
        data: { ...mockOrder, status: OrderStatus.REFUNDED },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Order ORD-2024-001/i)).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /update status/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Refunded')).toBeInTheDocument();
      });

      const refundedRadio = screen.getByLabelText('Refunded');
      await user.click(refundedRadio);

      // Get the modal and find the button within it
      const modal = screen.getByRole('heading', { name: /update order status/i }).closest('div');
      const confirmButton = within(modal!).getAllByRole('button').find(btn => btn.textContent === 'Update Status');
      await user.click(confirmButton!);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith(
          expect.stringContaining('refund')
        );
      });
    });

    it('should cancel status update when user declines confirmation', async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn(() => false);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Order ORD-2024-001/i)).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /update status/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Cancelled')).toBeInTheDocument();
      });

      const cancelledRadio = screen.getByLabelText('Cancelled');
      await user.click(cancelledRadio);

      // Get the modal and find the button within it
      const modal = screen.getByRole('heading', { name: /update order status/i }).closest('div');
      const confirmButton = within(modal!).getAllByRole('button').find(btn => btn.textContent === 'Update Status');
      await user.click(confirmButton!);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled();
      });

      expect(mockOrdersService.update).not.toHaveBeenCalled();
    });

    it('should close modal when clicking cancel', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Order ORD-2024-001/i)).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /update status/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(screen.getByText(/update order status/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/update order status/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      mockOrdersService.getById.mockResolvedValue({
        data: mockOrder,
      });
    });

    it('should navigate back to orders list when clicking back button', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Order ORD-2024-001/i)).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /back to orders/i });
      await user.click(backButton);

      expect(mockPush).toHaveBeenCalledWith('/orders');
    });
  });

  describe('Offline Behavior', () => {
    beforeEach(() => {
      mockOrdersService.getById.mockResolvedValue({
        data: mockOrder,
      });
    });

    it('should disable update button when offline', async () => {
      mockUseNetworkStatus.mockReturnValue({
        isOnline: false,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Order ORD-2024-001/i)).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /update status/i });
      expect(updateButton).toBeDisabled();
    });

    it('should display offline warning when offline', async () => {
      mockUseNetworkStatus.mockReturnValue({
        isOnline: false,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/you are currently offline/i)).toBeInTheDocument();
      });
    });
  });
});
