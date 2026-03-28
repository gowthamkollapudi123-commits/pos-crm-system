/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unit tests for Lead Creation Page
 * 
 * Tests form validation, submission, and error handling
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import NewLeadPage from './page';
import { leadsService } from '@/services/leads.service';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

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

vi.mock('@/services/leads.service', () => ({
  leadsService: {
    create: vi.fn(),
  },
}));

vi.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: vi.fn(() => ({
    isOnline: true,
  })),
}));

describe('NewLeadPage', () => {
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
        <NewLeadPage />
      </QueryClientProvider>
    );
  };

  describe('Form Validation', () => {
    it('should display validation errors for required fields', async () => {
      const user = userEvent.setup();
      renderComponent();

      const submitButton = screen.getByRole('button', { name: /create lead/i });
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

      const submitButton = screen.getByRole('button', { name: /create lead/i });
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

      const submitButton = screen.getByRole('button', { name: /create lead/i });
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

    it('should validate estimated value is positive', async () => {
      const user = userEvent.setup();
      renderComponent();

      const nameInput = screen.getByLabelText(/name/i);
      const phoneInput = screen.getByLabelText(/phone/i);
      const estimatedValueInput = screen.getByLabelText(/estimated value/i);

      await user.type(nameInput, 'John Doe');
      await user.type(phoneInput, '+1234567890');
      await user.type(estimatedValueInput, '-100');

      const submitButton = screen.getByRole('button', { name: /create lead/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/estimated value must be positive/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      const mockLead = {
        id: '1',
        tenantId: 'tenant1',
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        status: 'new',
        activities: [],
        followUpTasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (leadsService.create as any).mockResolvedValue({
        data: mockLead,
      });

      renderComponent();

      const nameInput = screen.getByLabelText(/name/i);
      const phoneInput = screen.getByLabelText(/phone/i);
      const emailInput = screen.getByLabelText(/email/i);

      await user.type(nameInput, 'John Doe');
      await user.type(phoneInput, '+1234567890');
      await user.type(emailInput, 'john@example.com');

      const submitButton = screen.getByRole('button', { name: /create lead/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(leadsService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'John Doe',
            phone: '+1234567890',
            email: 'john@example.com',
          })
        );
      });
    });

    it('should submit form with all fields', async () => {
      const user = userEvent.setup();
      const mockLead = {
        id: '1',
        tenantId: 'tenant1',
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        company: 'Acme Corp',
        source: 'Website',
        notes: 'Interested in product',
        estimatedValue: 50000,
        status: 'new',
        activities: [],
        followUpTasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (leadsService.create as any).mockResolvedValue({
        data: mockLead,
      });

      renderComponent();

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/phone/i), '+1234567890');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/company/i), 'Acme Corp');
      await user.type(screen.getByLabelText(/source/i), 'Website');
      await user.type(screen.getByLabelText(/estimated value/i), '50000');
      await user.type(screen.getByLabelText(/notes/i), 'Interested in product');

      const submitButton = screen.getByRole('button', { name: /create lead/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(leadsService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'John Doe',
            phone: '+1234567890',
            email: 'john@example.com',
            company: 'Acme Corp',
            source: 'Website',
            notes: 'Interested in product',
            estimatedValue: 50000,
          })
        );
      });
    });
  });

  describe('UI Behavior', () => {
    it('should show offline warning when offline', () => {
      vi.mocked(useNetworkStatus).mockImplementation(() => ({
        isOnline: false,
      }));

      renderComponent();

      expect(screen.getByText(/you are currently offline/i)).toBeInTheDocument();
    });
  });
});
