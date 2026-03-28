/**
 * InventorySettings Component Tests
 *
 * Requirements: 13.6, 13.9
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { InventorySettings, INVENTORY_SETTINGS_KEY } from '../InventorySettings';

vi.mock('sonner');

describe('InventorySettings', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Renders all fields', () => {
    it('renders the low stock threshold field', () => {
      render(<InventorySettings />);
      expect(screen.getByLabelText(/default low stock threshold/i)).toBeInTheDocument();
    });

    it('renders toggle switches', () => {
      render(<InventorySettings />);
      expect(screen.getByRole('switch', { name: /auto-reorder/i })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /track inventory movements/i })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /allow negative stock/i })).toBeInTheDocument();
    });

    it('does not render auto-reorder quantity when auto-reorder is off', () => {
      render(<InventorySettings />);
      expect(screen.queryByLabelText(/auto-reorder quantity/i)).not.toBeInTheDocument();
    });

    it('renders auto-reorder quantity when auto-reorder is toggled on', async () => {
      const user = userEvent.setup();
      render(<InventorySettings />);

      await user.click(screen.getByRole('switch', { name: /auto-reorder/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/auto-reorder quantity/i)).toBeInTheDocument();
      });
    });

    it('renders a save button', () => {
      render(<InventorySettings />);
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });
  });

  describe('Validates required fields', () => {
    it('shows error when threshold is negative', async () => {
      const user = userEvent.setup();
      render(<InventorySettings />);

      const thresholdInput = screen.getByLabelText(/default low stock threshold/i);
      await user.clear(thresholdInput);
      await user.type(thresholdInput, '-5');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/threshold must be 0 or greater/i)).toBeInTheDocument();
      });
    });
  });

  describe('Saves to localStorage on submit', () => {
    it('saves settings to localStorage with correct key', async () => {
      const user = userEvent.setup();
      render(<InventorySettings />);

      const thresholdInput = screen.getByLabelText(/default low stock threshold/i);
      await user.clear(thresholdInput);
      await user.type(thresholdInput, '25');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        const stored = localStorage.getItem(INVENTORY_SETTINGS_KEY);
        expect(stored).not.toBeNull();
        const parsed = JSON.parse(stored!);
        expect(parsed.lowStockThreshold).toBe(25);
      });
    });

    it('saves auto-reorder quantity when auto-reorder is enabled', async () => {
      const user = userEvent.setup();
      render(<InventorySettings />);

      await user.click(screen.getByRole('switch', { name: /auto-reorder/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/auto-reorder quantity/i)).toBeInTheDocument();
      });

      const qtyInput = screen.getByLabelText(/auto-reorder quantity/i);
      await user.clear(qtyInput);
      await user.type(qtyInput, '100');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        const stored = localStorage.getItem(INVENTORY_SETTINGS_KEY);
        const parsed = JSON.parse(stored!);
        expect(parsed.autoReorder).toBe(true);
        expect(parsed.autoReorderQuantity).toBe(100);
      });
    });
  });

  describe('Shows success toast on save', () => {
    it('calls toast.success after successful save', async () => {
      const user = userEvent.setup();
      render(<InventorySettings />);

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Inventory settings saved successfully');
      });
    });
  });

  describe('Loads saved values on mount', () => {
    it('pre-fills form with values from localStorage', async () => {
      const saved = {
        lowStockThreshold: 20,
        autoReorder: false,
        trackInventoryMovements: false,
        allowNegativeStock: true,
      };
      localStorage.setItem(INVENTORY_SETTINGS_KEY, JSON.stringify(saved));

      render(<InventorySettings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/default low stock threshold/i)).toHaveValue(20);
        expect(screen.getByRole('switch', { name: /allow negative stock/i })).toHaveAttribute(
          'aria-checked',
          'true'
        );
        expect(screen.getByRole('switch', { name: /track inventory movements/i })).toHaveAttribute(
          'aria-checked',
          'false'
        );
      });
    });
  });
});
