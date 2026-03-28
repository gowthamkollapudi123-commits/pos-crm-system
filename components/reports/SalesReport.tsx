/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Sales Report Component
 * 
 * Comprehensive sales report with date range filtering, visualizations,
 * and year-over-year comparison metrics.
 * 
 * Requirements: 12.1, 12.7, 12.11
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { ordersService } from '@/services/orders.service';
import { format, subYears, parseISO } from 'date-fns';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  DollarSignIcon, 
  ShoppingCartIcon, 
  TrendingUpIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from 'lucide-react';
import { MetricCard, MetricCardGrid } from '@/components/dashboard';
import { arrayToCsv, downloadCsv, generateCsvFilename, formatCurrencyForCsv } from '@/utils/csv-export';
import { ReportExportBar } from './ReportExportBar';
import { toast } from 'sonner';
import { useState } from 'react';

interface SalesReportProps {
  startDate: string;
  endDate: string;
}

// Color palette for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function SalesReport({ startDate, endDate }: SalesReportProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Fetch current period sales analytics - Requirement 12.1
  const { data: currentPeriod, isLoading: currentLoading, error: currentError } = useQuery({
    queryKey: ['sales-report', 'current', startDate, endDate],
    queryFn: async () => {
      const response = await ordersService.getSalesAnalytics(startDate, endDate);
      return response.data;
    },
  });

  // Calculate previous year dates for YoY comparison - Requirement 12.11
  const prevYearStart = format(subYears(parseISO(startDate), 1), 'yyyy-MM-dd');
  const prevYearEnd = format(subYears(parseISO(endDate), 1), 'yyyy-MM-dd');

  // Fetch previous year sales analytics for YoY comparison
  const { data: previousPeriod, isLoading: previousLoading } = useQuery({
    queryKey: ['sales-report', 'previous', prevYearStart, prevYearEnd],
    queryFn: async () => {
      const response = await ordersService.getSalesAnalytics(prevYearStart, prevYearEnd);
      return response.data;
    },
  });

  // Calculate YoY metrics - Requirement 12.11
  const yoyMetrics = currentPeriod && previousPeriod ? {
    salesChange: ((currentPeriod.totalSales - previousPeriod.totalSales) / previousPeriod.totalSales) * 100,
    ordersChange: ((currentPeriod.totalOrders - previousPeriod.totalOrders) / previousPeriod.totalOrders) * 100,
    aovChange: ((currentPeriod.averageOrderValue - previousPeriod.averageOrderValue) / previousPeriod.averageOrderValue) * 100,
  } : null;

  // Handle CSV export - Requirement 12.1
  const handleExportCsv = () => {
    if (!currentPeriod) {
      toast.error('No data available to export');
      return;
    }

    setIsExporting(true);

    try {
      // Prepare summary data
      const summaryData = [
        { metric: 'Total Sales', current: formatCurrencyForCsv(currentPeriod.totalSales), previous: previousPeriod ? formatCurrencyForCsv(previousPeriod.totalSales) : 'N/A', change: yoyMetrics ? `${yoyMetrics.salesChange.toFixed(1)}%` : 'N/A' },
        { metric: 'Total Orders', current: currentPeriod.totalOrders.toString(), previous: previousPeriod ? previousPeriod.totalOrders.toString() : 'N/A', change: yoyMetrics ? `${yoyMetrics.ordersChange.toFixed(1)}%` : 'N/A' },
        { metric: 'Average Order Value', current: formatCurrencyForCsv(currentPeriod.averageOrderValue), previous: previousPeriod ? formatCurrencyForCsv(previousPeriod.averageOrderValue) : 'N/A', change: yoyMetrics ? `${yoyMetrics.aovChange.toFixed(1)}%` : 'N/A' },
        { metric: 'Date Range', current: `${format(parseISO(startDate), 'MMM dd, yyyy')} - ${format(parseISO(endDate), 'MMM dd, yyyy')}`, previous: previousPeriod ? `${format(parseISO(prevYearStart), 'MMM dd, yyyy')} - ${format(parseISO(prevYearEnd), 'MMM dd, yyyy')}` : 'N/A', change: '' },
      ];

      // Prepare sales by category data
      const categoryData = currentPeriod.salesByCategory.map(item => ({
        category: item.category,
        sales: formatCurrencyForCsv(item.sales),
        percentage: `${((item.sales / currentPeriod.totalSales) * 100).toFixed(1)}%`,
      }));

      // Prepare sales by payment method data
      const paymentData = currentPeriod.salesByPaymentMethod.map(item => ({
        method: item.method.toUpperCase(),
        sales: formatCurrencyForCsv(item.sales),
        percentage: `${((item.sales / currentPeriod.totalSales) * 100).toFixed(1)}%`,
      }));

      // Generate CSV sections
      const summaryCsv = arrayToCsv(
        summaryData,
        ['metric', 'current', 'previous', 'change'],
        { metric: 'Metric', current: 'Current Period', previous: 'Previous Year', change: 'YoY Change' }
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

      // Combine all sections
      const fullCsv = [
        'Sales Report',
        '',
        'Summary Metrics with Year-over-Year Comparison',
        summaryCsv.replace('\uFEFF', ''),
        '',
        'Sales by Category',
        categoryCsv.replace('\uFEFF', ''),
        '',
        'Sales by Payment Method',
        paymentCsv.replace('\uFEFF', ''),
      ].join('\n');

      const csvWithBom = '\uFEFF' + fullCsv;
      const filename = generateCsvFilename('sales_report', { start: startDate, end: endDate });
      downloadCsv(csvWithBom, filename);

      toast.success('Sales report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export sales report');
    } finally {
      setIsExporting(false);
    }
  };

  // Loading state
  if (currentLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sales report...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (currentError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">
          Failed to load sales report data. Please try again.
        </p>
      </div>
    );
  }

  if (!currentPeriod) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Report</h2>
          <p className="mt-1 text-sm text-gray-600">
            {format(parseISO(startDate), 'MMM dd, yyyy')} - {format(parseISO(endDate), 'MMM dd, yyyy')}
          </p>
        </div>
        <ReportExportBar
          reportTitle="Sales Report"
          onExportCsv={handleExportCsv}
          isExportingCsv={isExporting}
        />
      </div>

      {/* Key Metrics with YoY Comparison - Requirements 12.1, 12.11 */}
      <MetricCardGrid>
        <MetricCard
          title="Total Sales"
          value={currentPeriod.totalSales}
          format="currency"
          currency="INR"
          subtitle={previousPeriod ? `Previous Year: ₹${previousPeriod.totalSales.toLocaleString('en-IN')}` : 'No previous year data'}
          trend={yoyMetrics ? {
            value: Math.abs(yoyMetrics.salesChange),
            isPositive: yoyMetrics.salesChange >= 0,
          } : undefined}
          icon={<DollarSignIcon className="h-5 w-5" />}
          bgColor="bg-blue-50"
          textColor="text-blue-700"
        />
        <MetricCard
          title="Total Orders"
          value={currentPeriod.totalOrders}
          format="number"
          subtitle={previousPeriod ? `Previous Year: ${previousPeriod.totalOrders.toLocaleString('en-IN')}` : 'No previous year data'}
          trend={yoyMetrics ? {
            value: Math.abs(yoyMetrics.ordersChange),
            isPositive: yoyMetrics.ordersChange >= 0,
          } : undefined}
          icon={<ShoppingCartIcon className="h-5 w-5" />}
          bgColor="bg-green-50"
          textColor="text-green-700"
        />
        <MetricCard
          title="Average Order Value"
          value={currentPeriod.averageOrderValue}
          format="currency"
          currency="INR"
          subtitle={previousPeriod ? `Previous Year: ₹${previousPeriod.averageOrderValue.toLocaleString('en-IN')}` : 'No previous year data'}
          trend={yoyMetrics ? {
            value: Math.abs(yoyMetrics.aovChange),
            isPositive: yoyMetrics.aovChange >= 0,
          } : undefined}
          icon={<TrendingUpIcon className="h-5 w-5" />}
          bgColor="bg-purple-50"
          textColor="text-purple-700"
        />
        <MetricCard
          title="Total Items Sold"
          value={currentPeriod.salesByCategory.reduce((sum, cat) => sum + (cat.sales || 0), 0)}
          format="number"
          subtitle="Across all categories"
          icon={<TrendingUpIcon className="h-5 w-5" />}
          bgColor="bg-orange-50"
          textColor="text-orange-700"
        />
      </MetricCardGrid>

      {/* Year-over-Year Comparison Summary - Requirement 12.11 */}
      {yoyMetrics && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Year-over-Year Comparison
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Sales Growth</span>
                <div className={`flex items-center text-sm font-semibold ${
                  yoyMetrics.salesChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {yoyMetrics.salesChange >= 0 ? (
                    <ArrowUpIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(yoyMetrics.salesChange).toFixed(1)}%
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Compared to {format(parseISO(prevYearStart), 'MMM yyyy')} - {format(parseISO(prevYearEnd), 'MMM yyyy')}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Orders Growth</span>
                <div className={`flex items-center text-sm font-semibold ${
                  yoyMetrics.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {yoyMetrics.ordersChange >= 0 ? (
                    <ArrowUpIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(yoyMetrics.ordersChange).toFixed(1)}%
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Transaction volume change
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">AOV Growth</span>
                <div className={`flex items-center text-sm font-semibold ${
                  yoyMetrics.aovChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {yoyMetrics.aovChange >= 0 ? (
                    <ArrowUpIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(yoyMetrics.aovChange).toFixed(1)}%
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Average order value change
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section - Requirement 12.7 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sales by Product Category
          </h3>
          {currentPeriod.salesByCategory.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={currentPeriod.salesByCategory}
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

        {/* Sales by Payment Method Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sales by Payment Method
          </h3>
          {currentPeriod.salesByPaymentMethod.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentPeriod.salesByPaymentMethod}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name ?? ''}: ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="sales"
                    nameKey="method"
                  >
                    {currentPeriod.salesByPaymentMethod.map((entry, index) => (
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
          {currentPeriod.salesByCategory.length > 0 ? (
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
                  {currentPeriod.salesByCategory.map((item, index) => {
                    const percentage = (item.sales / currentPeriod.totalSales) * 100;
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
          {currentPeriod.salesByPaymentMethod.length > 0 ? (
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
                  {currentPeriod.salesByPaymentMethod.map((item, index) => {
                    const percentage = (item.sales / currentPeriod.totalSales) * 100;
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
      {currentPeriod.totalOrders === 0 && (
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
    </div>
  );
}
