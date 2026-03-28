/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unit tests for Customer Creation Page
 * 
 * Tests form validation, submission, and error handling
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import NewCustomerPage from './page';
import { customersService } from '@/services/customers.service';
import * as indexeddb from '@/lib/indexeddb';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
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
    create: vi.fn(),
  },
}));

vi.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    isOnline: true,
  }),
}));

vi.mock('@/lib/indexeddb', () => ({
  create: vi.fn(),
  STORES: {
    CUSTOMERS: 'customers',
  },
}));

describe('NewCustomerPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <NewCustomerPage />
      </QueryClientProvider>
    );
  };

  describe('Form Validation', () => {
    it('should display validation errors for required fields', async () => {
      const user = userEvent.setup();
      renderComponent();

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/phone number is required/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      renderComponent();

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });

    it('should validate phone number format (E.164)', async () => {
      const user = userEvent.setup();
      renderComponent();

      const nameInput = screen.getByLabelText(/name/i);
      const phoneInput = screen.getByLabelText(/phone/i);

      await user.type(nameInput, 'John Doe');
      await user.type(phoneInput, '123'); // Invalid E.164 format

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/phone number must be in e\.164 format/i)).toBeInTheDocument();
      });
    });

    it('should accept valid phone number in E.164 format', async () => {
      const user = userEvent.setup();
      renderComponent();

      const nameInput = screen.getByLabelText(/name/i);
      const phoneInput = screen.getByLabelText(/phone/i);

      await user.type(nameInput, 'John Doe');
      await user.type(phoneInput, '+1234567890');

      await waitFor(() => {
        expect(screen.queryByText(/phone number must be in e\.164 format/i)).not.toBeInTheDocument();
      });
    });

    it('should validate address fields when provided', async () => {
      const user = userEvent.setup();
      renderComponent();

      const streetInput = screen.getByLabelText(/street/i);
      await user.type(streetInput, 'a'); // Too short

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/street is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      const mockCustomer = {
        id: '1',
        tenantId: 'tenant1',
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        lifetimeValue: 0,
        totalOrders: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (customersService.create as any).mockResolvedValue({
        data: mockCustomer,
      });

      renderComponent();

      const nameInput = screen.getByLabelText(/name/i);
      const phoneInput = screen.getByLabelText(/phone/i);
      const emailInput = screen.getByLabelText(/email/i);

      await user.type(nameInput, 'John Doe');
      await user.type(phoneInput, '+1234567890');
      await user.type(emailInput, 'john@example.com');

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(customersService.create).toHaveBeenCalledWith({
          name: 'John Doe',
          phone: '+1234567890',
          email: 'john@example.com',
          address: undefined,
          dateOfBirth: undefined,
          notes: undefined,
        });
      });
    });

    it('should cache customer in IndexedDB after creation', async () => {
      const user = userEvent.setup();
      const mockCustomer = {
        id: '1',
        tenantId: 'tenant1',
        name: 'John Doe',
        phone: '+1234567890',
        lifetimeValue: 0,
        totalOrders: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (customersService.create as any).mockResolvedValue({
        data: mockCustomer,
      });

      renderComponent();

      const nameInput = screen.getByLabelText(/name/i);
      const phoneInput = screen.getByLabelText(/phone/i);

      await user.type(nameInput, 'John Doe');
      await user.type(phoneInput, '+1234567890');

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(indexeddb.create).toHaveBeenCalledWith('customers', mockCustomer);
      });
    });

    it('should display success toast on successful creation', async () => {
      const user = userEvent.setup();
      const mockCustomer = {
        id: '1',
        tenantId: 'tenant1',
        name: 'John Doe',
        phone: '+1234567890',
        lifetimeValue: 0,
        totalOrders: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (customersService.create as any).mockResolvedValue({
        data: mockCustomer,
      });

      renderComponent();

      const nameInput = screen.getByLabelText(/name/i);
      const phoneInput = screen.getByLabelText(/phone/i);

      await user.type(nameInput, 'John Doe');
      await user.type(phoneInput, '+1234567890');

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Customer created successfully');
      });
    });

    it('should display error toast on creation failure', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to create customer';

      (customersService.create as any).mockRejectedValue({
        response: {
          data: {
            message: errorMessage,
          },
        },
      });

      renderComponent();

      const nameInput = screen.getByLabelText(/name/i);
      const phoneInput = screen.getByLabelText(/phone/i);

      await user.type(nameInput, 'John Doe');
      await user.type(phoneInput, '+1234567890');

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
      });
    });

    it('should submit form with complete address', async () => {
      const user = userEvent.setup();
      const mockCustomer = {
        id: '1',
        tenantId: 'tenant1',
        name: 'John Doe',
        phone: '+1234567890',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'United States',
        },
        lifetimeValue: 0,
        totalOrders: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (customersService.create as any).mockResolvedValue({
        data: mockCustomer,
      });

      renderComponent();

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/phone/i), '+1234567890');
      await user.type(screen.getByLabelText(/street/i), '123 Main St');
      await user.type(screen.getByLabelText(/city/i), 'New York');
      await user.type(screen.getByLabelText(/state/i), 'NY');
      await user.type(screen.getByLabelText(/zip code/i), '10001');
      await user.type(screen.getByLabelText(/country/i), 'United States');

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(customersService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'John Doe',
            phone: '+1234567890',
            address: {
              street: '123 Main St',
              city: 'New York',
              state: 'NY',
              zipCode: '10001',
              country: 'United States',
            },
          })
        );
      });
    });
  });

  describe('UI Behavior', () => {
    it('should disable submit button while submitting', async () => {
      const user = userEvent.setup();
      (customersService.create as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      renderComponent();

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/phone/i), '+1234567890');

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
    });

    it('should show loading state while submitting', async () => {
      const user = userEvent.setup();
      (customersService.create as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      renderComponent();

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/phone/i), '+1234567890');

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      await user.click(submitButton);

      expect(screen.getByText(/creating\.\.\./i)).toBeInTheDocument();
    });
  });
});
