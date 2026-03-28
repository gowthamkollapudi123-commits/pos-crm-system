/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Customer List Page
 * 
 * Displays customer list with search, filters, sorting, and pagination.
 * Uses TanStack Table with react-window virtualization for large lists.
 * Responsive layout: cards on mobile, table on desktop.
 * 
 * Requirements: 8.1, 8.9, 8.10, 19.5, 28.2
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useAuth } from '@/hooks';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { customersService } from '@/services/customers.service';
import { Customer } from '@/types/entities';
import { DataTable } from '@/components/ui/data-table';
import { VirtualizedDataTable } from '@/components/ui/virtualized-data-table';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { SearchIcon, FunnelIcon as FilterIcon, PlusIcon, UserIcon, DownloadIcon } from 'lucide-react';
import { format } from 'date-fns';
import { arrayToCsv, downloadCsv, generateCsvFilename, formatDateForCsv } from '@/utils/csv-export';
import { useSearchHighlight } from '@/hooks/useSearchHighlight';
import { toast } from 'sonner';

export default function CustomersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { logout } = useAuth();
  const { isOnline } = useNetworkStatus();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [lifetimeValueRange, setLifetimeValueRange] = useState({ min: '', max: '' });
  const [segmentFilter, setSegmentFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isExporting, setIsExporting] = useState(false);

  // Read segment from URL query parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const segment = params.get('segment');
      if (segment) {
        setSegmentFilter(segment);
        setShowFilters(true);
      }
    }
  }, []);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch customers with search and filters
  const { data: customersData, isLoading: customersLoading, error } = useQuery({
    queryKey: ['customers', debouncedSearch, dateRange, lifetimeValueRange, page, pageSize],
    queryFn: async () => {
      const params: any = {
        query: debouncedSearch || undefined,
        page,
        pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
      };

      // Add date range filter
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;

      const response = await customersService.getAll(params);
      return response;
    },
    enabled: isAuthenticated,
  });

  // Calculate customer segment
  const getCustomerSegment = (customer: Customer): string => {
    const { lifetimeValue, totalOrders } = customer;
    
    // New: Low orders OR low value
    if (totalOrders < 3 || lifetimeValue < 1000) return 'New';
    
    // VIP: High value
    if (lifetimeValue > 10000) return 'VIP';
    
    // Regular: Everything else (1000-10000 with 3+ orders)
    return 'Regular';
  };

  // Filter customers by lifetime value and segment on client side
  const filteredCustomers = useMemo(() => {
    if (!customersData?.data) return [];
    
    let filtered = customersData.data;

    // Apply lifetime value filter
    if (lifetimeValueRange.min || lifetimeValueRange.max) {
      filtered = filtered.filter(customer => {
        const min = lifetimeValueRange.min ? parseFloat(lifetimeValueRange.min) : 0;
        const max = lifetimeValueRange.max ? parseFloat(lifetimeValueRange.max) : Infinity;
        return customer.lifetimeValue >= min && customer.lifetimeValue <= max;
      });
    }

    // Apply segment filter
    if (segmentFilter) {
      filtered = filtered.filter(customer => {
        const segment = getCustomerSegment(customer);
        return segment === segmentFilter;
      });
    }

    return filtered;
  }, [customersData?.data, lifetimeValueRange, segmentFilter]);

  // Determine if we should use virtualization (>100 items)
  const useVirtualization = filteredCustomers.length > 100;

  // Define table columns
  const columns = useMemo<ColumnDef<Customer>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const highlighted = useSearchHighlight(row.original.name, debouncedSearch);
        return (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-blue-600" />
            </div>
            <span className="font-medium">{highlighted}</span>
          </div>
        );
      },
      size: 200,
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => row.original.phone || '-',
      size: 150,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => row.original.email || '-',
      size: 200,
    },
    {
      accessorKey: 'totalOrders',
      header: 'Total Orders',
      cell: ({ row }) => row.original.totalOrders.toLocaleString(),
      size: 120,
    },
    {
      accessorKey: 'lifetimeValue',
      header: 'Lifetime Value',
      cell: ({ row }) => `₹${row.original.lifetimeValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      size: 150,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created Date',
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM dd, yyyy'),
      size: 130,
    },
  ], [debouncedSearch]);

  // Handle CSV export - Requirement 25.1
  const handleExportCsv = useCallback(async () => {
    setIsExporting(true);
    try {
      // Fetch all customers without pagination limit
      const response = await customersService.getAll({ pageSize: 10000, page: 1 });
      const allCustomers = response.data;

      if (!allCustomers || allCustomers.length === 0) {
        toast.error('No customers available to export');
        return;
      }

      const exportData = allCustomers.map(customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone,
        city: customer.address?.city || '',
        state: customer.address?.state || '',
        country: customer.address?.country || '',
        segment: customer.segment || getCustomerSegment(customer),
        lifetimeValue: customer.lifetimeValue,
        totalOrders: customer.totalOrders,
        createdAt: formatDateForCsv(customer.createdAt),
      }));

      const csv = arrayToCsv(
        exportData,
        ['id', 'name', 'email', 'phone', 'city', 'state', 'country', 'segment', 'lifetimeValue', 'totalOrders', 'createdAt'],
        {
          id: 'ID',
          name: 'Name',
          email: 'Email',
          phone: 'Phone',
          city: 'City',
          state: 'State',
          country: 'Country',
          segment: 'Segment',
          lifetimeValue: 'Lifetime Value',
          totalOrders: 'Total Orders',
          createdAt: 'Created At',
        }
      );

      const filename = generateCsvFilename('customers');
      downloadCsv(csv, filename);
      toast.success(`Exported ${exportData.length} customers successfully`);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export customers');
    } finally {
      setIsExporting(false);
    }
  }, []);

  // Handle row click
  const handleRowClick = useCallback((customer: Customer) => {
    router.push(`/customers/${customer.id}`);
  }, [router]);

  // Handle add customer
  const handleAddCustomer = useCallback(() => {
    router.push('/customers/new');
  }, [router]);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setDateRange({ start: '', end: '' });
    setLifetimeValueRange({ min: '', max: '' });
    setSegmentFilter('');
  }, []);

  // Check if any filters are active
  const hasActiveFilters = searchQuery || dateRange.start || dateRange.end || lifetimeValueRange.min || lifetimeValueRange.max || segmentFilter;

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
              <h1 className="text-xl font-bold text-gray-900">Customers</h1>
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
                <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your customer relationships and track purchase history
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportCsv}
                  disabled={isExporting}
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
                  onClick={() => router.push('/customers/segments')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  View Segments
                </button>
                <button
                  onClick={handleAddCustomer}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Customer
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, phone, or email..."
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Segment Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Segment
                    </label>
                    <select
                      value={segmentFilter}
                      onChange={(e) => setSegmentFilter(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Segments</option>
                      <option value="VIP">VIP (&gt;₹10,000)</option>
                      <option value="Regular">Regular (₹1,000-₹10,000)</option>
                      <option value="New">New (&lt;₹1,000 or &lt;3 orders)</option>
                    </select>
                  </div>

                  {/* Date Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Created Date Range
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="flex items-center text-gray-500">to</span>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Lifetime Value Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lifetime Value Range (₹)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={lifetimeValueRange.min}
                        onChange={(e) => setLifetimeValueRange({ ...lifetimeValueRange, min: e.target.value })}
                        placeholder="Min"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="flex items-center text-gray-500">to</span>
                      <input
                        type="number"
                        value={lifetimeValueRange.max}
                        onChange={(e) => setLifetimeValueRange({ ...lifetimeValueRange, max: e.target.value })}
                        placeholder="Max"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                Failed to load customers. {!isOnline && 'You are currently offline.'}
              </p>
            </div>
          )}

          {/* Customer Count */}
          {customersData && (
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredCustomers.length} of {customersData.pagination.totalItems} customers
              {hasActiveFilters && ' (filtered)'}
            </div>
          )}

          {/* Desktop View: Table */}
          <div className="hidden md:block">
            {useVirtualization ? (
              <VirtualizedDataTable
                data={filteredCustomers}
                columns={columns}
                height={600}
                rowHeight={60}
                onRowClick={handleRowClick}
                loading={customersLoading}
                emptyMessage="No customers found. Try adjusting your search or filters."
              />
            ) : (
              <DataTable
                data={filteredCustomers}
                columns={columns}
                pageSize={pageSize}
                onRowClick={handleRowClick}
                loading={customersLoading}
                emptyMessage="No customers found. Try adjusting your search or filters."
                showPagination={true}
                showPageSizeSelector={true}
                pageSizeOptions={[10, 25, 50, 100]}
                manualPagination={false}
              />
            )}
          </div>

          {/* Mobile View: Cards */}
          <div className="md:hidden space-y-4">
            {customersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading customers...</p>
                </div>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No customers found. Try adjusting your search or filters.</p>
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleRowClick(customer)}
                  className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                        <p className="text-sm text-gray-500">{customer.phone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    {customer.email && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span className="text-gray-900">{customer.email}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Orders:</span>
                      <span className="text-gray-900 font-medium">{customer.totalOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Lifetime Value:</span>
                      <span className="text-gray-900 font-medium">
                        ₹{customer.lifetimeValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Joined:</span>
                      <span className="text-gray-900">{format(new Date(customer.createdAt), 'MMM dd, yyyy')}</span>
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
