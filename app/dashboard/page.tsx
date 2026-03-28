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
import { 
  MetricCard, 
  MetricCardGrid,
  TopProductsChart,
  SalesTrendChart,
  CustomerAcquisitionChart,
  RecentTransactionsList,
  OverdueTasksWidget,
  LowStockWidget
} from '@/components/dashboard';
import { 
  DollarSignIcon, 
  ShoppingCartIcon, 
  PackageIcon, 
  AlertTriangleIcon 
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { logout } = useAuth();
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
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">POS CRM Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Requirement 6.10: Display offline indicator when disconnected */}
              <OfflineIndicator />
              {/* Notification Bell for overdue tasks */}
              <NotificationBell />
              <span className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{user.name}</span>
              </span>
              <span className="text-xs text-gray-500">({user.role})</span>
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

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                Failed to load dashboard data. {!isOnline && 'You are currently offline.'}
              </p>
            </div>
          )}

          {/* Dashboard Grid Layout */}
          {metrics && (
            <div className="space-y-6">
              {/* Metrics Grid - Requirements 6.1, 6.2, 6.3, 6.4 */}
              <MetricCardGrid>
                {/* Sales Metrics - Requirement 6.1 */}
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

                {/* Transaction Metrics - Requirement 6.2 */}
                <MetricCard
                  title="Transactions Today"
                  value={metrics.transactions.today}
                  format="number"
                  subtitle={`Week: ${formatNumber(metrics.transactions.week)} | Month: ${formatNumber(metrics.transactions.month)}`}
                  icon={<ShoppingCartIcon className="h-5 w-5" />}
                  bgColor="bg-green-50"
                  textColor="text-green-700"
                />

                {/* Inventory Value - Requirement 6.3 */}
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

                {/* Low Stock Alerts - Requirement 6.4 */}
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
              </MetricCardGrid>

              {/* Charts Section - Requirements 6.5, 6.6, 6.8 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Selling Products Chart - Requirement 6.5 */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Top Selling Products
                  </h3>
                  <TopProductsChart 
                    data={topProducts || []} 
                    isLoading={topProductsLoading}
                  />
                </div>

                {/* Sales Trends Chart - Requirement 6.6 */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Sales Trends (Last 30 Days)
                  </h3>
                  <SalesTrendChart 
                    data={salesTrends || []} 
                    isLoading={salesTrendsLoading}
                  />
                </div>
              </div>

              {/* Customer Acquisition Chart - Requirement 6.8 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Customer Acquisition (Last 30 Days)
                </h3>
                <CustomerAcquisitionChart 
                  data={customerAcquisition || []} 
                  isLoading={customerAcquisitionLoading}
                />
              </div>

              {/* Widgets Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Overdue Tasks Widget - Requirements 9.9, 29.4 */}
                <OverdueTasksWidget />

                {/* Low Stock Widget - Requirements 11.6, 29.1 */}
                <LowStockWidget />
              </div>

              {/* Recent Transactions List - Requirement 6.7 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Transactions
                </h3>
                <RecentTransactionsList 
                  transactions={metrics.recentTransactions || []}
                  isLoading={metricsLoading}
                  onTransactionClick={(transaction) => {
                    // TODO: Navigate to transaction details or show modal
                    console.log('Transaction clicked:', transaction);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * Format number with proper separators
 */
function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}
