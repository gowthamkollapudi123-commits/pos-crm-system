/**
 * Order Detail Page
 * 
 * Displays complete order information including:
 * - Order details (number, date, status, items, totals)
 * - Customer information with navigation
 * - Payment status with visual indicators
 * - Order status update functionality
 * - Action buttons for navigation and operations
 * 
 * Requirements: 10.3, 10.4, 23.7
 */

'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ordersService } from '@/services/orders.service';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { OrderStatus, PaymentStatus } from '@/types/enums';
import { 
  ArrowLeftIcon, 
  EditIcon, 
  UserIcon, 
  PhoneIcon, 
  MailIcon,
  MapPinIcon,
  CreditCardIcon,
  PackageIcon,
  CalendarIcon,
  FileTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  RefreshCwIcon
} from 'lucide-react';
import { format } from 'date-fns';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch order data
  const { data: orderData, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await ordersService.getById(orderId);
      return response.data;
    },
    enabled: !!orderId,
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: OrderStatus) => {
      const response = await ordersService.update(orderId, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated successfully');
      setShowStatusModal(false);
      setSelectedStatus(null);
    },
    onError: (error: any) => {
      console.error('Failed to update order status:', error);
      toast.error(error.response?.data?.message || 'Failed to update order status');
    },
  });

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;
    
    // Confirm for critical status changes
    if (selectedStatus === OrderStatus.CANCELLED || selectedStatus === OrderStatus.REFUNDED) {
      const action = selectedStatus === OrderStatus.CANCELLED ? 'cancel' : 'refund';
      const confirmed = window.confirm(
        `Are you sure you want to ${action} this order? This action may have financial implications.`
      );
      if (!confirmed) {
        return;
      }
    }

    setIsUpdating(true);
    try {
      await updateStatusMutation.mutateAsync(selectedStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  // Get status label
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

  // Get payment status label
  const getPaymentStatusLabel = (status: PaymentStatus): string => {
    const labels: Record<PaymentStatus, string> = {
      [PaymentStatus.PENDING]: 'Pending',
      [PaymentStatus.SUCCESS]: 'Success',
      [PaymentStatus.FAILED]: 'Failed',
      [PaymentStatus.REFUNDED]: 'Refunded',
    };
    return labels[status] || status;
  };

  // Get payment status badge color
  const getPaymentStatusColor = (status: PaymentStatus): string => {
    const colors: Record<PaymentStatus, string> = {
      [PaymentStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [PaymentStatus.SUCCESS]: 'bg-green-100 text-green-800',
      [PaymentStatus.FAILED]: 'bg-red-100 text-red-800',
      [PaymentStatus.REFUNDED]: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get payment status icon
  const getPaymentStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.SUCCESS:
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case PaymentStatus.FAILED:
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case PaymentStatus.PENDING:
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      case PaymentStatus.REFUNDED:
        return <RefreshCwIcon className="h-5 w-5 text-purple-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">Failed to load order</p>
          <button
            onClick={() => router.push('/orders')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/orders')}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Back to orders"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order {orderData.orderNumber}</h1>
                <p className="mt-1 text-sm text-gray-600">
                  {format(new Date(orderData.createdAt), 'MMMM dd, yyyy \'at\' h:mm a')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowStatusModal(true)}
                disabled={!isOnline}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <EditIcon className="h-4 w-4 mr-2" />
                Update Status
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <PackageIcon className="h-5 w-5" />
                Order Items
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orderData.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {item.product?.name || 'Unknown Product'}
                          {item.variantId && (
                            <span className="text-gray-500 text-xs ml-2">
                              (Variant: {item.variantId})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 text-right">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 text-right">
                          ₹{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900 text-right">
                          ₹{item.totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Order Totals */}
              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">
                      ₹{orderData.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">
                      ₹{orderData.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {orderData.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount</span>
                      <span className="text-green-600">
                        -₹{orderData.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">
                      ₹{orderData.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {orderData.notes && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5" />
                  Notes
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">{orderData.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Status Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Current Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(orderData.status)}`}>
                    {getStatusLabel(orderData.status)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Order ID</p>
                  <p className="text-sm text-gray-900 font-mono">{orderData.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Created</p>
                  <p className="text-sm text-gray-900">{format(new Date(orderData.createdAt), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Last Updated</p>
                  <p className="text-sm text-gray-900">{format(new Date(orderData.updatedAt), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            </div>

            {/* Payment Information Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCardIcon className="h-5 w-5" />
                Payment Information
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Payment Method</p>
                  <p className="text-sm text-gray-900 capitalize">{orderData.paymentMethod.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Payment Status</p>
                  <div className="flex items-center gap-2">
                    {getPaymentStatusIcon(orderData.paymentStatus)}
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(orderData.paymentStatus)}`}>
                      {getPaymentStatusLabel(orderData.paymentStatus)}
                    </span>
                  </div>
                </div>
                {orderData.paymentTransactionId && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Transaction ID</p>
                    <p className="text-sm text-gray-900 font-mono break-all">{orderData.paymentTransactionId}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Information Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Customer Information
              </h2>
              {orderData.customer ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Name</p>
                    <button
                      onClick={() => router.push(`/customers/${orderData.customerId}`)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {orderData.customer.name}
                    </button>
                  </div>
                  {orderData.customer.email && (
                    <div className="flex items-start gap-2">
                      <MailIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="text-sm text-gray-900">{orderData.customer.email}</p>
                      </div>
                    </div>
                  )}
                  {orderData.customer.phone && (
                    <div className="flex items-start gap-2">
                      <PhoneIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phone</p>
                        <p className="text-sm text-gray-900">{orderData.customer.phone}</p>
                      </div>
                    </div>
                  )}
                  {orderData.customer.address && (
                    <div className="flex items-start gap-2">
                      <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Address</p>
                        <p className="text-sm text-gray-900">
                          {orderData.customer.address.street}<br />
                          {orderData.customer.address.city}, {orderData.customer.address.state} {orderData.customer.address.zipCode}
                        </p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => router.push(`/customers/${orderData.customerId}`)}
                    className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Customer Details
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Walk-in Customer</p>
                  <p className="text-xs text-gray-400 mt-1">No customer linked to this order</p>
                </div>
              )}
            </div>

            {/* Offline Warning */}
            {!isOnline && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  You are currently offline. Order status updates require an internet connection.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Order Status</h3>
            <p className="text-sm text-gray-600 mb-4">
              Current status: <span className="font-medium">{getStatusLabel(orderData.status)}</span>
            </p>
            <div className="space-y-2 mb-6">
              {Object.values(OrderStatus).map((status) => (
                <label
                  key={status}
                  className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedStatus === status
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={selectedStatus === status}
                    onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {getStatusLabel(status)}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedStatus(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={isUpdating || !selectedStatus || selectedStatus === orderData.status}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : (
                  'Update Status'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
