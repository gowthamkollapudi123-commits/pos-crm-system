/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Customer Report Component
 * 
 * Comprehensive customer report with acquisition and retention metrics,
 * lifetime value trends, and customer segmentation analysis.
 * 
 * Requirements: 12.3
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { customersService } from '@/services/customers.service';
import { format, parseISO } from 'date-fns';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { 
  UsersIcon, 
  UserPlusIcon, 
  TrendingUpIcon,
  DollarSignIcon,
} from 'lucide-react';
import { MetricCard, MetricCardGrid } from '@/components/dashboard';
import { arrayToCsv, downloadCsv, generateCsvFilename, formatCurrencyForCsv } from '@/utils/csv-export';
import { ReportExportBar } from './ReportExportBar';
import { toast } from 'sonner';
import { useState } from 'react';

interface CustomerReportProps {
  startDate: string;
  endDate: string;
}

// Color palette for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function CustomerReport({ startDate, endDate }: CustomerReportProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Fetch customer analytics - Requirement 12.3
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['customer-report', startDate, endDate],
    queryFn: async () => {
      const response = await customersService.getCustomerAnalytics(startDate, endDate);
      return response.data;
    },
  });

  // Handle CSV export
  const handleExportCsv = () => {
    if (!analytics) {
      toast.error('No data available to export');
      return;
    }

    setIsExporting(true);

    try {
      // Prepare summary data
      const summaryData = [
        { metric: 'Total Customers', value: analytics.totalCustomers.toString() },
        { metric: 'New Customers', value: analytics.newCustomers.toString() },
        { metric: 'Retention Rate', value: `${analytics.retentionRate.toFixed(1)}%` },
        { metric: 'Average Lifetime Value', value: formatCurrencyForCsv(analytics.averageLifetimeValue) },
        { metric: 'Date Range', value: `${format(parseISO(startDate), 'MMM dd, yyyy')} - ${format(parseISO(endDate), 'MMM dd, yyyy')}` },
      ];

      // Prepare customer segmentation data
      const segmentationData = analytics.customerSegmentation.map(item => ({
        segment: item.segment,
        customers: item.count.toString(),
        totalValue: formatCurrencyForCsv(item.totalValue),
        avgValue: formatCurrencyForCsv(item.totalValue / item.count),
      }));

      // Prepare top customers data
      const topCustomersData = analytics.topCustomers.map(customer => ({
        name: customer.name,
        lifetimeValue: formatCurrencyForCsv(customer.lifetimeValue),
        totalOrders: customer.totalOrders.toString(),
      }));

      // Prepare acquisition trend data
      const acquisitionData = analytics.customerAcquisitionTrend.map(item => ({
        date: format(parseISO(item.date), 'MMM dd, yyyy'),
        newCustomers: item.count.toString(),
      }));

      // Prepare lifetime value distribution data
      const clvDistributionData = analytics.lifetimeValueDistribution.map(item => ({
        range: item.range,
        customers: item.count.toString(),
      }));

      // Generate CSV sections
      const summaryCsv = arrayToCsv(
        summaryData,
        ['metric', 'value'],
        { metric: 'Metric', value: 'Value' }
      );

      const segmentationCsv = arrayToCsv(
        segmentationData,
        ['segment', 'customers', 'totalValue', 'avgValue'],
        { segment: 'Segment', customers: 'Customers', totalValue: 'Total Value', avgValue: 'Avg Value' }
      );

      const topCustomersCsv = arrayToCsv(
        topCustomersData,
        ['name', 'lifetimeValue', 'totalOrders'],
        { name: 'Customer Name', lifetimeValue: 'Lifetime Value', totalOrders: 'Total Orders' }
      );

      const acquisitionCsv = arrayToCsv(
        acquisitionData,
        ['date', 'newCustomers'],
        { date: 'Date', newCustomers: 'New Customers' }
      );

      const clvDistributionCsv = arrayToCsv(
        clvDistributionData,
        ['range', 'customers'],
        { range: 'Lifetime Value Range', customers: 'Customers' }
      );

      // Combine all sections
      const fullCsv = [
        'Customer Report',
        '',
        'Summary Metrics',
        summaryCsv.replace('\uFEFF', ''),
        '',
        'Customer Segmentation',
        segmentationCsv.replace('\uFEFF', ''),
        '',
        'Top Customers by Lifetime Value',
        topCustomersCsv.replace('\uFEFF', ''),
        '',
        'Customer Acquisition Trend',
        acquisitionCsv.replace('\uFEFF', ''),
        '',
        'Lifetime Value Distribution',
        clvDistributionCsv.replace('\uFEFF', ''),
      ].join('\n');

      const csvWithBom = '\uFEFF' + fullCsv;
      const filename = generateCsvFilename('customer_report', { start: startDate, end: endDate });
      downloadCsv(csvWithBom, filename);

      toast.success('Customer report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export customer report');
    } finally {
      setIsExporting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customer report...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">
          Failed to load customer report data. Please try again.
        </p>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Report</h2>
          <p className="mt-1 text-sm text-gray-600">
            {format(parseISO(startDate), 'MMM dd, yyyy')} - {format(parseISO(endDate), 'MMM dd, yyyy')}
          </p>
        </div>
        <ReportExportBar
          reportTitle="Customer Report"
          onExportCsv={handleExportCsv}
          isExportingCsv={isExporting}
        />
      </div>

      {/* Key Metrics - Requirement 12.3 */}
      <MetricCardGrid>
        <MetricCard
          title="Total Customers"
          value={analytics.totalCustomers}
          format="number"
          subtitle="Active customer base"
          icon={<UsersIcon className="h-5 w-5" />}
          bgColor="bg-blue-50"
          textColor="text-blue-700"
        />
        <MetricCard
          title="New Customers"
          value={analytics.newCustomers}
          format="number"
          subtitle="Acquired in date range"
          icon={<UserPlusIcon className="h-5 w-5" />}
          bgColor="bg-green-50"
          textColor="text-green-700"
        />
        <MetricCard
          title="Retention Rate"
          value={`${analytics.retentionRate}%`}
          format="text"
          subtitle="Customer retention"
          icon={<TrendingUpIcon className="h-5 w-5" />}
          bgColor="bg-purple-50"
          textColor="text-purple-700"
        />
        <MetricCard
          title="Avg Lifetime Value"
          value={analytics.averageLifetimeValue}
          format="currency"
          currency="INR"
          subtitle="Per customer"
          icon={<DollarSignIcon className="h-5 w-5" />}
          bgColor="bg-orange-50"
          textColor="text-orange-700"
        />
      </MetricCardGrid>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Acquisition Trend Line Chart - Requirement 12.3 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Customer Acquisition Trend
          </h3>
          {analytics.customerAcquisitionTrend.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={analytics.customerAcquisitionTrend}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    tickFormatter={(value) => format(parseISO(value), 'MMM dd')}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    label={{ value: 'New Customers', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                    labelFormatter={(value) => format(parseISO(value as string), 'MMM dd, yyyy')}
                    formatter={(value) => [value, 'New Customers']}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80">
              <p className="text-sm text-gray-500">No acquisition data available</p>
            </div>
          )}
        </div>

        {/* Lifetime Value Distribution Bar Chart - Requirement 12.3 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Lifetime Value Distribution
          </h3>
          {analytics.lifetimeValueDistribution.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.lifetimeValueDistribution}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="range"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    label={{ value: 'Customers', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [value, 'Customers']}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80">
              <p className="text-sm text-gray-500">No distribution data available</p>
            </div>
          )}
        </div>

        {/* Customer Segmentation Pie Chart - Requirement 12.3 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Customer Segmentation
          </h3>
          {analytics.customerSegmentation.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.customerSegmentation}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) =>
                      `${entry.segment}: ${((entry.percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="segment"
                  >
                    {analytics.customerSegmentation.map((entry, index) => (
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
                    formatter={(value, name) => {
                      if (name === 'count') {
                        return [value, 'Customers'];
                      }
                      return [value, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80">
              <p className="text-sm text-gray-500">No segmentation data available</p>
            </div>
          )}
        </div>

        {/* Top Customers Table - Requirement 12.3 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Customers by Lifetime Value
          </h3>
          {analytics.topCustomers.length > 0 ? (
            <div className="overflow-y-auto" style={{ maxHeight: '320px' }}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lifetime Value
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.topCustomers.map((customer, index) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {index + 1}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{customer.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                        ₹{customer.lifetimeValue.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">
                        {customer.totalOrders}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80">
              <p className="text-sm text-gray-500">No customer data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Data Tables Section */}
      <div className="grid grid-cols-1 gap-6">
        {/* Customer Segmentation Breakdown Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Customer Segmentation Breakdown
          </h3>
          {analytics.customerSegmentation.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Segment
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customers
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Value
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Value
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.customerSegmentation.map((item, index) => {
                    const percentage = (item.count / analytics.totalCustomers) * 100;
                    const avgValue = item.totalValue / item.count;
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.segment}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {item.count.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          ₹{item.totalValue.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          ₹{avgValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              No segmentation data available
            </p>
          )}
        </div>
      </div>

      {/* Empty State */}
      {analytics.totalCustomers === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            <UsersIcon className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No customer data available
          </h3>
          <p className="text-sm text-gray-500">
            There are no customers recorded for the selected date range.
          </p>
        </div>
      )}
    </div>
  );
}
