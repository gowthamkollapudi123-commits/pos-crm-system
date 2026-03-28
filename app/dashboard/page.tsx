/**
 * Dashboard Page
 * 
 * Main dashboard with business metrics, charts, and recent activity.
 * Implements auto-refresh and offline support.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.9, 6.10
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useAuth } from '@/hooks';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOverdueTaskNotifications } from '@/hooks/useOverdueTaskNotifications';
import { useLowStockNotifications } from '@/hooks/useLowStockNotifications';
import { dashboardService } from '@/services/dashboard.service';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { NotificationBell } from '@/components/leads/NotificationBell';
import { MetricCard, MetricCardGrid, TopProductsChart, SalesTrendChart, CustomerAcquisitionChart, RecentTransactionsList, OverdueTasksWidget, LowStockWidget } from '@/components/dashboard';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { DollarSignIcon, ShoppingCartIcon, PackageIcon, AlertTriangleIcon } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isOnline } = useNetworkStatus();
  
  // Show toast notifications for overdue tasks on app load
  useOverdueTaskNotifications();
  
  // Show toast notifications for low stock products on app load
  useLowStockNotifications();

  // Requirement 6.9: Refresh dashboard data automatically every 5 minutes when online
  const { data: metrics, isLoading: metricsLoading, error } = useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async () => {
      const response = await dashboardService.getMetrics();
      return response.data;
    },
    refetchInterval: isOnline ? 5 * 60 * 1000 : false, // 5 minutes when online
    enabled: isAuthenticated,
  });

  // Requirement 6.6: Fetch sales trends data
  const { data: salesTrends, isLoading: salesTrendsLoading } = useQuery({
    queryKey: ['dashboard', 'sales-trends'],
    queryFn: async () => {
      const response = await dashboardService.getSalesTrends('month');
      return response.data;
    },
    refetchInterval: isOnline ? 5 * 60 * 1000 : false,
    enabled: isAuthenticated,
  });

  // Requirement 6.5: Fetch top products data
  const { data: topProducts, isLoading: topProductsLoading } = useQuery({
    queryKey: ['dashboard', 'top-products'],
    queryFn: async () => {
      const response = await dashboardService.getTopProducts(10);
      return response.data;
    },
    refetchInterval: isOnline ? 5 * 60 * 1000 : false,
    enabled: isAuthenticated,
  });

  // Requirement 6.8: Fetch customer acquisition data
  const { data: customerAcquisition, isLoading: customerAcquisitionLoading } = useQuery({
    queryKey: ['dashboard', 'customer-acquisition'],
    queryFn: async () => {
      const response = await dashboardService.getCustomerAcquisition('month');
      return response.data;
    },
    refetchInterval: isOnline ? 5 * 60 * 1000 : false,
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-12">
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Loading State */}
      {metricsLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            Failed to load dashboard data. {!isOnline && 'You are currently offline.'}
          </p>
        </div>
      )}

      {/* Dashboard Grid Layout */}
      {metrics && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <MetricCardGrid>
            {/* Sales Metrics - Restricted to Admin/Manager */}
            <PermissionGate requiredPermission="VIEW_REPORTS">
              <MetricCard
                title="Total Sales Today"
                value={metrics.sales.today}
                format="currency"
                currency="INR"
                subtitle={`Week: ₹${formatNumber(metrics.sales.week)} | Month: ₹${formatNumber(metrics.sales.month)}`}
                icon={<DollarSignIcon className="h-5 w-5" />}
                bgColor="bg-blue-50"
                textColor="text-blue-700"
              />
            </PermissionGate>

            {/* Transaction Metrics - Visible to All */}
            <MetricCard
              title="Transactions Today"
              value={metrics.transactions.today}
              format="number"
              subtitle={`Week: ${formatNumber(metrics.transactions.week)} | Month: ${formatNumber(metrics.transactions.month)}`}
              icon={<ShoppingCartIcon className="h-5 w-5" />}
              bgColor="bg-green-50"
              textColor="text-green-700"
            />

            {/* Inventory Value - Restricted to Admin/Manager */}
            <PermissionGate requiredPermission="VIEW_INVENTORY">
              <MetricCard
                title="Inventory Value"
                value={metrics.inventory.totalValue}
                format="currency"
                currency="INR"
                subtitle="Total stock value"
                icon={<PackageIcon className="h-5 w-5" />}
                bgColor="bg-purple-50"
                textColor="text-purple-700"
              />
            </PermissionGate>

            {/* Low Stock Alerts - Restricted to Admin/Manager */}
            <PermissionGate requiredPermission="VIEW_INVENTORY">
              <MetricCard
                title="Low Stock Items"
                value={metrics.inventory.lowStockCount}
                format="number"
                subtitle="Items below threshold"
                icon={<AlertTriangleIcon className="h-5 w-5" />}
                bgColor="bg-orange-50"
                textColor="text-orange-700"
                alert={metrics.inventory.lowStockCount > 0}
              />
            </PermissionGate>
          </MetricCardGrid>

          {/* Charts Section - Restricted to Admin/Manager */}
          <PermissionGate requiredPermission="VIEW_REPORTS">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
                <TopProductsChart 
                  data={topProducts || []} 
                  isLoading={topProductsLoading}
                />
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trends (30 Days)</h3>
                <SalesTrendChart 
                  data={salesTrends || []} 
                  isLoading={salesTrendsLoading}
                />
              </div>
            </div>
          </PermissionGate>

          {/* Customer Acquisition - Restricted to Admin/Manager */}
          <PermissionGate requiredPermission="VIEW_REPORTS">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Acquisition (30 Days)</h3>
              <CustomerAcquisitionChart 
                data={customerAcquisition || []} 
                isLoading={customerAcquisitionLoading}
              />
            </div>
          </PermissionGate>

          {/* Widgets Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overdue Tasks Widget - Visible to All (Staff see their own) */}
            <OverdueTasksWidget />

            {/* Low Stock Widget - Restricted to Admin/Manager */}
            <PermissionGate requiredPermission="VIEW_INVENTORY">
              <LowStockWidget />
            </PermissionGate>
          </div>

          {/* Recent Transactions List - Visible to All */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
            <RecentTransactionsList 
              transactions={metrics.recentTransactions || []}
              isLoading={metricsLoading}
              onTransactionClick={(transaction) => {
                console.log('Transaction clicked:', transaction);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Format number with proper separators
 */
function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}
