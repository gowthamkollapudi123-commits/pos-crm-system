/**
 * Unit tests for Customer Edit Page
 * 
 * Tests form validation, submission, deletion, and error handling
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import EditCustomerPage from './page';
import { customersService } from '@/services/customers.service';
import * as indexeddb from '@/lib/indexeddb';

// Mock dependencies
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useParams: () => ({
    id: 'customer-123',
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/services/customers.service', () => ({
  customersService: {
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    isOnline: true,
  }),
}));

vi.mock('@/lib/indexeddb', () => ({
  update: vi.fn(),
  STORES: {
    CUSTOMERS: 'customers',
  },
}));

describe('EditCustomerPage', () => {
  let queryClient: QueryClient;

  const mockCustomer = {
    id: 'customer-123',
    tenantId: 'tenant1',
    name: 'John Doe',
    phone: '+1234567890',
    email: 'john@example.com',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'United States',
    },
    dateOfBirth: '1990-01-01',
    notes: 'VIP customer',
    lifetimeValue: 5000,
    totalOrders: 10,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    (customersService.getById as any).mockResolvedValue({
      data: mockCustomer,
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <EditCustomerPage />
      </QueryClientProvider>
    );
  };

  describe('Data Loading', () => {
    it('should display loading state while fetching customer', () => {
      (customersService.getById as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderComponent();

      expect(screen.getByText(/loading customer\.\.\./i)).toBeInTheDocument();
    });

    it('should load and display customer data', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
        expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
      });
    });

    it('should display error state when customer fetch fails', async () => {
      (customersService.getById as jest.Mock).mockRejectedValue(
        new Error('Failed to fetch')
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/failed to load customer/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });

    it('should validate phone number format', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
      });

      const phoneInput = screen.getByLabelText(/phone/i);
      await user.clear(phoneInput);
      await user.type(phoneInput, '123');

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/phone number must be in e\.164 format/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should update customer with valid data', async () => {
      const user = userEvent.setup();
      const updatedCustomer = { ...mockCustomer, name: 'Jane Doe' };

      (customersService.update as jest.Mock).mockResolvedValue({
        data: updatedCustomer,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Doe');

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(customersService.update).toHaveBeenCalledWith(
          'customer-123',
          expect.objectContaining({
            name: 'Jane Doe',
          })
        );
      });
    });

    it('should update customer in IndexedDB after successful update', async () => {
      const user = userEvent.setup();
      const updatedCustomer = { ...mockCustomer, name: 'Jane Doe' };

      (customersService.update as jest.Mock).mockResolvedValue({
        data: updatedCustomer,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Doe');

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(indexeddb.update).toHaveBeenCalledWith('customers', updatedCustomer);
      });
    });

    it('should display success toast on successful update', async () => {
      const user = userEvent.setup();
      (customersService.update as jest.Mock).mockResolvedValue({
        data: mockCustomer,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Customer updated successfully');
      });
    });

    it('should display error toast on update failure', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to update customer';

      (customersService.update as jest.Mock).mockRejectedValue({
        response: {
          data: {
            message: errorMessage,
          },
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
      });
    });
  });

  describe('Customer Deletion', () => {
    it('should show delete confirmation modal when delete button clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(screen.getByText(/are you sure you want to delete this customer/i)).toBeInTheDocument();
    });

    it('should close modal when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      const cancelButton = screen.getAllByRole('button', { name: /cancel/i })[1]; // Second cancel button in modal
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/are you sure you want to delete this customer/i)).not.toBeInTheDocument();
      });
    });

    it('should delete customer when confirmed', async () => {
      const user = userEvent.setup();
      (customersService.delete as jest.Mock).mockResolvedValue({});

      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(customersService.delete).toHaveBeenCalledWith('customer-123');
      });
    });

    it('should display success toast on successful deletion', async () => {
      const user = userEvent.setup();
      (customersService.delete as jest.Mock).mockResolvedValue({});

      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Customer deleted successfully');
      });
    });

    it('should display error toast on deletion failure', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to delete customer';

      (customersService.delete as jest.Mock).mockRejectedValue({
        response: {
          data: {
            message: errorMessage,
          },
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
      });
    });
  });

  describe('UI Behavior', () => {
    it('should disable buttons while submitting', async () => {
      const user = userEvent.setup();
      (customersService.update as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });

    it('should show loading state while submitting', async () => {
      const user = userEvent.setup();
      (customersService.update as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      expect(screen.getByText(/saving\.\.\./i)).toBeInTheDocument();
    });
  });
});
