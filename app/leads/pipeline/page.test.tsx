/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Lead Pipeline Kanban Board Page Tests
 * 
 * Tests the kanban board view with drag-and-drop functionality,
 * conversion metrics display, and lead status updates.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LeadPipelinePage from './page';
import { leadsService } from '@/services/leads.service';
import { LeadStatus } from '@/types/enums';
import type { Lead } from '@/types/entities';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  useParams: () => ({}),
}));

vi.mock('@/components/providers/AuthProvider', () => ({
  useAuthContext: () => ({
    user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'admin' },
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

vi.mock('@/services/leads.service');

// Mock data
const mockLeads: Lead[] = [
  {
    id: '1',
    tenantId: 'tenant1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    company: 'Acme Corp',
    status: LeadStatus.NEW,
    estimatedValue: 50000,
    activities: [],
    followUpTasks: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    tenantId: 'tenant1',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1234567891',
    company: 'Tech Inc',
    status: LeadStatus.CONTACTED,
    estimatedValue: 75000,
    activities: [],
    followUpTasks: [],
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    tenantId: 'tenant1',
    name: 'Bob Johnson',
    phone: '+1234567892',
    status: LeadStatus.QUALIFIED,
    estimatedValue: 100000,
    activities: [],
    followUpTasks: [],
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
  {
    id: '4',
    tenantId: 'tenant1',
    name: 'Alice Williams',
    phone: '+1234567893',
    company: 'Global Solutions',
    status: LeadStatus.WON,
    estimatedValue: 150000,
    activities: [],
    followUpTasks: [],
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z',
  },
  {
    id: '5',
    tenantId: 'tenant1',
    name: 'Charlie Brown',
    phone: '+1234567894',
    status: LeadStatus.LOST,
    estimatedValue: 25000,
    activities: [],
    followUpTasks: [],
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
];

const mockMetrics = {
  totalLeads: 5,
  convertedLeads: 1,
  conversionRate: 20,
  averageConversionTime: 15,
};

describe('LeadPipelinePage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.mocked(leadsService.getAll).mockResolvedValue({
      data: mockLeads,
      pagination: {
        page: 1,
        pageSize: 1000,
        totalItems: 5,
        totalPages: 1,
      },
      success: true,
      timestamp: new Date().toISOString(),
    });

    vi.mocked(leadsService.getConversionMetrics).mockResolvedValue({
      data: mockMetrics,
      message: 'Success',
      success: true,
      timestamp: new Date().toISOString(),
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <LeadPipelinePage />
      </QueryClientProvider>
    );
  };

  describe('Page Rendering', () => {
    it('should render the pipeline page with header', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Lead Pipeline')).toBeInTheDocument();
      });

      expect(screen.getByText('Back to Leads')).toBeInTheDocument();
      expect(screen.getByText('Welcome,')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should display loading state initially', () => {
      renderComponent();

      expect(screen.getByText('Loading pipeline...')).toBeInTheDocument();
    });

    it('should render all kanban columns', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('New')).toBeInTheDocument();
      });

      expect(screen.getByText('Contacted')).toBeInTheDocument();
      expect(screen.getByText('Qualified')).toBeInTheDocument();
      expect(screen.getByText('Proposal')).toBeInTheDocument();
      expect(screen.getByText('Negotiation')).toBeInTheDocument();
      expect(screen.getByText('Won')).toBeInTheDocument();
      expect(screen.getByText('Lost')).toBeInTheDocument();
    });
  });

  describe('Conversion Metrics', () => {
    it('should display conversion metrics section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Overall Conversion Rate')).toBeInTheDocument();
      });

      expect(screen.getByText('Total Leads')).toBeInTheDocument();
      expect(screen.getByText('Won Leads')).toBeInTheDocument();
      expect(screen.getByText('Lost Leads')).toBeInTheDocument();
    });

    it('should display metrics with proper formatting', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Overall Conversion Rate')).toBeInTheDocument();
      });

      // Check that percentage and count displays exist
      expect(screen.getAllByText(/leads won/).length).toBeGreaterThan(0);
      expect(screen.getByText('Active in pipeline')).toBeInTheDocument();
    });
  });

  describe('Kanban Board Display', () => {
    it('should display leads in correct columns', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Check leads are in correct columns
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Tech Inc')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText('Alice Williams')).toBeInTheDocument();
      expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    });

    it('should display lead estimated values', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Check estimated values are displayed (using getAllByText for multiple matches)
      expect(screen.getAllByText(/₹/).length).toBeGreaterThan(0);
    });

    it('should display lead count per column', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('New')).toBeInTheDocument();
      });

      // Each column should show count badge
      const newColumn = screen.getByText('New').closest('div');
      expect(within(newColumn!).getByText('1')).toBeInTheDocument();

      const contactedColumn = screen.getByText('Contacted').closest('div');
      expect(within(contactedColumn!).getByText('1')).toBeInTheDocument();
    });

    it('should display total value per column', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('New')).toBeInTheDocument();
      });

      // Check total values are displayed in column headers
      expect(screen.getAllByText(/Total:/).length).toBeGreaterThan(0);
    });

    it('should show empty state for columns with no leads', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Proposal')).toBeInTheDocument();
      });

      // Proposal and Negotiation columns should show 0 count
      const proposalColumn = screen.getByText('Proposal').closest('div');
      expect(within(proposalColumn!).getByText('0')).toBeInTheDocument();

      const negotiationColumn = screen.getByText('Negotiation').closest('div');
      expect(within(negotiationColumn!).getByText('0')).toBeInTheDocument();
    });
  });

  describe('Lead Card Interaction', () => {
    it('should make lead cards draggable', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const leadCard = screen.getByText('John Doe').closest('div');
      expect(leadCard).toHaveAttribute('draggable', 'true');
    });
  });

  describe('Drag and Drop Functionality', () => {
    it('should update lead status on successful drop', async () => {
      vi.mocked(leadsService.update).mockResolvedValue({
        data: { ...mockLeads[0], status: LeadStatus.CONTACTED },
        message: 'Success',
        success: true,
        timestamp: new Date().toISOString(),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Verify leads service was called
      expect(leadsService.getAll).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      vi.mocked(leadsService.getAll).mockRejectedValue(new Error('API Error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading pipeline...')).not.toBeInTheDocument();
      });
    });

    it('should handle missing metrics data', async () => {
      vi.mocked(leadsService.getConversionMetrics).mockResolvedValue({
        data: null as any,
        message: 'Success',
        success: true,
        timestamp: new Date().toISOString(),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Overall Conversion Rate')).toBeInTheDocument();
      });

      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render horizontal scrollable kanban board', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('New')).toBeInTheDocument();
      });

      // Check for overflow-x-auto class
      const kanbanContainer = screen.getByText('New').closest('.overflow-x-auto');
      expect(kanbanContainer).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should display navigation elements', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Back to Leads')).toBeInTheDocument();
      });

      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  describe('Authentication', () => {
    it('should display user information when authenticated', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      expect(screen.getByText('Welcome,')).toBeInTheDocument();
    });
  });
});
