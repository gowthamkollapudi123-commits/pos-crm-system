/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Payment Modal Component
 * 
 * Modal for selecting payment method and processing payments.
 * Supports Cash, Card, and UPI payment methods.
 * For Card/UPI, simulates Razorpay integration (frontend-only).
 * 
 * Requirements: 7.4, 23.1, 23.2, 23.3, 23.4, 23.5, 23.6, 23.7, 23.8, 23.9
 */

'use client';

import React, { useState } from 'react';
import { PaymentMethod, PaymentStatus } from '@/types/enums';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { CreditCardIcon, BanknoteIcon, SmartphoneIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';

export interface PaymentResult {
  success: boolean;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  error?: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onPaymentComplete: (result: PaymentResult) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  amount,
  onPaymentComplete,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Reset state when modal closes
  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setSelectedMethod(null);
      setPaymentStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  // Handle payment method selection
  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setPaymentStatus('idle');
    setErrorMessage('');
  };

  // Process cash payment
  const processCashPayment = async (): Promise<PaymentResult> => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      paymentMethod: PaymentMethod.CASH,
      transactionId: `CASH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  };

  // Mock Razorpay payment for Card/UPI
  const processRazorpayPayment = async (method: PaymentMethod): Promise<PaymentResult> => {
    // Simulate Razorpay payment processing
    // In a real implementation, this would open Razorpay modal
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate 90% success rate for demo purposes
    const isSuccess = Math.random() > 0.1;
    
    if (isSuccess) {
      return {
        success: true,
        paymentMethod: method,
        transactionId: `RZP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
    } else {
      return {
        success: false,
        paymentMethod: method,
        error: 'Payment failed. Please try again.',
      };
    }
  };

  // Handle payment confirmation
  const handleConfirmPayment = async () => {
    if (!selectedMethod) return;

    setIsProcessing(true);
    setPaymentStatus('idle');
    setErrorMessage('');

    try {
      let result: PaymentResult;

      if (selectedMethod === PaymentMethod.CASH) {
        result = await processCashPayment();
      } else {
        // Card or UPI - use mock Razorpay
        result = await processRazorpayPayment(selectedMethod);
      }

      if (result.success) {
        setPaymentStatus('success');
        // Wait a moment to show success state, then complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Call completion callback
        onPaymentComplete(result);
        // Close modal after callback
        onClose();
      } else {
        setPaymentStatus('failed');
        setErrorMessage(result.error || 'Payment failed. Please try again.');
      }
    } catch (error) {
      setPaymentStatus('failed');
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Payment method options
  const paymentMethods = [
    {
      method: PaymentMethod.CASH,
      label: 'Cash',
      icon: BanknoteIcon,
      description: 'Pay with cash',
    },
    {
      method: PaymentMethod.CARD,
      label: 'Card',
      icon: CreditCardIcon,
      description: 'Credit or Debit Card',
    },
    {
      method: PaymentMethod.UPI,
      label: 'UPI',
      icon: SmartphoneIcon,
      description: 'UPI Payment',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Payment"
      description="Select a payment method to complete the transaction"
      size="md"
      closeOnOverlayClick={!isProcessing}
      closeOnEscape={!isProcessing}
    >
      <div className="space-y-4">
        {/* Amount Display */}
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">Amount to Pay</p>
          <p className="text-2xl font-bold text-gray-900">₹{amount.toFixed(2)}</p>
        </div>

        {/* Payment Method Selection */}
        {paymentStatus === 'idle' && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Select Payment Method</p>
            <div className="grid gap-2">
              {paymentMethods.map(({ method, label, icon: Icon, description }) => (
                <button
                  key={method}
                  onClick={() => handleMethodSelect(method)}
                  disabled={isProcessing}
                  className={`
                    flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                    ${
                      selectedMethod === method
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                    ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  `}
                  aria-label={`Select ${label} payment method`}
                >
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${selectedMethod === method ? 'bg-blue-600' : 'bg-gray-100'}
                    `}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        selectedMethod === method ? 'text-white' : 'text-gray-600'
                      }`}
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <p
                      className={`font-medium ${
                        selectedMethod === method ? 'text-blue-900' : 'text-gray-900'
                      }`}
                    >
                      {label}
                    </p>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                  {selectedMethod === method && (
                    <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Success State */}
        {paymentStatus === 'success' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircleIcon className="h-10 w-10 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-gray-900">Payment Successful!</p>
            <p className="text-sm text-gray-600 mt-1">Processing transaction...</p>
          </div>
        )}

        {/* Failed State */}
        {paymentStatus === 'failed' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <XCircleIcon className="h-10 w-10 text-red-600" />
            </div>
            <p className="text-lg font-semibold text-gray-900">Payment Failed</p>
            <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmPayment}
            disabled={!selectedMethod || isProcessing || paymentStatus === 'success'}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Processing...
              </>
            ) : paymentStatus === 'failed' ? (
              'Retry Payment'
            ) : (
              'Confirm Payment'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
