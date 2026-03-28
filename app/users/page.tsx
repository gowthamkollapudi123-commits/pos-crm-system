/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * User List Page
 *
 * Displays user list with search, role/status filters, and pagination.
 * Uses TanStack Table for data grid functionality.
 * Responsive layout: cards on mobile, table on desktop.
 *
 * Requirements: 14.1
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useAuth } from '@/hooks';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { usersService } from '@/services/users.service';
import { User } from '@/types/entities';
import { Role } from '@/types/enums';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { DataTable } from '@/components/ui/data-table';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { SearchIcon, PlusIcon, UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const ROLE_LABELS: Record<string, string> = {
  [Role.ADMIN]: 'Admin',
  [Role.MANAGER]: 'Manager',
  [Role.STAFF]: 'Staff',
};

const ROLE_COLORS: Record<string, string> = {
  [Role.ADMIN]: 'bg-purple-100 text-purple-800',
  [Role.MANAGER]: 'bg-blue-100 text-blue-800',
  [Role.STAFF]: 'bg-gray-100 text-gray-800',
};

export default function UsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { logout } = useAuth();
  const { isOnline } = useNetworkStatus();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch users
  const { data: usersData, isLoading: usersLoading, error } = useQuery({
    queryKey: ['users', debouncedSearch, page, pageSize],
    queryFn: async () => {
      const params: any = {
        query: debouncedSearch || undefined,
        page,
        pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
      };
      return usersService.getAll(params);
    },
    enabled: isAuthenticated,
  });

  // Deactivate/activate mutation
  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => usersService.deactivate(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User status updated');
    },
    onError: () => {
      toast.error('Failed to update user status');
    },
  });

  // Client-side filter by role and status
  const filteredUsers = useMemo(() => {
    if (!usersData?.data) return [];
    let filtered = usersData.data;

    if (roleFilter) {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter((u) => u.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((u) => !u.isActive);
    }

    return filtered;
  }, [usersData?.data, roleFilter, statusFilter]);

  // Table columns
  const columns = useMemo<ColumnDef<User>[]>(
    () => [
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
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => row.original.email,
        size: 220,
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => {
          const role = row.original.role as string;
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-800'
              }`}
            >
              {ROLE_LABELS[role] ?? role}
            </span>
          );
        },
        size: 120,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              row.original.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {row.original.isActive ? 'Active' : 'Inactive'}
          </span>
        ),
        size: 100,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created At',
        cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM dd, yyyy'),
        size: 130,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <PermissionGate requiredRole={Role.ADMIN}>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/users/${row.original.id}/edit`);
                }}
                className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-300 rounded hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={`Edit ${row.original.name}`}
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deactivateMutation.mutate(row.original.id);
                }}
                className={`px-3 py-1 text-xs font-medium border rounded focus:outline-none focus:ring-2 ${
                  row.original.isActive
                    ? 'text-red-600 border-red-300 hover:bg-red-50 focus:ring-red-500'
                    : 'text-green-600 border-green-300 hover:bg-green-50 focus:ring-green-500'
                }`}
                aria-label={`${row.original.isActive ? 'Deactivate' : 'Activate'} ${row.original.name}`}
              >
                {row.original.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </PermissionGate>
        ),
        size: 160,
      },
    ],
    [router, deactivateMutation]
  );

  const hasActiveFilters = searchQuery || roleFilter || statusFilter;

  const handleClearFilters = () => {
    setSearchQuery('');
    setRoleFilter('');
    setStatusFilter('');
  };

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
              <h1 className="text-xl font-bold text-gray-900">Users</h1>
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
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Manage users and their role assignments
                </p>
              </div>
              <PermissionGate requiredRole={Role.ADMIN}>
                <button
                  onClick={() => router.push('/users/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add User
                </button>
              </PermissionGate>
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
                    placeholder="Search by name or email..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    aria-label="Search users"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <div className="w-full lg:w-48">
                <label htmlFor="role-filter" className="sr-only">
                  Filter by role
                </label>
                <select
                  id="role-filter"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Roles</option>
                  <option value={Role.ADMIN}>Admin</option>
                  <option value={Role.MANAGER}>Manager</option>
                  <option value={Role.STAFF}>Staff</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="w-full lg:w-48">
                <label htmlFor="status-filter" className="sr-only">
                  Filter by status
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                Failed to load users. {!isOnline && 'You are currently offline.'}
              </p>
            </div>
          )}

          {/* User Count */}
          {usersData && (
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredUsers.length} of {usersData.pagination.totalItems} users
              {hasActiveFilters && ' (filtered)'}
            </div>
          )}

          {/* Desktop View: Table */}
          <div className="hidden md:block">
            <DataTable
              data={filteredUsers}
              columns={columns}
              pageSize={pageSize}
              loading={usersLoading}
              emptyMessage="No users found. Try adjusting your search or filters."
              showPagination={true}
              showPageSizeSelector={true}
              pageSizeOptions={[10, 25, 50]}
              manualPagination={false}
            />
          </div>

          {/* Mobile View: Cards */}
          <div className="md:hidden space-y-4">
            {usersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading users...</p>
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No users found. Try adjusting your search or filters.</p>
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div key={u.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{u.name}</h3>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Role:</span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ROLE_COLORS[u.role as string] ?? 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ROLE_LABELS[u.role as string] ?? u.role}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created:</span>
                      <span className="text-gray-900">{format(new Date(u.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <PermissionGate requiredRole={Role.ADMIN}>
                      <button
                        onClick={() => router.push(`/users/${u.id}/edit`)}
                        className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-300 rounded hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deactivateMutation.mutate(u.id)}
                        className={`flex-1 px-3 py-1.5 text-xs font-medium border rounded focus:outline-none focus:ring-2 ${
                          u.isActive
                            ? 'text-red-600 border-red-300 hover:bg-red-50 focus:ring-red-500'
                            : 'text-green-600 border-green-300 hover:bg-green-50 focus:ring-green-500'
                        }`}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </PermissionGate>
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
