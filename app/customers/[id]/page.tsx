/**
 * Customer Detail Page
 * 
 * Displays comprehensive customer information including:
 * - Customer details (name, email, phone, address, date of birth)
 * - Purchase history with order details
 * - Lifetime value prominently displayed
 * - Notes section with ability to add new notes
 * - Edit and delete actions
 * 
 * Responsive layout: cards on mobile, structured layout on desktop
 * 
 * Requirements: 8.4, 8.5, 8.7
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useAuth } from '@/hooks';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { customersService } from '@/services/customers.service';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { format } from 'date-fns';
import { 
  UserIcon, 
  MailIcon, 
  PhoneIcon, 
  MapPinIcon, 
  CakeIcon,
  EditIcon, 
  TrashIcon,
  ArrowLeftIcon,
  ShoppingBagIcon,
  TrendingUpIcon,
  StickyNoteIcon,
  PlusIcon,
  FilterIcon,
  XIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { OrderStatus } from '@/types/enums';

interface CustomerDetailPageProps {
  params: {
    id: string;
  };
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { logout } = useAuth();
  const { isOnline } = useNetworkStatus();

  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Order history filter state
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch customer details
  const { data: customerData, isLoading: customerLoading, error: customerError } = useQuery({
    queryKey: ['customer', params.id],
    queryFn: async () => {
      const response = await customersService.getById(params.id);
      return response.data;
    },
    enabled: isAuthenticated && !!params.id,
  });

  // Fetch purchase history
  const { data: purchaseHistoryData, isLoading: historyLoading } = useQuery({
    queryKey: ['customer-orders', params.id],
    queryFn: async () => {
      const response = await customersService.getPurchaseHistory(params.id);
      return response.data;
    },
    enabled: isAuthenticated && !!params.id,
  });

  const orders = purchaseHistoryData || [];

  // Fetch lifetime value
  const { data: lifetimeValueData, isLoading: lifetimeLoading } = useQuery({
    queryKey: ['customer-lifetime-value', params.id],
    queryFn: async () => {
      const response = await customersService.getLifetimeValue(params.id);
      return response.data;
    },
    enabled: isAuthenticated && !!params.id,
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      return await customersService.addNote(params.id, note);
    },
    onSuccess: () => {
      toast.success('Note added successfully');
      setNewNote('');
      setIsAddingNote(false);
      // Invalidate customer query to refresh data
      queryClient.invalidateQueries({ queryKey: ['customer', params.id] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add note');
    },
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async () => {
      return await customersService.delete(params.id);
    },
    onSuccess: () => {
      toast.success('Customer deleted successfully');
      router.push('/customers');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete customer');
    },
  });

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }
    addNoteMutation.mutate(newNote);
  };

  const handleDeleteCustomer = () => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      deleteCustomerMutation.mutate();
    }
  };

  const handleEditCustomer = () => {
    router.push(`/customers/${params.id}/edit`);
  };

  const handleBackToList = () => {
    router.push('/customers');
  };

  // Get status label with proper formatting
  const getStatusLabel = (status: OrderStatus): string => {
    const labels: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'Pending',
      [OrderStatus.PROCESSING]: 'Processing',
      [OrderStatus.COMPLETED]: 'Completed',
      [OrderStatus.CANCELLED]: 'Cancelled',
      [OrderStatus.REFUNDED]: 'Refunded',
    };
    return labels[status] || status;
  };

  // Get status badge color
  const getStatusColor = (status: OrderStatus): string => {
    const colors: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [OrderStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
      [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [OrderStatus.REFUNDED]: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Filter orders based on status and date range
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    return orders.filter((order) => {
      // Status filter
      if (statusFilter && order.status !== statusFilter) {
        return false;
      }

      // Date range filter
      if (dateRange.start || dateRange.end) {
        const orderDate = new Date(order.createdAt);
        
        if (dateRange.start) {
          const startDate = new Date(dateRange.start);
          startDate.setHours(0, 0, 0, 0);
          if (orderDate < startDate) return false;
        }
        
        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          if (orderDate > endDate) return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, dateRange]);

  // Clear filters
  const handleClearFilters = () => {
    setStatusFilter('');
    setDateRange({ start: '', end: '' });
  };

  // Check if any filters are active
  const hasActiveFilters = statusFilter || dateRange.start || dateRange.end;

  // Handle order click
  const handleOrderClick = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  if (authLoading || customerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    router.push('/login');
    return null;
  }

  if (customerError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackToList}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  ← Back to Customers
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <OfflineIndicator />
                <span className="text-sm text-gray-700">
                  Welcome, <span className="font-medium">{user.name}</span>
                </span>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
              <p className="text-red-800">Failed to load customer details. {!isOnline && 'You are currently offline.'}</p>
              <button
                onClick={handleBackToList}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Back to Customers
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const customer = customerData;
  const lifetimeValue = lifetimeValueData?.lifetimeValue ?? customer?.lifetimeValue ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToList}
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Customers
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <OfflineIndicator />
              <span className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{user.name}</span>
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header with Actions */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{customer?.name}</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Customer since {customer?.createdAt ? format(new Date(customer.createdAt), 'MMMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleEditCustomer}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <EditIcon className="h-4 w-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={handleDeleteCustomer}
                  disabled={deleteCustomerMutation.isPending}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  {deleteCustomerMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>

          {/* Lifetime Value Card - Prominent Display */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">Lifetime Value</p>
                  <p className="mt-2 text-4xl font-bold">
                    {lifetimeLoading ? (
                      <span className="text-2xl">Loading...</span>
                    ) : (
                      `₹${lifetimeValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    )}
                  </p>
                  <p className="mt-1 text-blue-100 text-sm">
                    Total value from {customer?.totalOrders || 0} orders
                  </p>
                </div>
                <div className="h-16 w-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <TrendingUpIcon className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout: Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Customer Information */}
            <div className="lg:col-span-1 space-y-6">
              {/* Contact Information Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="space-y-4">
                  {customer?.email && (
                    <div className="flex items-start gap-3">
                      <MailIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="text-sm text-gray-900">{customer.email}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-sm text-gray-900">{customer?.phone || 'N/A'}</p>
                    </div>
                  </div>
                  {customer?.address && (
                    <div className="flex items-start gap-3">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Address</p>
                        <p className="text-sm text-gray-900">
                          {customer.address.street}<br />
                          {customer.address.city}, {customer.address.state} {customer.address.zipCode}<br />
                          {customer.address.country}
                        </p>
                      </div>
                    </div>
                  )}
                  {customer?.dateOfBirth && (
                    <div className="flex items-start gap-3">
                      <CakeIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                        <p className="text-sm text-gray-900">
                          {format(new Date(customer.dateOfBirth), 'MMMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <StickyNoteIcon className="h-5 w-5" />
                    Notes
                  </h2>
                  {!isAddingNote && (
                    <button
                      onClick={() => setIsAddingNote(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <PlusIcon className="h-4 w-4 inline mr-1" />
                      Add Note
                    </button>
                  )}
                </div>

                {/* Add Note Form */}
                {isAddingNote && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Enter your note here..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleAddNote}
                        disabled={addNoteMutation.isPending || !newNote.trim()}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {addNoteMutation.isPending ? 'Saving...' : 'Save Note'}
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingNote(false);
                          setNewNote('');
                        }}
                        disabled={addNoteMutation.isPending}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Display Notes */}
                <div className="space-y-3">
                  {customer?.notes ? (
                    <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                      {customer.notes}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No notes added yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Purchase History */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <ShoppingBagIcon className="h-5 w-5" />
                        Order History
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
                        {hasActiveFilters && ` (filtered from ${orders.length} total)`}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        hasActiveFilters
                          ? 'border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <FilterIcon className="h-4 w-4 mr-2" />
                      Filters
                      {hasActiveFilters && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                          Active
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Filter Panel */}
                  {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Status Filter */}
                        <div>
                          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            Order Status
                          </label>
                          <select
                            id="status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">All Statuses</option>
                            <option value={OrderStatus.PENDING}>Pending</option>
                            <option value={OrderStatus.PROCESSING}>Processing</option>
                            <option value={OrderStatus.COMPLETED}>Completed</option>
                            <option value={OrderStatus.CANCELLED}>Cancelled</option>
                            <option value={OrderStatus.REFUNDED}>Refunded</option>
                          </select>
                        </div>

                        {/* Date Range Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date Range
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={dateRange.start}
                              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              aria-label="Start date"
                            />
                            <span className="flex items-center text-gray-500 text-sm">to</span>
                            <input
                              type="date"
                              value={dateRange.end}
                              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              aria-label="End date"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Clear Filters Button */}
                      {hasActiveFilters && (
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={handleClearFilters}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <XIcon className="h-4 w-4 mr-1" />
                            Clear Filters
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600">Loading order history...</p>
                      </div>
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBagIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        {hasActiveFilters 
                          ? 'No orders match the selected filters.' 
                          : 'No order history available.'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleClearFilters}
                          className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Clear filters to see all orders
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      {/* Desktop Table View */}
                      <table className="hidden md:table min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Order #
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Items
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredOrders.map((order) => (
                            <tr 
                              key={order.id} 
                              onClick={() => handleOrderClick(order.id)}
                              className="hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800">
                                {order.orderNumber}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                  {getStatusLabel(order.status)}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-4">
                        {filteredOrders.map((order) => (
                          <div 
                            key={order.id} 
                            onClick={() => handleOrderClick(order.id)}
                            className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-medium text-blue-600">{order.orderNumber}</p>
                                <p className="text-sm text-gray-500">
                                  {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                                </p>
                              </div>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                {getStatusLabel(order.status)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-gray-600">
                                {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                              </p>
                              <p className="text-lg font-semibold text-gray-900">
                                ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
