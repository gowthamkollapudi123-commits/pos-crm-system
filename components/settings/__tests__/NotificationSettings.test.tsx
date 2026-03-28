/**
 * NotificationSettings Component Tests
 *
 * Requirements: 13.5, 13.9
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { NotificationSettings, NOTIFICATION_SETTINGS_KEY } from '../NotificationSettings';

vi.mock('sonner');

describe('NotificationSettings', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Renders all fields', () => {
    it('renders all toggle switches', () => {
      render(<NotificationSettings />);

      expect(screen.getByRole('switch', { name: /low stock alerts/i })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /failed sync notifications/i })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /transaction completion/i })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /overdue follow-up tasks/i })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /email notifications/i })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /browser notifications/i })).toBeInTheDocument();
    });

    it('renders the notification email field', () => {
      render(<NotificationSettings />);
      expect(screen.getByLabelText(/notification email address/i)).toBeInTheDocument();
    });

    it('renders a save button', () => {
      render(<NotificationSettings />);
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });
  });

  describe('Saves to localStorage on submit', () => {
    it('saves settings to localStorage with correct key', async () => {
      const user = userEvent.setup();
      render(<NotificationSettings />);

      await user.type(
        screen.getByLabelText(/notification email address/i),
        'alerts@business.com'
      );
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
        expect(stored).not.toBeNull();
        const parsed = JSON.parse(stored!);
        expect(parsed.notificationEmail).toBe('alerts@business.com');
      });
    });

    it('saves toggle states to localStorage', async () => {
      const user = userEvent.setup();
      render(<NotificationSettings />);

      // Turn off low stock alerts (it's on by default)
      await user.click(screen.getByRole('switch', { name: /low stock alerts/i }));
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
        const parsed = JSON.parse(stored!);
        expect(parsed.lowStockAlerts).toBe(false);
      });
    });
  });

  describe('Shows success toast on save', () => {
    it('calls toast.success after successful save', async () => {
      const user = userEvent.setup();
      render(<NotificationSettings />);

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Notification preferences saved successfully');
      });
    });
  });

  describe('Loads saved values on mount', () => {
    it('pre-fills form with values from localStorage', async () => {
      const saved = {
        lowStockAlerts: false,
        failedSyncNotifications: true,
        transactionCompletion: false,
        overdueFollowUpTasks: true,
        emailNotifications: true,
        browserNotifications: false,
        notificationEmail: 'saved@example.com',
      };
      localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(saved));

      render(<NotificationSettings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/notification email address/i)).toHaveValue(
          'saved@example.com'
        );
        expect(screen.getByRole('switch', { name: /low stock alerts/i })).toHaveAttribute(
          'aria-checked',
          'false'
        );
        expect(screen.getByRole('switch', { name: /email notifications/i })).toHaveAttribute(
          'aria-checked',
          'true'
        );
      });
    });
  });

  describe('Validates email field', () => {
    it('shows error for invalid email format', async () => {
      const user = userEvent.setup();
      render(<NotificationSettings />);

      await user.type(screen.getByLabelText(/notification email address/i), 'not-an-email');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    });
  });
});
