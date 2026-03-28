/**
 * TaxSettings Component Tests
 *
 * Requirements: 13.2, 13.9
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { TaxSettings, TAX_SETTINGS_KEY } from '../TaxSettings';

vi.mock('sonner');

describe('TaxSettings', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Renders all form fields', () => {
    it('renders all expected fields', () => {
      render(<TaxSettings />);

      expect(screen.getByLabelText(/enable tax/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tax name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/default tax rate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tax calculation method/i)).toBeInTheDocument();
    });

    it('renders a save button', () => {
      render(<TaxSettings />);
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('renders an Add Rate button', () => {
      render(<TaxSettings />);
      expect(screen.getByRole('button', { name: /add rate/i })).toBeInTheDocument();
    });

    it('renders calculation method options', () => {
      render(<TaxSettings />);
      const select = screen.getByLabelText(/tax calculation method/i);
      expect(select).toBeInTheDocument();
      expect(screen.getByText(/exclusive/i)).toBeInTheDocument();
      expect(screen.getByText(/inclusive/i)).toBeInTheDocument();
    });
  });

  describe('Validates required fields and rate range', () => {
    it('shows error when tax name is empty on submit', async () => {
      const user = userEvent.setup();
      render(<TaxSettings />);

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/tax name is required/i)).toBeInTheDocument();
      });
    });

    it('shows error when default tax rate exceeds 100', async () => {
      const user = userEvent.setup();
      render(<TaxSettings />);

      await user.type(screen.getByLabelText(/tax name/i), 'GST');
      const rateInput = screen.getByLabelText(/default tax rate/i);
      await user.clear(rateInput);
      await user.type(rateInput, '150');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/rate must be at most 100/i)).toBeInTheDocument();
      });
    });

    it('shows error when default tax rate is negative', async () => {
      const user = userEvent.setup();
      render(<TaxSettings />);

      await user.type(screen.getByLabelText(/tax name/i), 'GST');
      const rateInput = screen.getByLabelText(/default tax rate/i);
      await user.clear(rateInput);
      await user.type(rateInput, '-5');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/rate must be at least 0/i)).toBeInTheDocument();
      });
    });

    it('does not show errors when valid data is provided', async () => {
      const user = userEvent.setup();
      render(<TaxSettings />);

      await user.type(screen.getByLabelText(/tax name/i), 'GST');
      const rateInput = screen.getByLabelText(/default tax rate/i);
      await user.clear(rateInput);
      await user.type(rateInput, '18');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.queryByText(/tax name is required/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/rate must be/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Saves to localStorage on submit', () => {
    it('saves form data to localStorage with correct key', async () => {
      const user = userEvent.setup();
      render(<TaxSettings />);

      await user.type(screen.getByLabelText(/tax name/i), 'GST');
      const rateInput = screen.getByLabelText(/default tax rate/i);
      await user.clear(rateInput);
      await user.type(rateInput, '18');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        const stored = localStorage.getItem(TAX_SETTINGS_KEY);
        expect(stored).not.toBeNull();
        const parsed = JSON.parse(stored!);
        expect(parsed.taxName).toBe('GST');
        expect(parsed.defaultTaxRate).toBe(18);
      });
    });

    it('saves calculation method to localStorage', async () => {
      const user = userEvent.setup();
      render(<TaxSettings />);

      await user.type(screen.getByLabelText(/tax name/i), 'VAT');
      const rateInput = screen.getByLabelText(/default tax rate/i);
      await user.clear(rateInput);
      await user.type(rateInput, '20');
      await user.selectOptions(screen.getByLabelText(/tax calculation method/i), 'inclusive');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        const stored = localStorage.getItem(TAX_SETTINGS_KEY);
        const parsed = JSON.parse(stored!);
        expect(parsed.taxCalculationMethod).toBe('inclusive');
      });
    });

    it('saves additional tax rates to localStorage', async () => {
      const user = userEvent.setup();
      render(<TaxSettings />);

      await user.type(screen.getByLabelText(/tax name/i), 'GST');
      const rateInput = screen.getByLabelText(/default tax rate/i);
      await user.clear(rateInput);
      await user.type(rateInput, '18');

      // Add an additional rate
      await user.click(screen.getByRole('button', { name: /add rate/i }));
      const nameInputs = screen.getAllByPlaceholderText(/e\.g\., CGST/i);
      await user.type(nameInputs[0], 'CGST');
      const additionalRateInputs = screen.getAllByPlaceholderText(/e\.g\., 9/i);
      await user.clear(additionalRateInputs[0]);
      await user.type(additionalRateInputs[0], '9');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        const stored = localStorage.getItem(TAX_SETTINGS_KEY);
        const parsed = JSON.parse(stored!);
        expect(parsed.additionalRates).toHaveLength(1);
        expect(parsed.additionalRates[0].name).toBe('CGST');
        expect(parsed.additionalRates[0].rate).toBe(9);
      });
    });
  });

  describe('Shows success toast on save', () => {
    it('calls toast.success after successful save', async () => {
      const user = userEvent.setup();
      render(<TaxSettings />);

      await user.type(screen.getByLabelText(/tax name/i), 'GST');
      const rateInput = screen.getByLabelText(/default tax rate/i);
      await user.clear(rateInput);
      await user.type(rateInput, '18');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Tax settings saved successfully');
      });
    });
  });

  describe('Loads saved values on mount', () => {
    it('pre-fills form with values from localStorage', async () => {
      const saved = {
        defaultTaxRate: 18,
        taxName: 'GST',
        taxCalculationMethod: 'inclusive',
        enableTax: true,
        additionalRates: [],
      };
      localStorage.setItem(TAX_SETTINGS_KEY, JSON.stringify(saved));

      render(<TaxSettings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/tax name/i)).toHaveValue('GST');
        expect(screen.getByLabelText(/default tax rate/i)).toHaveValue(18);
        expect(screen.getByLabelText(/tax calculation method/i)).toHaveValue('inclusive');
        expect(screen.getByLabelText(/enable tax/i)).toBeChecked();
      });
    });

    it('renders with default values when no saved data exists', () => {
      render(<TaxSettings />);
      expect(screen.getByLabelText(/tax name/i)).toHaveValue('');
      expect(screen.getByLabelText(/default tax rate/i)).toHaveValue(0);
    });

    it('pre-fills additional rates from localStorage', async () => {
      const saved = {
        defaultTaxRate: 18,
        taxName: 'GST',
        taxCalculationMethod: 'exclusive',
        enableTax: true,
        additionalRates: [
          { name: 'CGST', rate: 9 },
          { name: 'SGST', rate: 9 },
        ],
      };
      localStorage.setItem(TAX_SETTINGS_KEY, JSON.stringify(saved));

      render(<TaxSettings />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('CGST')).toBeInTheDocument();
        expect(screen.getByDisplayValue('SGST')).toBeInTheDocument();
      });
    });
  });

  describe('Additional tax rates management', () => {
    it('adds a new rate row when Add Rate is clicked', async () => {
      const user = userEvent.setup();
      render(<TaxSettings />);

      expect(screen.queryByPlaceholderText(/e\.g\., CGST/i)).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /add rate/i }));

      expect(screen.getByPlaceholderText(/e\.g\., CGST/i)).toBeInTheDocument();
    });

    it('removes a rate row when remove button is clicked', async () => {
      const user = userEvent.setup();
      render(<TaxSettings />);

      await user.click(screen.getByRole('button', { name: /add rate/i }));
      expect(screen.getByPlaceholderText(/e\.g\., CGST/i)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /remove tax rate 1/i }));

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/e\.g\., CGST/i)).not.toBeInTheDocument();
      });
    });
  });
});
