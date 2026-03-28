/**
 * Unit Tests for RecentTransactionsList Component
 * 
 * Tests loading, error, empty, and data display states
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { RecentTransactionsList } from '../RecentTransactionsList';
import { Order } from '@/types/entities';

// Mock data
const mockTransactions: Order[] = [
  {
    id: '1',
    tenantId: 'tenant-1',
    orderNumber: 'ORD-001',
    customerId: 'cust-1',
    customer: {
      id: 'cust-1',
      tenantId: 'tenant-1',
      name: 'John Doe',
      phone: '+1234567890',
      lifetimeValue: 5000,
      totalOrders: 5,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        quantity: 2,
        unitPrice: 100,
        totalPrice: 200,
      },
    ],
    subtotal: 200,
    taxAmount: 20,
    discountAmount: 0,
    totalAmount: 220,
    status: 'completed',
    paymentMethod: 'card',
    paymentStatus: 'success',
    createdBy: 'user-1',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    tenantId: 'tenant-1',
    orderNumber: 'ORD-002',
    customerId: 'cust-2',
    customer: {
      id: 'cust-2',
      tenantId: 'tenant-1',
      name: 'Jane Smith',
      phone: '+1234567891',
      lifetimeValue: 3000,
      totalOrders: 3,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
    items: [
      {
        id: 'item-2',
        productId: 'prod-2',
        quantity: 1,
        unitPrice: 500,
        totalPrice: 500,
      },
      {
        id: 'item-3',
        productId: 'prod-3',
        quantity: 3,
        unitPrice: 50,
        totalPrice: 150,
      },
    ],
    subtotal: 650,
    taxAmount: 65,
    discountAmount: 50,
    totalAmount: 665,
    status: 'pending',
    paymentMethod: 'upi',
    paymentStatus: 'pending',
    createdBy: 'user-1',
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
  },
];

describe('RecentTransactionsList', () => {
  describe('Loading State', () => {
    it('should display loading spinner when isLoading is true', () => {
      render(<RecentTransactionsList transactions={[]} isLoading={true} />);
      
      expect(screen.getByText('Loading transactions...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error is provided', () => {
      const error = new Error('Failed to fetch');
      render(<RecentTransactionsList transactions={[]} error={error} />);
      
      expect(screen.getByText(/Failed to load recent transactions/i)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no transactions are provided', () => {
      render(<RecentTransactionsList transactions={[]} />);
      
      expect(screen.getByText('No transactions yet')).toBeInTheDocument();
      expect(screen.getByText(/Recent transactions will appear here/i)).toBeInTheDocument();
    });

    it('should display empty state when transactions array is empty', () => {
      render(<RecentTransactionsList transactions={[]} />);
      
      expect(screen.getByText('No transactions yet')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should render all transactions', () => {
      render(<RecentTransactionsList transactions={mockTransactions} />);
      
      expect(screen.getByText('#ORD-001')).toBeInTheDocument();
      expect(screen.getByText('#ORD-002')).toBeInTheDocument();
    });

    it('should display customer names', () => {
      render(<RecentTransactionsList transactions={mockTransactions} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should format currency values correctly', () => {
      render(<RecentTransactionsList transactions={mockTransactions} />);
      
      // Check for INR currency format
      expect(screen.getByText(/₹220\.00/)).toBeInTheDocument();
      expect(screen.getByText(/₹665\.00/)).toBeInTheDocument();
    });

    it('should display payment methods', () => {
      render(<RecentTransactionsList transactions={mockTransactions} />);
      
      expect(screen.getByText('card')).toBeInTheDocument();
      expect(screen.getByText('upi')).toBeInTheDocument();
    });

    it('should display status badges', () => {
      render(<RecentTransactionsList transactions={mockTransactions} />);
      
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should display item counts', () => {
      render(<RecentTransactionsList transactions={mockTransactions} />);
      
      expect(screen.getByText('1 item')).toBeInTheDocument();
      expect(screen.getByText('2 items')).toBeInTheDocument();
    });

    it('should format dates correctly', () => {
      render(<RecentTransactionsList transactions={mockTransactions} />);
      
      // Check for formatted date (format: MMM dd, yyyy HH:mm)
      const dates = screen.getAllByText(/Jan 15, 2024/);
      expect(dates.length).toBeGreaterThan(0);
    });
  });

  describe('Interaction', () => {
    it('should call onTransactionClick when a transaction is clicked', () => {
      const handleClick = vi.fn();
      render(
        <RecentTransactionsList 
          transactions={mockTransactions} 
          onTransactionClick={handleClick}
        />
      );
      
      const firstTransaction = screen.getByLabelText('Transaction ORD-001');
      fireEvent.click(firstTransaction);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(mockTransactions[0]);
    });

    it('should highlight selected transaction', () => {
      render(<RecentTransactionsList transactions={mockTransactions} />);
      
      const firstTransaction = screen.getByLabelText('Transaction ORD-001');
      fireEvent.click(firstTransaction);
      
      // Check if the transaction has the selected styling
      expect(firstTransaction).toHaveClass('border-blue-500');
      expect(firstTransaction).toHaveClass('bg-blue-50');
    });

    it('should be keyboard accessible', () => {
      const handleClick = vi.fn();
      render(
        <RecentTransactionsList 
          transactions={mockTransactions} 
          onTransactionClick={handleClick}
        />
      );
      
      const firstTransaction = screen.getByLabelText('Transaction ORD-001');
      
      // Focus the element
      firstTransaction.focus();
      expect(firstTransaction).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    it('should have scrollable container with max height', () => {
      const { container } = render(
        <RecentTransactionsList transactions={mockTransactions} />
      );
      
      const scrollableContainer = container.querySelector('.overflow-y-auto');
      expect(scrollableContainer).toBeInTheDocument();
      expect(scrollableContainer).toHaveClass('max-h-[500px]');
    });
  });

  describe('Edge Cases', () => {
    it('should handle transaction without customer', () => {
      const transactionWithoutCustomer: Order[] = [
        {
          ...mockTransactions[0],
          customerId: undefined,
          customer: undefined,
        },
      ];
      
      render(<RecentTransactionsList transactions={transactionWithoutCustomer} />);
      
      expect(screen.getByText('#ORD-001')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('should handle transaction without items', () => {
      const transactionWithoutItems: Order[] = [
        {
          ...mockTransactions[0],
          items: [],
        },
      ];
      
      render(<RecentTransactionsList transactions={transactionWithoutItems} />);
      
      expect(screen.getByText('#ORD-001')).toBeInTheDocument();
      expect(screen.queryByText(/item/)).not.toBeInTheDocument();
    });

    it('should handle different payment statuses', () => {
      const transactionsWithDifferentStatuses: Order[] = [
        { ...mockTransactions[0], status: 'cancelled' },
        { ...mockTransactions[0], id: '3', orderNumber: 'ORD-003', status: 'refunded' },
        { ...mockTransactions[0], id: '4', orderNumber: 'ORD-004', status: 'processing' },
      ];
      
      render(<RecentTransactionsList transactions={transactionsWithDifferentStatuses} />);
      
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
      expect(screen.getByText('Refunded')).toBeInTheDocument();
      expect(screen.getByText('Processing')).toBeInTheDocument();
    });

    it('should handle different payment methods', () => {
      const transactionsWithDifferentMethods: Order[] = [
        { ...mockTransactions[0], paymentMethod: 'cash' },
        { ...mockTransactions[0], id: '3', orderNumber: 'ORD-003', paymentMethod: 'net_banking' },
      ];
      
      render(<RecentTransactionsList transactions={transactionsWithDifferentMethods} />);
      
      expect(screen.getByText('cash')).toBeInTheDocument();
      expect(screen.getByText('net banking')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<RecentTransactionsList transactions={mockTransactions} />);
      
      expect(screen.getByRole('list', { name: 'Recent transactions' })).toBeInTheDocument();
      expect(screen.getByLabelText('Transaction ORD-001')).toBeInTheDocument();
      expect(screen.getByLabelText('Transaction ORD-002')).toBeInTheDocument();
    });

    it('should have focus indicators', () => {
      render(<RecentTransactionsList transactions={mockTransactions} />);
      
      const firstTransaction = screen.getByLabelText('Transaction ORD-001');
      expect(firstTransaction).toHaveClass('focus:outline-none');
      expect(firstTransaction).toHaveClass('focus:ring-2');
      expect(firstTransaction).toHaveClass('focus:ring-blue-500');
    });
  });
});
