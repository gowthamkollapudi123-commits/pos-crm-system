/**
 * BusinessInfoSettings Component Tests
 *
 * Requirements: 13.1, 13.9, 13.10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { BusinessInfoSettings, BUSINESS_SETTINGS_KEY } from '../BusinessInfoSettings';

vi.mock('sonner');

describe('BusinessInfoSettings', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Renders all form fields', () => {
    it('renders all expected fields', () => {
      render(<BusinessInfoSettings />);

      expect(screen.getByLabelText(/business name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/address line 2/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/postal code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tax id/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/website/i)).toBeInTheDocument();
    });

    it('renders a save button', () => {
      render(<BusinessInfoSettings />);
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });
  });

  describe('Validates required fields', () => {
    it('shows error when business name is empty on submit', async () => {
      const user = userEvent.setup();
      render(<BusinessInfoSettings />);

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/business name is required/i)).toBeInTheDocument();
      });
    });

    it('shows error for invalid email format', async () => {
      const user = userEvent.setup();
      render(<BusinessInfoSettings />);

      await user.type(screen.getByLabelText(/business name/i), 'Acme Corp');
      await user.type(screen.getByLabelText(/email/i), 'not-an-email');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    });

    it('does not show error when business name is provided', async () => {
      const user = userEvent.setup();
      render(<BusinessInfoSettings />);

      await user.type(screen.getByLabelText(/business name/i), 'Acme Corp');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.queryByText(/business name is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Saves to localStorage on submit', () => {
    it('saves form data to localStorage with correct key', async () => {
      const user = userEvent.setup();
      render(<BusinessInfoSettings />);

      await user.type(screen.getByLabelText(/business name/i), 'Acme Corp');
      await user.type(screen.getByLabelText(/address line 1/i), '123 Main St');
      await user.type(screen.getByLabelText(/city/i), 'Springfield');
      await user.type(screen.getByLabelText(/tax id/i), 'GST123456');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        const stored = localStorage.getItem(BUSINESS_SETTINGS_KEY);
        expect(stored).not.toBeNull();
        const parsed = JSON.parse(stored!);
        expect(parsed.businessName).toBe('Acme Corp');
        expect(parsed.addressLine1).toBe('123 Main St');
        expect(parsed.city).toBe('Springfield');
        expect(parsed.taxId).toBe('GST123456');
      });
    });
  });

  describe('Shows success toast on save', () => {
    it('calls toast.success after successful save', async () => {
      const user = userEvent.setup();
      render(<BusinessInfoSettings />);

      await user.type(screen.getByLabelText(/business name/i), 'Acme Corp');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Business information saved successfully');
      });
    });
  });

  describe('Loads saved values on mount', () => {
    it('pre-fills form with values from localStorage', async () => {
      const saved = {
        businessName: 'Saved Business',
        addressLine1: '456 Oak Ave',
        city: 'Shelbyville',
        state: 'IL',
        postalCode: '62565',
        country: 'US',
        phone: '+1-555-1234',
        email: 'info@saved.com',
        taxId: 'TAX-9999',
        website: 'https://saved.com',
      };
      localStorage.setItem(BUSINESS_SETTINGS_KEY, JSON.stringify(saved));

      render(<BusinessInfoSettings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/business name/i)).toHaveValue('Saved Business');
        expect(screen.getByLabelText(/address line 1/i)).toHaveValue('456 Oak Ave');
        expect(screen.getByLabelText(/city/i)).toHaveValue('Shelbyville');
        expect(screen.getByLabelText(/tax id/i)).toHaveValue('TAX-9999');
        expect(screen.getByLabelText(/email/i)).toHaveValue('info@saved.com');
      });
    });

    it('renders with empty fields when no saved data exists', () => {
      render(<BusinessInfoSettings />);
      expect(screen.getByLabelText(/business name/i)).toHaveValue('');
    });
  });
});
