/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Lead List Page
 * 
 * Displays lead list with status filtering, search, sorting, and pagination.
 * Uses TanStack Table for data grid functionality.
 * Responsive layout: cards on mobile, table on desktop.
 * 
 * Requirements: 9.1, 9.2, 28.3
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useAuth } from '@/hooks';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { leadsService } from '@/services/leads.service';
import { Lead } from '@/types/entities';
import { LeadStatus } from '@/types/enums';
import { DataTable } from '@/components/ui/data-table';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { SearchIcon, FunnelIcon as FilterIcon, PlusIcon, UserIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function LeadsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { logout } = useAuth();
  const { isOnline } = useNetworkStatus();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch leads with search and filters
  const { data: leadsData, isLoading: leadsLoading, error } = useQuery({
    queryKey: ['leads', debouncedSearch, statusFilter, page, pageSize],
    queryFn: async () => {
      const params: any = {
        query: debouncedSearch || undefined,
        status: statusFilter || undefined,
        page,
        pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
      };

      const response = await leadsService.getAll(params);
      return response;
    },
    enabled: isAuthenticated,
  });

  // Get status label with proper formatting
  const getStatusLabel = (status: LeadStatus): string => {
    const labels: Record<LeadStatus, string> = {
      [LeadStatus.NEW]: 'New',
      [LeadStatus.CONTACTED]: 'Contacted',
      [LeadStatus.QUALIFIED]: 'Qualified',
      [LeadStatus.PROPOSAL]: 'Proposal',
      [LeadStatus.NEGOTIATION]: 'Negotiation',
      [LeadStatus.WON]: 'Won',
      [LeadStatus.LOST]: 'Lost',
    };
    return labels[status] || status;
  };

  // Get status badge color
  const getStatusColor = (status: LeadStatus): string => {
    const colors: Record<LeadStatus, string> = {
      [LeadStatus.NEW]: 'bg-blue-100 text-blue-800',
      [LeadStatus.CONTACTED]: 'bg-purple-100 text-purple-800',
      [LeadStatus.QUALIFIED]: 'bg-indigo-100 text-indigo-800',
      [LeadStatus.PROPOSAL]: 'bg-yellow-100 text-yellow-800',
      [LeadStatus.NEGOTIATION]: 'bg-orange-100 text-orange-800',
      [LeadStatus.WON]: 'bg-green-100 text-green-800',
      [LeadStatus.LOST]: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Define table columns
  const columns = useMemo<ColumnDef<Lead>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <UserIcon className="h-4 w-4 text-blue-600" />
          </div>
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
      size: 200,
    },
    {
      accessorKey: 'company',
      header: 'Company',
      cell: ({ row }) => row.original.company || '-',
      size: 180,
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
      accessorKey: 'estimatedValue',
      header: 'Est. Value',
      cell: ({ row }) => 
        row.original.estimatedValue 
          ? `₹${row.original.estimatedValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : '-',
      size: 130,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created Date',
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM dd, yyyy'),
      size: 130,
    },
  ], []);

  // Handle row click
  const handleRowClick = (lead: Lead) => {
    router.push(`/leads/${lead.id}`);
  };

  // Handle add lead
  const handleAddLead = () => {
    router.push('/leads/new');
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery || statusFilter;

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
              <h1 className="text-xl font-bold text-gray-900">Leads</h1>
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
                <h2 className="text-2xl font-bold text-gray-900">Lead Management</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Track and manage your sales leads through the pipeline
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/leads/pipeline')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10m0-10a2 2 0 012 2v6a2 2 0 01-2 2m0 0a2 2 0 01-2-2" />
                  </svg>
                  Pipeline View
                </button>
                <button
                  onClick={handleAddLead}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Lead
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
                    placeholder="Search by name, company, phone, or email..."
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
                  {/* Status Filter */}
                  <div>
                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                      Lead Status
                    </label>
                    <select
                      id="status-filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Statuses</option>
                      <option value={LeadStatus.NEW}>New</option>
                      <option value={LeadStatus.CONTACTED}>Contacted</option>
                      <option value={LeadStatus.QUALIFIED}>Qualified</option>
                      <option value={LeadStatus.PROPOSAL}>Proposal</option>
                      <option value={LeadStatus.NEGOTIATION}>Negotiation</option>
                      <option value={LeadStatus.WON}>Won</option>
                      <option value={LeadStatus.LOST}>Lost</option>
                    </select>
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
                Failed to load leads. {!isOnline && 'You are currently offline.'}
              </p>
            </div>
          )}

          {/* Lead Count */}
          {leadsData && (
            <div className="mb-4 text-sm text-gray-600">
              Showing {leadsData.data.length} of {leadsData.pagination.totalItems} leads
              {hasActiveFilters && ' (filtered)'}
            </div>
          )}

          {/* Desktop View: Table */}
          <div className="hidden md:block">
            <DataTable
              data={leadsData?.data || []}
              columns={columns}
              pageSize={pageSize}
              onRowClick={handleRowClick}
              loading={leadsLoading}
              emptyMessage="No leads found. Try adjusting your search or filters."
              showPagination={true}
              showPageSizeSelector={true}
              pageSizeOptions={[10, 25, 50, 100]}
              manualPagination={false}
            />
          </div>

          {/* Mobile View: Cards */}
          <div className="md:hidden space-y-4">
            {leadsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading leads...</p>
                </div>
              </div>
            ) : !leadsData || leadsData.data.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No leads found. Try adjusting your search or filters.</p>
              </div>
            ) : (
              leadsData.data.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => handleRowClick(lead)}
                  className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                        {lead.company && (
                          <p className="text-sm text-gray-500">{lead.company}</p>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                      {getStatusLabel(lead.status)}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone:</span>
                      <span className="text-gray-900">{lead.phone}</span>
                    </div>
                    {lead.email && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span className="text-gray-900">{lead.email}</span>
                      </div>
                    )}
                    {lead.estimatedValue && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Est. Value:</span>
                        <span className="text-gray-900 font-medium">
                          ₹{lead.estimatedValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created:</span>
                      <span className="text-gray-900">{format(new Date(lead.createdAt), 'MMM dd, yyyy')}</span>
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
