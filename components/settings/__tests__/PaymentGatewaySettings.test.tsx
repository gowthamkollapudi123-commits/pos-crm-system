/**
 * PaymentGatewaySettings Component Tests
 *
 * Requirements: 13.4, 13.9
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import {
  PaymentGatewaySettings,
  PAYMENT_GATEWAY_SETTINGS_KEY,
} from '../PaymentGatewaySettings';

vi.mock('sonner');

describe('PaymentGatewaySettings', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Renders all form fields', () => {
    it('renders mode radio buttons', () => {
      render(<PaymentGatewaySettings />);
      expect(screen.getByRole('radio', { name: /test mode/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /live mode/i })).toBeInTheDocument();
    });

    it('renders test key fields', () => {
      render(<PaymentGatewaySettings />);
      expect(screen.getByLabelText(/test key id/i)).toBeInTheDocument();
      expect(document.getElementById('testKeySecret')).toBeInTheDocument();
    });

    it('renders live key fields', () => {
      render(<PaymentGatewaySettings />);
      expect(screen.getByLabelText(/live key id/i)).toBeInTheDocument();
      expect(document.getElementById('liveKeySecret')).toBeInTheDocument();
    });

    it('renders currency select', () => {
      render(<PaymentGatewaySettings />);
      expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    });

    it('renders enable razorpay toggle', () => {
      render(<PaymentGatewaySettings />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('renders a save button', () => {
      render(<PaymentGatewaySettings />);
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });
  });

  describe('Live mode warning', () => {
    it('does not show live mode warning in test mode by default', () => {
      render(<PaymentGatewaySettings />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows live mode warning when live mode is selected', async () => {
      const user = userEvent.setup();
      render(<PaymentGatewaySettings />);

      await user.click(screen.getByRole('radio', { name: /live mode/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/live mode active/i)).toBeInTheDocument();
      });
    });

    it('hides live mode warning when switching back to test mode', async () => {
      const user = userEvent.setup();
      render(<PaymentGatewaySettings />);

      await user.click(screen.getByRole('radio', { name: /live mode/i }));
      await user.click(screen.getByRole('radio', { name: /test mode/i }));

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('Saves to localStorage on submit', () => {
    it('saves form data to localStorage with correct key in test mode', async () => {
      const user = userEvent.setup();
      render(<PaymentGatewaySettings />);

      await user.type(screen.getByLabelText(/test key id/i), 'rzp_test_abc123');
      await user.type(document.getElementById('testKeySecret')!, 'secret_test_xyz');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        const stored = localStorage.getItem(PAYMENT_GATEWAY_SETTINGS_KEY);
        expect(stored).not.toBeNull();
        const parsed = JSON.parse(stored!);
        expect(parsed.mode).toBe('test');
        expect(parsed.testKeyId).toBe('rzp_test_abc123');
        expect(parsed.testKeySecret).toBe('secret_test_xyz');
      });
    });

    it('saves live mode data to localStorage', async () => {
      const user = userEvent.setup();
      render(<PaymentGatewaySettings />);

      await user.click(screen.getByRole('radio', { name: /live mode/i }));
      await user.type(screen.getByLabelText(/live key id/i), 'rzp_live_abc123');
      await user.type(document.getElementById('liveKeySecret')!, 'secret_live_xyz');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        const stored = localStorage.getItem(PAYMENT_GATEWAY_SETTINGS_KEY);
        expect(stored).not.toBeNull();
        const parsed = JSON.parse(stored!);
        expect(parsed.mode).toBe('live');
        expect(parsed.liveKeyId).toBe('rzp_live_abc123');
        expect(parsed.liveKeySecret).toBe('secret_live_xyz');
      });
    });
  });

  describe('Shows success toast on save', () => {
    it('calls toast.success after successful save', async () => {
      const user = userEvent.setup();
      render(<PaymentGatewaySettings />);

      await user.type(screen.getByLabelText(/test key id/i), 'rzp_test_abc123');
      await user.type(document.getElementById('testKeySecret')!, 'secret_test_xyz');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Payment gateway settings saved successfully'
        );
      });
    });
  });

  describe('Loads saved values on mount', () => {
    it('pre-fills form with values from localStorage', async () => {
      const saved = {
        mode: 'test',
        testKeyId: 'rzp_test_saved',
        testKeySecret: 'secret_saved',
        liveKeyId: '',
        liveKeySecret: '',
        currency: 'USD',
        enableRazorpay: true,
      };
      localStorage.setItem(PAYMENT_GATEWAY_SETTINGS_KEY, JSON.stringify(saved));

      render(<PaymentGatewaySettings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/test key id/i)).toHaveValue('rzp_test_saved');
        expect(screen.getByLabelText(/currency/i)).toHaveValue('USD');
        expect(screen.getByRole('checkbox')).toBeChecked();
      });
    });

    it('renders with empty fields when no saved data exists', () => {
      render(<PaymentGatewaySettings />);
      expect(screen.getByLabelText(/test key id/i)).toHaveValue('');
      expect(screen.getByLabelText(/live key id/i)).toHaveValue('');
    });
  });

  describe('Password fields', () => {
    it('test key secret has type password by default', () => {
      render(<PaymentGatewaySettings />);
      expect(document.getElementById('testKeySecret')).toHaveAttribute('type', 'password');
    });

    it('live key secret has type password by default', () => {
      render(<PaymentGatewaySettings />);
      expect(document.getElementById('liveKeySecret')).toHaveAttribute('type', 'password');
    });

    it('toggles test key secret visibility', async () => {
      const user = userEvent.setup();
      render(<PaymentGatewaySettings />);

      const secretInput = document.getElementById('testKeySecret')!;
      expect(secretInput).toHaveAttribute('type', 'password');

      await user.click(screen.getByRole('button', { name: /show test key secret/i }));
      expect(secretInput).toHaveAttribute('type', 'text');

      await user.click(screen.getByRole('button', { name: /hide test key secret/i }));
      expect(secretInput).toHaveAttribute('type', 'password');
    });

    it('toggles live key secret visibility', async () => {
      const user = userEvent.setup();
      render(<PaymentGatewaySettings />);

      const secretInput = document.getElementById('liveKeySecret')!;
      expect(secretInput).toHaveAttribute('type', 'password');

      await user.click(screen.getByRole('button', { name: /show live key secret/i }));
      expect(secretInput).toHaveAttribute('type', 'text');
    });
  });

  describe('Validation', () => {
    it('shows error when test key id is empty in test mode', async () => {
      const user = userEvent.setup();
      render(<PaymentGatewaySettings />);

      // Only fill secret, leave key id empty
      await user.type(document.getElementById('testKeySecret')!, 'some_secret');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/test key id is required in test mode/i)
        ).toBeInTheDocument();
      });
    });

    it('shows error when live key id is empty in live mode', async () => {
      const user = userEvent.setup();
      render(<PaymentGatewaySettings />);

      await user.click(screen.getByRole('radio', { name: /live mode/i }));
      await user.type(document.getElementById('liveKeySecret')!, 'some_secret');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/live key id is required in live mode/i)
        ).toBeInTheDocument();
      });
    });
  });
});
