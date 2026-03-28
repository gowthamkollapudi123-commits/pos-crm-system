/**
 * Recent Transactions List Component
 * 
 * Displays recent transactions in a scrollable list with click-to-view details.
 * Includes loading, error, and empty states.
 * 
 * Requirements: 6.7
 */

'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Order } from '@/types/entities';
import { 
  CreditCardIcon, 
  BanknoteIcon, 
  SmartphoneIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ChevronRightIcon
} from 'lucide-react';

export interface RecentTransactionsListProps {
  transactions: Order[];
  isLoading?: boolean;
  error?: Error | null;
  onTransactionClick?: (transaction: Order) => void;
}

/**
 * Get payment method icon based on payment method type
 */
function getPaymentMethodIcon(method: string) {
  switch (method.toLowerCase()) {
    case 'card':
      return <CreditCardIcon className="h-4 w-4" />;
    case 'cash':
      return <BanknoteIcon className="h-4 w-4" />;
    case 'upi':
    case 'net_banking':
      return <SmartphoneIcon className="h-4 w-4" />;
    default:
      return <CreditCardIcon className="h-4 w-4" />;
  }
}

/**
 * Get status badge styling and icon
 */
function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
      return {
        icon: <CheckCircleIcon className="h-3 w-3" />,
        className: 'bg-green-100 text-green-800',
        label: 'Completed',
      };
    case 'pending':
      return {
        icon: <ClockIcon className="h-3 w-3" />,
        className: 'bg-yellow-100 text-yellow-800',
        label: 'Pending',
      };
    case 'processing':
      return {
        icon: <ClockIcon className="h-3 w-3" />,
        className: 'bg-blue-100 text-blue-800',
        label: 'Processing',
      };
    case 'cancelled':
    case 'refunded':
      return {
        icon: <XCircleIcon className="h-3 w-3" />,
        className: 'bg-red-100 text-red-800',
        label: status.charAt(0).toUpperCase() + status.slice(1),
      };
    default:
      return {
        icon: <ClockIcon className="h-3 w-3" />,
        className: 'bg-gray-100 text-gray-800',
        label: status.charAt(0).toUpperCase() + status.slice(1),
      };
  }
}

/**
 * Format currency value in INR
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date/time in user-friendly way
 */
function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy HH:mm');
  } catch {
    return dateString;
  }
}

/**
 * Recent Transactions List Component
 */
export function RecentTransactionsList({
  transactions,
  isLoading = false,
  error = null,
  onTransactionClick,
}: RecentTransactionsListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleTransactionClick = (transaction: Order) => {
    setSelectedId(transaction.id);
    onTransactionClick?.(transaction);
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">
          Failed to load recent transactions. Please try again.
        </p>
      </div>
    );
  }

  // Empty State
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <CreditCardIcon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">No transactions yet</h3>
        <p className="text-sm text-gray-500">
          Recent transactions will appear here once you start processing orders.
        </p>
      </div>
    );
  }

  return (
    <div 
      className="overflow-y-auto max-h-[500px] space-y-2"
      role="list"
      aria-label="Recent transactions"
    >
      {transactions.map((transaction) => {
        const statusBadge = getStatusBadge(transaction.status);
        const isSelected = selectedId === transaction.id;

        return (
          <button
            key={transaction.id}
            onClick={() => handleTransactionClick(transaction)}
            className={`
              w-full text-left p-4 rounded-lg border transition-all
              hover:shadow-md hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
            `}
            aria-label={`Transaction ${transaction.orderNumber}`}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left Section: Transaction Info */}
              <div className="flex-1 min-w-0">
                {/* Transaction ID and Date */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    #{transaction.orderNumber}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDateTime(transaction.createdAt)}
                  </span>
                </div>

                {/* Customer Name */}
                {transaction.customer && (
                  <p className="text-sm text-gray-700 mb-2 truncate">
                    {transaction.customer.name}
                  </p>
                )}

                {/* Payment Method and Status */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Payment Method */}
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    {getPaymentMethodIcon(transaction.paymentMethod)}
                    <span className="capitalize">
                      {transaction.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`
                      inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                      ${statusBadge.className}
                    `}
                  >
                    {statusBadge.icon}
                    {statusBadge.label}
                  </span>
                </div>
              </div>

              {/* Right Section: Amount and Arrow */}
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-base font-bold text-gray-900">
                    {formatCurrency(transaction.totalAmount)}
                  </p>
                  {transaction.items && transaction.items.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {transaction.items.length} {transaction.items.length === 1 ? 'item' : 'items'}
                    </p>
                  )}
                </div>
                <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
