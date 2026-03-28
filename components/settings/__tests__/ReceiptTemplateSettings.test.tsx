/**
 * ReceiptTemplateSettings Component Tests
 *
 * Requirements: 13.3, 13.9
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import {
  ReceiptTemplateSettings,
  RECEIPT_TEMPLATE_SETTINGS_KEY,
} from '../ReceiptTemplateSettings';

vi.mock('sonner');

describe('ReceiptTemplateSettings', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Renders all form fields', () => {
    it('renders all expected fields', () => {
      render(<ReceiptTemplateSettings />);

      expect(screen.getByLabelText(/receipt title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/paper size/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/header text/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/footer text/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show logo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show business address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show tax breakdown/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show order number/i)).toBeInTheDocument();
    });

    it('renders a save button', () => {
      render(<ReceiptTemplateSettings />);
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('renders paper size options', () => {
      render(<ReceiptTemplateSettings />);
      const select = screen.getByLabelText(/paper size/i);
      expect(select).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /58mm/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /80mm/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /A4/i })).toBeInTheDocument();
    });
  });

  describe('Shows receipt preview panel', () => {
    it('renders the live preview panel', () => {
      render(<ReceiptTemplateSettings />);
      expect(screen.getByLabelText(/receipt preview/i)).toBeInTheDocument();
    });

    it('shows the default receipt title in the preview', () => {
      render(<ReceiptTemplateSettings />);
      // The preview should show the default title "RECEIPT"
      const previews = screen.getAllByText('RECEIPT');
      expect(previews.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Preview updates when form values change', () => {
    it('updates preview when receipt title changes', async () => {
      const user = userEvent.setup();
      render(<ReceiptTemplateSettings />);

      const titleInput = screen.getByLabelText(/receipt title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'TAX INVOICE');

      await waitFor(() => {
        expect(screen.getByText('TAX INVOICE')).toBeInTheDocument();
      });
    });

    it('shows footer text in preview when typed', async () => {
      const user = userEvent.setup();
      render(<ReceiptTemplateSettings />);

      const footerInput = screen.getByLabelText(/footer text/i);
      await user.clear(footerInput);
      await user.type(footerInput, 'Come back soon!');

      await waitFor(() => {
        expect(screen.getByText('Come back soon!')).toBeInTheDocument();
      });
    });

    it('hides logo placeholder when show logo is unchecked', async () => {
      const user = userEvent.setup();
      render(<ReceiptTemplateSettings />);

      const logoCheckbox = screen.getByLabelText(/show logo/i);
      // Default is checked — uncheck it
      if ((logoCheckbox as HTMLInputElement).checked) {
        await user.click(logoCheckbox);
      }

      await waitFor(() => {
        expect(screen.queryByText('LOGO')).not.toBeInTheDocument();
      });
    });
  });

  describe('Validates required fields', () => {
    it('shows error when receipt title is empty on submit', async () => {
      const user = userEvent.setup();
      render(<ReceiptTemplateSettings />);

      const titleInput = screen.getByLabelText(/receipt title/i);
      await user.clear(titleInput);
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/receipt title is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Saves to localStorage on submit', () => {
    it('saves form data to localStorage with correct key', async () => {
      const user = userEvent.setup();
      render(<ReceiptTemplateSettings />);

      const titleInput = screen.getByLabelText(/receipt title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'TAX INVOICE');

      const headerInput = screen.getByLabelText(/header text/i);
      await user.type(headerInput, 'Welcome!');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        const stored = localStorage.getItem(RECEIPT_TEMPLATE_SETTINGS_KEY);
        expect(stored).not.toBeNull();
        const parsed = JSON.parse(stored!);
        expect(parsed.receiptTitle).toBe('TAX INVOICE');
        expect(parsed.headerText).toBe('Welcome!');
      });
    });

    it('saves boolean toggle values correctly', async () => {
      const user = userEvent.setup();
      render(<ReceiptTemplateSettings />);

      // Uncheck showLogo
      const logoCheckbox = screen.getByLabelText(/show logo/i);
      if ((logoCheckbox as HTMLInputElement).checked) {
        await user.click(logoCheckbox);
      }

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        const stored = localStorage.getItem(RECEIPT_TEMPLATE_SETTINGS_KEY);
        expect(stored).not.toBeNull();
        const parsed = JSON.parse(stored!);
        expect(parsed.showLogo).toBe(false);
      });
    });

    it('saves selected paper size', async () => {
      const user = userEvent.setup();
      render(<ReceiptTemplateSettings />);

      await user.selectOptions(screen.getByLabelText(/paper size/i), 'A4');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        const stored = localStorage.getItem(RECEIPT_TEMPLATE_SETTINGS_KEY);
        expect(stored).not.toBeNull();
        const parsed = JSON.parse(stored!);
        expect(parsed.paperSize).toBe('A4');
      });
    });
  });

  describe('Shows success toast on save', () => {
    it('calls toast.success after successful save', async () => {
      const user = userEvent.setup();
      render(<ReceiptTemplateSettings />);

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Receipt template saved successfully');
      });
    });
  });

  describe('Loads saved values on mount', () => {
    it('pre-fills form with values from localStorage', async () => {
      const saved = {
        headerText: 'Welcome to our store',
        footerText: 'See you again!',
        showLogo: false,
        showBusinessAddress: false,
        showTaxBreakdown: true,
        showOrderNumber: true,
        receiptTitle: 'TAX INVOICE',
        paperSize: '58mm',
      };
      localStorage.setItem(RECEIPT_TEMPLATE_SETTINGS_KEY, JSON.stringify(saved));

      render(<ReceiptTemplateSettings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/receipt title/i)).toHaveValue('TAX INVOICE');
        expect(screen.getByLabelText(/header text/i)).toHaveValue('Welcome to our store');
        expect(screen.getByLabelText(/footer text/i)).toHaveValue('See you again!');
        expect(screen.getByLabelText(/paper size/i)).toHaveValue('58mm');
        expect(screen.getByLabelText(/show logo/i)).not.toBeChecked();
        expect(screen.getByLabelText(/show business address/i)).not.toBeChecked();
      });
    });

    it('renders with default values when no saved data exists', () => {
      render(<ReceiptTemplateSettings />);
      expect(screen.getByLabelText(/receipt title/i)).toHaveValue('RECEIPT');
      expect(screen.getByLabelText(/paper size/i)).toHaveValue('80mm');
      expect(screen.getByLabelText(/show logo/i)).toBeChecked();
    });
  });
});
