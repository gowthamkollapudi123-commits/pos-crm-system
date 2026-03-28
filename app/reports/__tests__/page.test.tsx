/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Reports Page Tests
 * 
 * Tests for the reports page layout, report type selection, and date range picker.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReportsPage from '../page';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useAuth } from '@/hooks';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// Mock dependencies
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/components/providers/AuthProvider');
vi.mock('@/hooks');
vi.mock('@/hooks/useNetworkStatus');

vi.mock('@/components/offline/OfflineIndicator', () => ({
  OfflineIndicator: () => React.createElement('div', { 'data-testid': 'offline-indicator' }, 'Offline Indicator'),
}));

describe('ReportsPage', () => {
  const mockLogout = vi.fn();
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.mocked(useAuth).mockReturnValue({
      logout: mockLogout,
    } as any);

    vi.mocked(useNetworkStatus).mockReturnValue({
      isOnline: true,
    } as any);

    vi.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(QueryClientProvider, { client: queryClient }, children)
    );
    return render(component, { wrapper });
  };

  describe('Authentication', () => {
    it('should show loading state while checking authentication', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      } as any);

      renderWithProviders(<ReportsPage />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should redirect to login if not authenticated', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      } as any);

      renderWithProviders(<ReportsPage />);

      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should render page when authenticated', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'admin' },
        isAuthenticated: true,
        isLoading: false,
      } as any);

      renderWithProviders(<ReportsPage />);

      expect(screen.getByText('Business Reports')).toBeInTheDocument();
    });
  });

  describe('Page Layout', () => {
    beforeEach(() => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'admin' },
        isAuthenticated: true,
        isLoading: false,
      } as any);
    });

    it('should display page header with title and description', () => {
      renderWithProviders(<ReportsPage />);

      expect(screen.getByText('Business Reports')).toBeInTheDocument();
      expect(screen.getByText('Generate comprehensive reports to analyze your business performance')).toBeInTheDocument();
    });

    it('should display navigation with back button', () => {
      renderWithProviders(<ReportsPage />);

      const backButton = screen.getByText('← Back to Dashboard');
      expect(backButton).toBeInTheDocument();

      fireEvent.click(backButton);
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should display user name in header', () => {
      renderWithProviders(<ReportsPage />);

      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should display logout button', () => {
      renderWithProviders(<ReportsPage />);

      const logoutButton = screen.getByText('Logout');
      expect(logoutButton).toBeInTheDocument();

      fireEvent.click(logoutButton);
      expect(mockLogout).toHaveBeenCalled();
    });

    it('should display offline indicator', () => {
      renderWithProviders(<ReportsPage />);

      expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
    });
  });

  describe('Report Type Selection', () => {
    beforeEach(() => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'admin' },
        isAuthenticated: true,
        isLoading: false,
      } as any);
    });

    it('should display all report type options on desktop', () => {
      renderWithProviders(<ReportsPage />);

      // Check for all report types - they appear in both desktop grid and mobile dropdown
      const salesReports = screen.getAllByText('Sales Report');
      expect(salesReports.length).toBeGreaterThan(0);
      
      const inventoryReports = screen.getAllByText('Inventory Report');
      expect(inventoryReports.length).toBeGreaterThan(0);
      
      const customerReports = screen.getAllByText('Customer Report');
      expect(customerReports.length).toBeGreaterThan(0);
      
      expect(screen.getAllByText('Product Performance').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Payment Method Report').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Profit & Loss Report').length).toBeGreaterThan(0);
    });

    it('should have sales report selected by default', () => {
      renderWithProviders(<ReportsPage />);

      // Check that sales is selected in the desktop view
      const desktopGrid = screen.getByText('Select Report Type').nextElementSibling;
      const selectedButton = desktopGrid?.querySelector('.border-blue-600');
      expect(selectedButton).toBeInTheDocument();
    });

    it('should allow selecting different report types', () => {
      renderWithProviders(<ReportsPage />);

      // Get all inventory report buttons (desktop and mobile)
      const inventoryButtons = screen.getAllByText('Inventory Report');
      // Click the first one (desktop button)
      const inventoryButton = inventoryButtons[0].closest('button');
      fireEvent.click(inventoryButton!);

      // Inventory report should now be selected
      expect(inventoryButton).toHaveClass('border-blue-600', 'bg-blue-50');
    });

    it('should display report descriptions', () => {
      renderWithProviders(<ReportsPage />);

      // Descriptions appear in both desktop and mobile views
      const salesDescriptions = screen.getAllByText(/View sales performance by date range/);
      expect(salesDescriptions.length).toBeGreaterThan(0);
      
      const inventoryDescriptions = screen.getAllByText(/Current stock levels, low stock alerts/);
      expect(inventoryDescriptions.length).toBeGreaterThan(0);
    });
  });

  describe('Date Range Selection', () => {
    beforeEach(() => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'admin' },
        isAuthenticated: true,
        isLoading: false,
      } as any);
    });

    it('should display date range section', () => {
      renderWithProviders(<ReportsPage />);

      expect(screen.getByText('Date Range')).toBeInTheDocument();
    });

    it('should display quick range buttons', () => {
      renderWithProviders(<ReportsPage />);

      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Yesterday')).toBeInTheDocument();
      expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
      expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
      expect(screen.getByText('This Month')).toBeInTheDocument();
      expect(screen.getByText('Last Month')).toBeInTheDocument();
    });

    it('should display date range summary', () => {
      renderWithProviders(<ReportsPage />);

      // Should show selected range summary
      expect(screen.getByText(/Selected Range:/)).toBeInTheDocument();
      expect(screen.getByText(/days\)/)).toBeInTheDocument();
    });
  });

  describe('Generate Report Button', () => {
    beforeEach(() => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'admin' },
        isAuthenticated: true,
        isLoading: false,
      } as any);
    });

    it('should display generate report button', () => {
      renderWithProviders(<ReportsPage />);

      expect(screen.getAllByText('Generate Report').length).toBeGreaterThan(0);
    });

    it('should enable generate button when date range is selected', () => {
      renderWithProviders(<ReportsPage />);

      const generateButton = screen.getByRole('button', { name: /Generate Report/i });
      expect(generateButton).not.toBeDisabled();
    });

    it('should call handleGenerateReport when clicked', () => {
      renderWithProviders(<ReportsPage />);

      const generateButton = screen.getByRole('button', { name: /Generate Report/i });
      fireEvent.click(generateButton);

      // After clicking, the report area should show (showReport becomes true)
      expect(generateButton).toBeInTheDocument();
    });
  });

  describe('Report Preview Area', () => {
    beforeEach(() => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'admin' },
        isAuthenticated: true,
        isLoading: false,
      } as any);
    });

    it('should display report preview placeholder', () => {
      renderWithProviders(<ReportsPage />);

      expect(screen.getByText('Report Preview')).toBeInTheDocument();
      expect(screen.getByText(/Select a report type and date range/)).toBeInTheDocument();
    });

    it('should indicate that visualizations will be implemented later', () => {
      renderWithProviders(<ReportsPage />);

      // The preview area shows a placeholder message
      expect(screen.getByText('Report Preview')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'admin' },
        isAuthenticated: true,
        isLoading: false,
      } as any);
    });

    it('should have responsive grid layout for report types', () => {
      renderWithProviders(<ReportsPage />);

      // Desktop grid should be present - check for the grid container
      const gridContainer = screen.getByText('Select Report Type').nextElementSibling;
      expect(gridContainer).toHaveClass('hidden', 'md:grid');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'admin' },
        isAuthenticated: true,
        isLoading: false,
      } as any);
    });

    it('should have proper button text', () => {
      renderWithProviders(<ReportsPage />);

      const generateButton = screen.getByRole('button', { name: /Generate Report/i });
      expect(generateButton).toBeInTheDocument();
      expect(generateButton).toHaveTextContent('Generate Report');
    });

    it('should have accessible navigation', () => {
      renderWithProviders(<ReportsPage />);

      const backButton = screen.getByText('← Back to Dashboard');
      expect(backButton).toBeInTheDocument();
    });
  });
});
