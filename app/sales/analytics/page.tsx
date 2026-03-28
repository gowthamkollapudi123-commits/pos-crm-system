/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Sales Analytics Page
 * 
 * Comprehensive sales analytics with date range filtering, visualizations,
 * and detailed breakdowns by category and payment method.
 * 
 * Requirements: 10.6, 10.7, 10.8
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ordersService } from '@/services/orders.service';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CalendarIcon, TrendingUpIcon, DollarSignIcon, ShoppingCartIcon, DownloadIcon } from 'lucide-react';
import { MetricCard, MetricCardGrid } from '@/components/dashboard';
import { arrayToCsv, downloadCsv, generateCsvFilename, formatCurrencyForCsv } from '@/utils/csv-export';
import { toast } from 'sonner';

// Quick filter options
type QuickFilter = 'today' | 'week' | 'month' | 'lastMonth' | 'custom';

// Color palette for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function SalesAnalyticsPage() {
  const today = new Date();
  
  // State for date range filtering
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('month');
  const [startDate, setStartDate] = useState<string>(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(endOfMonth(today), 'yyyy-MM-dd'));
  const [isExporting, setIsExporting] = useState(false);

  // Fetch sales analytics data
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['sales', 'analytics', startDate, endDate],
    queryFn: async () => {
      const response = await ordersService.getSalesAnalytics(startDate, endDate);
      return response.data;
    },
  });

  // Handle quick filter selection
  const handleQuickFilter = (filter: QuickFilter) => {
    setQuickFilter(filter);
    const now = new Date();
    
    switch (filter) {
      case 'today':
        setStartDate(format(now, 'yyyy-MM-dd'));
        setEndDate(format(now, 'yyyy-MM-dd'));
        break;
      case 'week':
        setStartDate(format(startOfWeek(now), 'yyyy-MM-dd'));
        setEndDate(format(endOfWeek(now), 'yyyy-MM-dd'));
        break;
      case 'month':
        setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
        break;
      case 'lastMonth':
        const lastMonth = subDays(startOfMonth(now), 1);
        setStartDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
        break;
      case 'custom':
        // Keep current dates for custom selection
        break;
    }
  };

  // Calculate total items sold
  const totalItemsSold = analytics?.salesByCategory.reduce((sum, cat) => sum + (cat.sales || 0), 0) || 0;

  // Handle CSV export - Requirement 10.9
  const handleExportCsv = () => {
    if (!analytics) {
      toast.error('No data available to export');
      return;
    }

    setIsExporting(true);

    try {
      // Prepare summary data
      const summaryData = [
        { metric: 'Total Sales', value: formatCurrencyForCsv(analytics.totalSales) },
        { metric: 'Total Orders', value: analytics.totalOrders.toString() },
        { metric: 'Average Order Value', value: formatCurrencyForCsv(analytics.averageOrderValue) },
        { metric: 'Total Items Sold', value: totalItemsSold.toString() },
        { metric: 'Date Range', value: `${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}` },
      ];

      // Prepare sales by category data
      const categoryData = analytics.salesByCategory.map(item => ({
        category: item.category,
        sales: formatCurrencyForCsv(item.sales),
        percentage: `${((item.sales / analytics.totalSales) * 100).toFixed(1)}%`,
      }));

      // Prepare sales by payment method data
      const paymentData = analytics.salesByPaymentMethod.map(item => ({
        method: item.method.toUpperCase(),
        sales: formatCurrencyForCsv(item.sales),
        percentage: `${((item.sales / analytics.totalSales) * 100).toFixed(1)}%`,
      }));

      // Generate CSV sections
      const summaryCsv = arrayToCsv(
        summaryData,
        ['metric', 'value'],
        { metric: 'Metric', value: 'Value' }
      );

      const categoryCsv = arrayToCsv(
        categoryData,
        ['category', 'sales', 'percentage'],
        { category: 'Category', sales: 'Sales', percentage: '% of Total' }
      );

      const paymentCsv = arrayToCsv(
        paymentData,
        ['method', 'sales', 'percentage'],
        { method: 'Payment Method', sales: 'Sales', percentage: '% of Total' }
      );

      // Combine all sections with blank lines
      const fullCsv = [
        'Sales Analytics Report',
        '',
        'Summary Metrics',
        summaryCsv.replace('\uFEFF', ''), // Remove BOM from sections
        '',
        'Sales by Category',
        categoryCsv.replace('\uFEFF', ''),
        '',
        'Sales by Payment Method',
        paymentCsv.replace('\uFEFF', ''),
      ].join('\n');

      // Add BOM at the beginning
      const csvWithBom = '\uFEFF' + fullCsv;

      // Generate filename and download
      const filename = generateCsvFilename('sales_analytics', { start: startDate, end: endDate });
      downloadCsv(csvWithBom, filename);

      toast.success('Sales analytics exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export sales analytics');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
              <p className="mt-1 text-sm text-gray-600">
                Comprehensive sales insights and performance metrics
              </p>
            </div>
            {analytics && (
              <button
                onClick={handleExportCsv}
                disabled={isExporting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <DownloadIcon className="h-5 w-5 mr-2" />
                    Export to CSV
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Date Range Filter Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleQuickFilter('today')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    quickFilter === 'today'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => handleQuickFilter('week')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    quickFilter === 'week'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => handleQuickFilter('month')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    quickFilter === 'month'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  This Month
                </button>
                <button
                  onClick={() => handleQuickFilter('lastMonth')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    quickFilter === 'lastMonth'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Last Month
                </button>
                <button
                  onClick={() => handleQuickFilter('custom')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    quickFilter === 'custom'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Custom
                </button>
              </div>

              {/* Custom Date Range Inputs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setQuickFilter('custom');
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-gray-500 self-center">to</span>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setQuickFilter('custom');
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading analytics...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                Failed to load analytics data. Please try again.
              </p>
            </div>
          )}

          {/* Analytics Content */}
          {analytics && !isLoading && (
            <>
              {/* Key Metrics - Requirement 10.6 */}
              <MetricCardGrid>
                <MetricCard
                  title="Total Sales"
                  value={analytics.totalSales}
                  format="currency"
                  currency="INR"
                  subtitle={startDate && endDate ? `${format(new Date(startDate), 'MMM dd')} - ${format(new Date(endDate), 'MMM dd')}` : 'Select date range'}
                  icon={<DollarSignIcon className="h-5 w-5" />}
                  bgColor="bg-blue-50"
                  textColor="text-blue-700"
                />
                <MetricCard
                  title="Total Orders"
                  value={analytics.totalOrders}
                  format="number"
                  subtitle="Completed transactions"
                  icon={<ShoppingCartIcon className="h-5 w-5" />}
                  bgColor="bg-green-50"
                  textColor="text-green-700"
                />
                <MetricCard
                  title="Average Order Value"
                  value={analytics.averageOrderValue}
                  format="currency"
                  currency="INR"
                  subtitle="Per transaction"
                  icon={<TrendingUpIcon className="h-5 w-5" />}
                  bgColor="bg-purple-50"
                  textColor="text-purple-700"
                />
                <MetricCard
                  title="Total Items Sold"
                  value={totalItemsSold}
                  format="number"
                  subtitle="Across all categories"
                  icon={<TrendingUpIcon className="h-5 w-5" />}
                  bgColor="bg-orange-50"
                  textColor="text-orange-700"
                />
              </MetricCardGrid>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales by Category - Requirement 10.7 */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Sales by Product Category
                  </h3>
                  {analytics.salesByCategory.length > 0 ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analytics.salesByCategory}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="category"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            tick={{ fontSize: 12 }}
                            stroke="#6b7280"
                          />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            stroke="#6b7280"
                            label={{ value: 'Sales (₹)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              fontSize: '12px',
                            }}
                            formatter={(value) => {
                              if (typeof value === 'number') {
                                return [`₹${value.toLocaleString('en-IN')}`, 'Sales'];
                              }
                              return [value, 'Sales'];
                            }}
                          />
                          <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-80">
                      <p className="text-sm text-gray-500">No category data available</p>
                    </div>
                  )}
                </div>

                {/* Sales by Payment Method - Requirement 10.8 */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Sales by Payment Method
                  </h3>
                  {analytics.salesByPaymentMethod.length > 0 ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.salesByPaymentMethod}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ method, percent }: { method?: string; percent?: number }) =>
                              `${method ?? ''}: ${((percent ?? 0) * 100).toFixed(0)}%`
                            }
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="sales"
                            nameKey="method"
                          >
                            {analytics.salesByPaymentMethod.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              fontSize: '12px',
                            }}
                            formatter={(value) => {
                              if (typeof value === 'number') {
                                return [`₹${value.toLocaleString('en-IN')}`, 'Sales'];
                              }
                              return [value, 'Sales'];
                            }}
                          />
                          <Legend
                            wrapperStyle={{ fontSize: '12px' }}
                            formatter={(value) => value.toUpperCase()}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-80">
                      <p className="text-sm text-gray-500">No payment method data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Tables Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown Table */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Category Breakdown
                  </h3>
                  {analytics.salesByCategory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Category
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Sales
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              % of Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {analytics.salesByCategory.map((item, index) => {
                            const percentage = (item.sales / analytics.totalSales) * 100;
                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {item.category}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                  ₹{item.sales.toLocaleString('en-IN')}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 text-right">
                                  {percentage.toFixed(1)}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No category data available
                    </p>
                  )}
                </div>

                {/* Payment Method Breakdown Table */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Payment Method Breakdown
                  </h3>
                  {analytics.salesByPaymentMethod.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Payment Method
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Sales
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              % of Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {analytics.salesByPaymentMethod.map((item, index) => {
                            const percentage = (item.sales / analytics.totalSales) * 100;
                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {item.method.toUpperCase()}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                  ₹{item.sales.toLocaleString('en-IN')}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 text-right">
                                  {percentage.toFixed(1)}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No payment method data available
                    </p>
                  )}
                </div>
              </div>

              {/* Empty State */}
              {analytics.totalOrders === 0 && (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                    <TrendingUpIcon className="h-full w-full" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No sales data available
                  </h3>
                  <p className="text-sm text-gray-500">
                    There are no sales recorded for the selected date range.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
