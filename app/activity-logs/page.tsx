/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Activity Log Viewer Page
 *
 * Admin-only page that displays a filterable, paginated table of activity logs
 * with CSV export capability.
 *
 * Requirements: 30.6, 30.7, 30.8
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useAuth } from '@/hooks';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { activityLogService } from '@/services/activity-log.service';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectOption } from '@/components/ui/select';
import { Role } from '@/types/enums';
import { ActivityType } from '@/types/enums';
import type { ActivityLog } from '@/types/entities';
import { format } from 'date-fns';
import { SearchIcon, DownloadIcon, ClipboardListIcon } from 'lucide-react';
import { toast } from 'sonner';
import { downloadCsv, arrayToCsv, generateCsvFilename } from '@/utils/csv-export';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_TYPE_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Types' },
  { value: ActivityType.AUTH, label: 'Auth' },
  { value: ActivityType.TRANSACTION, label: 'Transaction' },
  { value: ActivityType.INVENTORY, label: 'Inventory' },
  { value: ActivityType.CONFIG, label: 'Config' },
  { value: ActivityType.USER_MANAGEMENT, label: 'User Management' },
  { value: ActivityType.CUSTOMER, label: 'Customer' },
  { value: ActivityType.LEAD, label: 'Lead' },
];

const ACTION_TYPE_COLORS: Record<string, string> = {
  [ActivityType.AUTH]: 'bg-blue-100 text-blue-800',
  [ActivityType.TRANSACTION]: 'bg-green-100 text-green-800',
  [ActivityType.INVENTORY]: 'bg-yellow-100 text-yellow-800',
  [ActivityType.CONFIG]: 'bg-purple-100 text-purple-800',
  [ActivityType.USER_MANAGEMENT]: 'bg-red-100 text-red-800',
  [ActivityType.CUSTOMER]: 'bg-indigo-100 text-indigo-800',
  [ActivityType.LEAD]: 'bg-orange-100 text-orange-800',
};

const PAGE_SIZE = 20;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActivityLogsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { logout } = useAuth();
  const { isOnline } = useNetworkStatus();

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [debouncedUser, setDebouncedUser] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);

  // Debounce user filter
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedUser(userFilter);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [userFilter]);

  // Reset page when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [startDate, endDate, actionTypeFilter]);

  // Auth guard — Admin only
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!authLoading && isAuthenticated && user?.role !== Role.ADMIN) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Fetch logs
  const { data, isLoading, error } = useQuery({
    queryKey: ['activity-logs', startDate, endDate, debouncedUser, actionTypeFilter, page],
    queryFn: () =>
      activityLogService.getAll({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        userId: debouncedUser || undefined,
        actionType: actionTypeFilter || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    enabled: isAuthenticated && user?.role === Role.ADMIN,
  });

  const logs: ActivityLog[] = data?.data ?? [];
  const pagination = data?.pagination;

  const hasActiveFilters = startDate || endDate || userFilter || actionTypeFilter;

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setUserFilter('');
    setActionTypeFilter('');
  };

  // CSV export — client-side from current page data, or server-side blob
  const handleExportCsv = async () => {
    try {
      if (isOnline) {
        const blob = await activityLogService.exportCsv({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          userId: debouncedUser || undefined,
          actionType: actionTypeFilter || undefined,
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = generateCsvFilename('activity-logs', startDate && endDate ? { start: startDate, end: endDate } : undefined);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Fallback: export current page data client-side
        const csv = arrayToCsv(
          logs,
          ['timestamp', 'userName', 'type', 'action', 'entityType', 'entityId'],
          {
            timestamp: 'Timestamp',
            userName: 'User',
            type: 'Action Type',
            action: 'Action',
            entityType: 'Entity',
            entityId: 'Entity ID',
          }
        );
        downloadCsv(csv, generateCsvFilename('activity-logs'));
      }
      toast.success('Activity logs exported');
    } catch {
      toast.error('Failed to export activity logs');
    }
  };

  // ─── Render guards ──────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== Role.ADMIN) {
    return null;
  }

  // ─── Main render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
              <h1 className="text-xl font-bold text-gray-900">Activity Logs</h1>
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
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Activity Log Viewer</h2>
              <p className="mt-1 text-sm text-gray-600">
                Audit trail of all user actions in the system
              </p>
            </div>
            <button
              onClick={handleExportCsv}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Export activity logs as CSV"
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Start Date */}
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || undefined}
                aria-label="Filter by start date"
              />

              {/* End Date */}
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                aria-label="Filter by end date"
              />

              {/* User filter */}
              <div>
                <label
                  htmlFor="user-filter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  User
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="user-filter"
                    type="text"
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    placeholder="Filter by user..."
                    className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    aria-label="Filter by user name"
                  />
                </div>
              </div>

              {/* Action type filter */}
              <Select
                label="Action Type"
                options={ACTION_TYPE_OPTIONS}
                value={actionTypeFilter}
                onChange={(v) => setActionTypeFilter(v)}
                aria-label="Filter by action type"
              />
            </div>

            {hasActiveFilters && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                Failed to load activity logs.{' '}
                {!isOnline && 'You are currently offline.'}
              </p>
            </div>
          )}

          {/* Result count */}
          {pagination && (
            <p className="mb-3 text-sm text-gray-600">
              Showing {logs.length} of {pagination.totalItems} entries
              {hasActiveFilters && ' (filtered)'}
            </p>
          )}

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200" role="table" aria-label="Activity logs">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action Type</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                        </div>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <ClipboardListIcon className="h-12 w-12 text-gray-300 mb-3" />
                          <p className="text-gray-500 text-sm">No activity logs found.</p>
                          {hasActiveFilters && (
                            <p className="text-gray-400 text-xs mt-1">Try adjusting your filters.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                          {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{log.userName}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              ACTION_TYPE_COLORS[log.type] ?? 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {log.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{log.action}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {log.entityType && (
                            <span>
                              {log.entityType}
                              {log.entityId && (
                                <span className="text-gray-400 ml-1 font-mono text-xs">
                                  #{log.entityId.slice(0, 8)}
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                          {log.metadata ? JSON.stringify(log.metadata) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
              </div>
            ) : logs.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <ClipboardListIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No activity logs found.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ACTION_TYPE_COLORS[log.type] ?? 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {log.type}
                    </span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(log.timestamp), 'MMM dd, HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{log.action}</p>
                  <p className="text-xs text-gray-500 mt-1">by {log.userName}</p>
                  {log.entityType && (
                    <p className="text-xs text-gray-400 mt-1">
                      {log.entityType}
                      {log.entityId && ` #${log.entityId.slice(0, 8)}`}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="Previous page"
                >
                  Previous
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, page - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        pageNum === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                      }`}
                      aria-label={`Page ${pageNum}`}
                      aria-current={pageNum === page ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
