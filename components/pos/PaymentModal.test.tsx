/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unit Tests for PaymentModal Component
 * 
 * Tests payment method selection, payment processing, and error handling.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { PaymentModal, type PaymentResult } from './PaymentModal';
import { PaymentMethod } from '@/types/enums';

describe('PaymentModal', () => {
  const mockOnClose = vi.fn();
  const mockOnPaymentComplete = vi.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    amount: 1000,
    onPaymentComplete: mockOnPaymentComplete,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render payment modal when open', () => {
      render(<PaymentModal {...defaultProps} />);
      
      expect(screen.getByText('Payment')).toBeInTheDocument();
      expect(screen.getByText('Select a payment method to complete the transaction')).toBeInTheDocument();
      expect(screen.getByText('₹1000.00')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<PaymentModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Payment')).not.toBeInTheDocument();
    });

    it('should display all payment method options', () => {
      render(<PaymentModal {...defaultProps} />);
      
      expect(screen.getByText('Cash')).toBeInTheDocument();
      expect(screen.getByText('Card')).toBeInTheDocument();
      expect(screen.getByText('UPI')).toBeInTheDocument();
    });

    it('should display amount correctly', () => {
      render(<PaymentModal {...defaultProps} amount={2500.50} />);
      
      expect(screen.getByText('₹2500.50')).toBeInTheDocument();
    });
  });

  describe('Payment Method Selection', () => {
    it('should allow selecting cash payment method', () => {
      render(<PaymentModal {...defaultProps} />);
      
      const cashButton = screen.getByLabelText('Select Cash payment method');
      fireEvent.click(cashButton);
      
      expect(cashButton).toHaveClass('border-blue-600');
    });

    it('should allow selecting card payment method', () => {
      render(<PaymentModal {...defaultProps} />);
      
      const cardButton = screen.getByLabelText('Select Card payment method');
      fireEvent.click(cardButton);
      
      expect(cardButton).toHaveClass('border-blue-600');
    });

    it('should allow selecting UPI payment method', () => {
      render(<PaymentModal {...defaultProps} />);
      
      const upiButton = screen.getByLabelText('Select UPI payment method');
      fireEvent.click(upiButton);
      
      expect(upiButton).toHaveClass('border-blue-600');
    });

    it('should allow switching between payment methods', () => {
      render(<PaymentModal {...defaultProps} />);
      
      const cashButton = screen.getByLabelText('Select Cash payment method');
      const cardButton = screen.getByLabelText('Select Card payment method');
      
      fireEvent.click(cashButton);
      expect(cashButton).toHaveClass('border-blue-600');
      
      fireEvent.click(cardButton);
      expect(cardButton).toHaveClass('border-blue-600');
      expect(cashButton).not.toHaveClass('border-blue-600');
    });
  });

  describe('Payment Processing', () => {
    it('should disable confirm button when no method selected', () => {
      render(<PaymentModal {...defaultProps} />);
      
      const confirmButton = screen.getByText('Confirm Payment');
      expect(confirmButton).toBeDisabled();
    });

    it('should enable confirm button when method selected', () => {
      render(<PaymentModal {...defaultProps} />);
      
      const cashButton = screen.getByLabelText('Select Cash payment method');
      fireEvent.click(cashButton);
      
      const confirmButton = screen.getByText('Confirm Payment');
      expect(confirmButton).not.toBeDisabled();
    });

    it('should process cash payment successfully', async () => {
      render(<PaymentModal {...defaultProps} />);
      
      // Select cash payment
      const cashButton = screen.getByLabelText('Select Cash payment method');
      fireEvent.click(cashButton);
      
      // Confirm payment
      const confirmButton = screen.getByText('Confirm Payment');
      fireEvent.click(confirmButton);
      
      // Wait for callback to be called
      await waitFor(() => {
        expect(mockOnPaymentComplete).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      // Verify the payment result
      const callArgs = mockOnPaymentComplete.mock.calls[0][0];
      expect(callArgs.success).toBe(true);
      expect(callArgs.paymentMethod).toBe(PaymentMethod.CASH);
      expect(callArgs.transactionId).toContain('CASH-');
    });

    it('should show processing state during payment', async () => {
      render(<PaymentModal {...defaultProps} />);
      
      const cashButton = screen.getByLabelText('Select Cash payment method');
      fireEvent.click(cashButton);
      
      const confirmButton = screen.getByText('Confirm Payment');
      fireEvent.click(confirmButton);
      
      // Should show processing state briefly
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('should show success state after successful payment', async () => {
      render(<PaymentModal {...defaultProps} />);
      
      const cashButton = screen.getByLabelText('Select Cash payment method');
      fireEvent.click(cashButton);
      
      const confirmButton = screen.getByText('Confirm Payment');
      fireEvent.click(confirmButton);
      
      // Wait for success state
      await waitFor(() => {
        expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Modal Controls', () => {
    it('should call onClose when cancel button clicked', () => {
      render(<PaymentModal {...defaultProps} />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not close modal during processing', async () => {
      render(<PaymentModal {...defaultProps} />);
      
      const cashButton = screen.getByLabelText('Select Cash payment method');
      fireEvent.click(cashButton);
      
      const confirmButton = screen.getByText('Confirm Payment');
      fireEvent.click(confirmButton);
      
      // Try to cancel during processing
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amount', () => {
      render(<PaymentModal {...defaultProps} amount={0} />);
      
      expect(screen.getByText('₹0.00')).toBeInTheDocument();
    });

    it('should handle large amounts', () => {
      render(<PaymentModal {...defaultProps} amount={999999.99} />);
      
      expect(screen.getByText('₹999999.99')).toBeInTheDocument();
    });

    it('should reset state when modal closes and reopens', () => {
      const { rerender } = render(<PaymentModal {...defaultProps} />);
      
      // Select a payment method
      const cashButton = screen.getByLabelText('Select Cash payment method');
      fireEvent.click(cashButton);
      
      // Verify method is selected
      expect(cashButton).toHaveClass('border-blue-600');
      
      // Close modal
      rerender(<PaymentModal {...defaultProps} isOpen={false} />);
      
      // Modal should not be visible
      expect(screen.queryByText('Payment')).not.toBeInTheDocument();
      
      // Reopen modal
      rerender(<PaymentModal {...defaultProps} isOpen={true} />);
      
      // Modal should be visible again
      expect(screen.getByText('Payment')).toBeInTheDocument();
      
      // Payment method should be reset - confirm button should be disabled
      const confirmButton = screen.getByText('Confirm Payment');
      expect(confirmButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for payment methods', () => {
      render(<PaymentModal {...defaultProps} />);
      
      expect(screen.getByLabelText('Select Cash payment method')).toBeInTheDocument();
      expect(screen.getByLabelText('Select Card payment method')).toBeInTheDocument();
      expect(screen.getByLabelText('Select UPI payment method')).toBeInTheDocument();
    });

    it('should have proper button labels', () => {
      render(<PaymentModal {...defaultProps} />);
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Confirm Payment')).toBeInTheDocument();
    });

    it('should disable buttons appropriately', () => {
      render(<PaymentModal {...defaultProps} />);
      
      const confirmButton = screen.getByText('Confirm Payment');
      expect(confirmButton).toBeDisabled();
      
      const cashButton = screen.getByLabelText('Select Cash payment method');
      fireEvent.click(cashButton);
      
      expect(confirmButton).not.toBeDisabled();
    });
  });
});
