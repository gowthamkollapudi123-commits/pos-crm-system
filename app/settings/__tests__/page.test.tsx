/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Settings Page Tests
 *
 * Tests for the settings page layout, tabbed navigation, and auth guard.
 *
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import SettingsPage from '../page';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useAuth } from '@/hooks';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// Mock dependencies
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/components/providers/AuthProvider');
vi.mock('@/hooks');
vi.mock('@/hooks/useNetworkStatus');

vi.mock('@/components/offline/OfflineIndicator', () => ({
  OfflineIndicator: () =>
    React.createElement('div', { 'data-testid': 'offline-indicator' }, 'Offline Indicator'),
}));

const AUTHENTICATED_USER = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin',
};

describe('SettingsPage', () => {
  const mockLogout = vi.fn();
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.mocked(useAuth).mockReturnValue({ logout: mockLogout } as any);
    vi.mocked(useNetworkStatus).mockReturnValue({ isOnline: true } as any);
    vi.clearAllMocks();
  });

  const renderPage = () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
    return render(<SettingsPage />, { wrapper });
  };

  // ─── Authentication ────────────────────────────────────────────────────────

  describe('Authentication', () => {
    it('shows loading spinner while auth is resolving', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      } as any);

      renderPage();

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('redirects to /login when not authenticated', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      } as any);

      renderPage();

      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('renders the page when authenticated', () => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: AUTHENTICATED_USER,
        isAuthenticated: true,
        isLoading: false,
      } as any);

      renderPage();

      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });
  });

  // ─── Page Layout ──────────────────────────────────────────────────────────

  describe('Page Layout', () => {
    beforeEach(() => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: AUTHENTICATED_USER,
        isAuthenticated: true,
        isLoading: false,
      } as any);
    });

    it('displays the page heading', () => {
      renderPage();
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    it('displays the page sub-heading', () => {
      renderPage();
      expect(
        screen.getByText('Configure your business settings and preferences'),
      ).toBeInTheDocument();
    });

    it('displays a back-to-dashboard button', () => {
      renderPage();
      const back = screen.getByText('← Back to Dashboard');
      expect(back).toBeInTheDocument();
    });

    it('navigates to /dashboard when back button is clicked', () => {
      renderPage();
      fireEvent.click(screen.getByText('← Back to Dashboard'));
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('displays the logged-in user name', () => {
      renderPage();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('calls logout when logout button is clicked', () => {
      renderPage();
      fireEvent.click(screen.getByText('Logout'));
      expect(mockLogout).toHaveBeenCalled();
    });

    it('renders the offline indicator', () => {
      renderPage();
      expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
    });
  });

  // ─── Tabs ─────────────────────────────────────────────────────────────────

  describe('Tabbed Navigation', () => {
    beforeEach(() => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: AUTHENTICATED_USER,
        isAuthenticated: true,
        isLoading: false,
      } as any);
    });

    const ALL_TABS = [
      'Business Info',
      'Tax Settings',
      'Receipt Templates',
      'Payment Gateway',
      'Notifications',
      'Inventory',
      'Branding',
      'Users & Roles',
    ];

    it('renders all 8 tabs', () => {
      renderPage();
      ALL_TABS.forEach((label) => {
        expect(screen.getByRole('tab', { name: new RegExp(label) })).toBeInTheDocument();
      });
    });

    it('has "Business Info" as the default active tab', () => {
      renderPage();
      const tab = screen.getByRole('tab', { name: /Business Info/ });
      expect(tab).toHaveAttribute('aria-selected', 'true');
      expect(tab).toHaveClass('border-blue-600', 'text-blue-600');
    });

    it('switches active tab when another tab is clicked', () => {
      renderPage();

      const taxTab = screen.getByRole('tab', { name: /Tax Settings/ });
      fireEvent.click(taxTab);

      expect(taxTab).toHaveAttribute('aria-selected', 'true');
      expect(taxTab).toHaveClass('border-blue-600', 'text-blue-600');

      // Previous tab should no longer be active
      const businessTab = screen.getByRole('tab', { name: /Business Info/ });
      expect(businessTab).toHaveAttribute('aria-selected', 'false');
    });

    it('updates the tab panel heading when switching tabs', () => {
      renderPage();

      fireEvent.click(screen.getByRole('tab', { name: /Payment Gateway/ }));
      const panel = screen.getByRole('tabpanel');
      expect(panel).toBeInTheDocument();
      // The panel heading should contain the tab label
      expect(panel.querySelector('h3')?.textContent).toBe('Payment Gateway');
    });

    it('shows a placeholder panel for each tab', () => {
      renderPage();

      ALL_TABS.forEach((label) => {
        fireEvent.click(screen.getByRole('tab', { name: new RegExp(label) }));
        expect(screen.getByRole('tabpanel')).toBeInTheDocument();
      });
    });

    it('links each tab button to its panel via aria attributes', () => {
      renderPage();

      // Click Branding tab so its panel is rendered
      const tab = screen.getByRole('tab', { name: /Branding/ });
      fireEvent.click(tab);

      const panelId = tab.getAttribute('aria-controls');
      expect(panelId).toBeTruthy();

      const panel = screen.getByRole('tabpanel');
      expect(panel).toBeInTheDocument();
      expect(panel).toHaveAttribute('id', panelId!);
    });
  });

  // ─── Responsive Design ────────────────────────────────────────────────────

  describe('Responsive Design', () => {
    beforeEach(() => {
      vi.mocked(useAuthContext).mockReturnValue({
        user: AUTHENTICATED_USER,
        isAuthenticated: true,
        isLoading: false,
      } as any);
    });

    it('tab list container allows horizontal scrolling on mobile', () => {
      renderPage();
      const nav = screen.getByRole('tablist');
      // The wrapping div has overflow-x-auto
      expect(nav.parentElement).toHaveClass('overflow-x-auto');
    });

    it('tab buttons do not wrap (whitespace-nowrap)', () => {
      renderPage();
      const tabs = screen.getAllByRole('tab');
      tabs.forEach((tab) => {
        expect(tab).toHaveClass('whitespace-nowrap');
      });
    });
  });
});
