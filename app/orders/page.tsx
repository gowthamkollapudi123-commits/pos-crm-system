/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Orders List Page
 * 
 * Displays orders list with search, filters, sorting, and pagination.
 * Uses TanStack Table for data grid functionality.
 * Responsive layout: cards on mobile, table on desktop.
 * 
 * Requirements: 10.1, 10.2, 10.10, 28.3, 28.6, 28.7
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useAuth } from '@/hooks';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { ordersService } from '@/services/orders.service';
import { Order } from '@/types/entities';
import { OrderStatus } from '@/types/enums';
import { DataTable } from '@/components/ui/data-table';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { SearchIcon, FunnelIcon as FilterIcon, PlusIcon, ShoppingCartIcon, DownloadIcon } from 'lucide-react';
import { format } from 'date-fns';
import { arrayToCsv, downloadCsv, generateCsvFilename, formatCurrencyForCsv, formatDateForCsv } from '@/utils/csv-export';
import { toast } from 'sonner';

export default function OrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { logout } = useAuth();
  const { isOnline } = useNetworkStatus();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isExporting, setIsExporting] = useState(false);

  // Debounce search input (300ms) - Requirement 28.4
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch orders with search and filters
  const { data: ordersData, isLoading: ordersLoading, error } = useQuery({
    queryKey: ['orders', debouncedSearch, statusFilter, dateRange, page, pageSize],
    queryFn: async () => {
      const params: any = {
        query: debouncedSearch || undefined,
        status: statusFilter || undefined,
        page,
        pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
      };

      // Add date range filter - Requirement 28.6
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;

      const response = await ordersService.getAll(params);
      return response;
    },
    enabled: isAuthenticated,
  });

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

  // Define table columns
  const columns = useMemo<ColumnDef<Order>[]>(() => [
    {
      accessorKey: 'orderNumber',
      header: 'Order Number',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <ShoppingCartIcon className="h-4 w-4 text-blue-600" />
          </div>
          <span className="font-medium">{row.original.orderNumber}</span>
        </div>
      ),
      size: 180,
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => row.original.customer?.name || 'Walk-in Customer',
      size: 180,
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM dd, yyyy HH:mm'),
      size: 160,
    },
    {
      accessorKey: 'totalAmount',
      header: 'Amount',
      cell: ({ row }) => `₹${row.original.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      size: 130,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(row.original.status)}`}>
          {getStatusLabel(row.original.status)}
        </span>
      ),
      size: 130,
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Payment',
      cell: ({ row }) => {
        const method = row.original.paymentMethod;
        return method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ');
      },
      size: 120,
    },
  ], []);

  // Memoize filtered orders for stable reference - Requirement 19.6
  const filteredOrders = useMemo(() => ordersData?.data || [], [ordersData?.data]);

  // Handle row click
  const handleRowClick = useCallback((order: Order) => {
    router.push(`/orders/${order.id}`);
  }, [router]);

  // Handle create order
  const handleCreateOrder = useCallback(() => {
    router.push('/pos');
  }, [router]);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('');
    setDateRange({ start: '', end: '' });
  }, []);

  // Check if any filters are active
  const hasActiveFilters = searchQuery || statusFilter || dateRange.start || dateRange.end;

  // Handle CSV export - Requirement 10.9
  const handleExportCsv = useCallback(() => {
    if (!ordersData || ordersData.data.length === 0) {
      toast.error('No orders available to export');
      return;
    }

    setIsExporting(true);

    try {
      // Prepare export data with current filters applied
      const exportData = ordersData.data.map(order => ({
        orderNumber: order.orderNumber,
        date: formatDateForCsv(order.createdAt),
        customer: order.customer?.name || 'Walk-in Customer',
        status: getStatusLabel(order.status),
        paymentMethod: order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1).replace('_', ' '),
        totalAmount: formatCurrencyForCsv(order.totalAmount),
      }));

      // Generate CSV
      const csv = arrayToCsv(
        exportData,
        ['orderNumber', 'date', 'customer', 'status', 'paymentMethod', 'totalAmount'],
        {
          orderNumber: 'Order Number',
          date: 'Date',
          customer: 'Customer',
          status: 'Status',
          paymentMethod: 'Payment Method',
          totalAmount: 'Total Amount',
        }
      );

      // Generate filename with filter info
      let filenameSuffix = '';
      if (statusFilter) {
        filenameSuffix += `_${statusFilter}`;
      }
      if (dateRange.start && dateRange.end) {
        filenameSuffix += `_${dateRange.start}_to_${dateRange.end}`;
      }

      const filename = generateCsvFilename(`orders${filenameSuffix}`);
      downloadCsv(csv, filename);

      toast.success(`Exported ${exportData.length} orders successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export orders');
    } finally {
      setIsExporting(false);
    }
  }, [ordersData, statusFilter, dateRange]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-bold text-gray-900">Orders</h1>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Track and manage all customer orders and transactions
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportCsv}
                  disabled={isExporting || !ordersData || ordersData.data.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <DownloadIcon className="h-5 w-5 mr-2" />
                      Export CSV
                    </>
                  )}
                </button>
                <button
                  onClick={handleCreateOrder}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Order
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input - Requirement 28.3 */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by order number or customer name..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  hasActiveFilters
                    ? 'border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <FilterIcon className="h-5 w-5 mr-2" />
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Status Filter - Requirement 28.7 */}
                  <div>
                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                      Order Status
                    </label>
                    <select
                      id="status-filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
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

                  {/* Date Range Filter - Requirement 28.6 */}
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
                      <span className="flex items-center text-gray-500">to</span>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        aria-label="End date"
                      />
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  <div className="flex items-end">
                    <button
                      onClick={handleClearFilters}
                      disabled={!hasActiveFilters}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                Failed to load orders. {!isOnline && 'You are currently offline.'}
              </p>
            </div>
          )}

          {/* Order Count */}
          {ordersData && (
            <div className="mb-4 text-sm text-gray-600">
              Showing {ordersData.data.length} of {ordersData.pagination.totalItems} orders
              {hasActiveFilters && ' (filtered)'}
            </div>
          )}

          {/* Desktop View: Table - Requirement 10.10 */}
          <div className="hidden md:block">
            <DataTable
              data={filteredOrders}
              columns={columns}
              pageSize={pageSize}
              onRowClick={handleRowClick}
              loading={ordersLoading}
              emptyMessage="No orders found. Try adjusting your search or filters."
              showPagination={true}
              showPageSizeSelector={true}
              pageSizeOptions={[10, 25, 50, 100]}
              manualPagination={false}
            />
          </div>

          {/* Mobile View: Cards */}
          <div className="md:hidden space-y-4">
            {ordersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading orders...</p>
                </div>
              </div>
            ) : !ordersData || ordersData.data.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No orders found. Try adjusting your search or filters.</p>
              </div>
            ) : (
              ordersData.data.map((order) => (
                <div
                  key={order.id}
                  onClick={() => handleRowClick(order)}
                  className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <ShoppingCartIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{order.orderNumber}</h3>
                        <p className="text-sm text-gray-500">{order.customer?.name || 'Walk-in Customer'}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date:</span>
                      <span className="text-gray-900">{format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Amount:</span>
                      <span className="text-gray-900 font-medium">
                        ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment:</span>
                      <span className="text-gray-900">
                        {order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1).replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
