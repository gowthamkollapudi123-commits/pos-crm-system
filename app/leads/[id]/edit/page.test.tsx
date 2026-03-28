/**
 * Unit tests for Lead Edit Page
 * 
 * Tests form validation, submission, status update, and error handling
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import EditLeadPage from './page';
import { leadsService } from '@/services/leads.service';
import { LeadStatus } from '@/types/enums';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useParams: () => ({
    id: 'lead-123',
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

describe('EditLeadPage', () => {
  let queryClient: QueryClient;

  const mockLead = {
    id: 'lead-123',
    tenantId: 'tenant1',
    name: 'John Doe',
    phone: '+1234567890',
    email: 'john@example.com',
    company: 'Acme Corp',
    status: LeadStatus.NEW,
    source: 'Website',
    notes: 'Interested in product',
    estimatedValue: 50000,
    activities: [],
    followUpTasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();

    // Default mock for getById
    (leadsService.getById as any).mockResolvedValue({
      data: mockLead,
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <EditLeadPage />
      </QueryClientProvider>
    );
  };

  describe('Data Loading', () => {
    it('should display loading state while fetching lead', () => {
      (leadsService.getById as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderComponent();

      expect(screen.getByText(/loading lead\.\.\./i)).toBeInTheDocument();
    });

    it('should display error state when lead fetch fails', async () => {
      (leadsService.getById as any).mockRejectedValue(new Error('Failed to fetch'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/failed to load lead/i)).toBeInTheDocument();
      });
    });

    it('should populate form with lead data', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
        expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Website')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Interested in product')).toBeInTheDocument();
        expect(screen.getByDisplayValue('50000')).toBeInTheDocument();
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

  describe('Status Update', () => {
    it('should allow updating lead status', async () => {
      const user = userEvent.setup();
      const updatedLead = { ...mockLead, status: LeadStatus.CONTACTED };

      (leadsService.update as any).mockResolvedValue({
        data: updatedLead,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOptions(statusSelect, LeadStatus.CONTACTED);

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(leadsService.update).toHaveBeenCalledWith(
          'lead-123',
          expect.objectContaining({
            status: LeadStatus.CONTACTED,
          })
        );
      });
    });

    it('should display all lead status options', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText(/status/i);
      const options = Array.from(statusSelect.querySelectorAll('option')).map(
        (opt) => opt.value
      );

      expect(options).toContain(LeadStatus.NEW);
      expect(options).toContain(LeadStatus.CONTACTED);
      expect(options).toContain(LeadStatus.QUALIFIED);
      expect(options).toContain(LeadStatus.PROPOSAL);
      expect(options).toContain(LeadStatus.NEGOTIATION);
      expect(options).toContain(LeadStatus.WON);
      expect(options).toContain(LeadStatus.LOST);
    });
  });

  describe('Form Submission', () => {
    it('should submit form with updated data', async () => {
      const user = userEvent.setup();
      const updatedLead = {
        ...mockLead,
        name: 'Jane Smith',
        estimatedValue: 75000,
      };

      (leadsService.update as any).mockResolvedValue({
        data: updatedLead,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Smith');

      const estimatedValueInput = screen.getByLabelText(/estimated value/i);
      await user.clear(estimatedValueInput);
      await user.type(estimatedValueInput, '75000');

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(leadsService.update).toHaveBeenCalledWith(
          'lead-123',
          expect.objectContaining({
            name: 'Jane Smith',
            estimatedValue: 75000,
          })
        );
      });
    });

    it('should display success toast on successful update', async () => {
      const user = userEvent.setup();
      (leadsService.update as any).mockResolvedValue({
        data: mockLead,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Lead updated successfully');
      });
    });

    it('should display error toast on update failure', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to update lead';

      (leadsService.update as any).mockRejectedValue({
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

  describe('Lead Deletion', () => {
    it('should show delete confirmation modal', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(screen.getByText(/are you sure you want to delete this lead/i)).toBeInTheDocument();
    });

    it('should delete lead when confirmed', async () => {
      const user = userEvent.setup();
      (leadsService.delete as any).mockResolvedValue({});

      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      const confirmButton = screen.getAllByRole('button', { name: /delete/i })[1];
      await user.click(confirmButton);

      await waitFor(() => {
        expect(leadsService.delete).toHaveBeenCalledWith('lead-123');
        expect(toast.success).toHaveBeenCalledWith('Lead deleted successfully');
      });
    });

    it('should cancel deletion when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByText(/are you sure you want to delete this lead/i)).not.toBeInTheDocument();
      expect(leadsService.delete).not.toHaveBeenCalled();
    });
  });

  describe('UI Behavior', () => {
    it('should disable submit button while submitting', async () => {
      const user = userEvent.setup();
      (leadsService.update as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
    });

    it('should show loading state while submitting', async () => {
      const user = userEvent.setup();
      (leadsService.update as any).mockImplementation(
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
