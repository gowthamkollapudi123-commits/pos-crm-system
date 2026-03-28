/**
 * Profit & Loss Report Component
 *
 * Comprehensive P&L report showing revenue, estimated COGS, operating expenses,
 * gross profit, net profit, and profit margin trends over time.
 *
 * Note: COGS is estimated at 60% of revenue and operating expenses at 15% of
 * revenue as this is a frontend-only simulation.
 *
 * Requirements: 12.6
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { ordersService } from '@/services/orders.service';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
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
} from 'recharts';
import {
  DollarSignIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  AlertCircleIcon,
} from 'lucide-react';
import { MetricCard, MetricCardGrid } from '@/components/dashboard';
import {
  arrayToCsv,
  downloadCsv,
  generateCsvFilename,
  formatCurrencyForCsv,
} from '@/utils/csv-export';
import { ReportExportBar } from './ReportExportBar';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';

interface ProfitLossReportProps {
  startDate: string;
  endDate: string;
}

// Estimation constants (frontend-only simulation)
const COGS_RATE = 0.6; // 60% of revenue
const OPEX_RATE = 0.15; // 15% of revenue

// Color palette for charts
const COLORS = {
  revenue: '#3b82f6',
  cogs: '#ef4444',
  grossProfit: '#10b981',
  netProfit: '#8b5cf6',
  opex: '#f59e0b',
};

interface PnLTrendPoint {
  date: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  netProfit: number;
}

interface PnLBarPoint {
  name: string;
  value: number;
  fill: string;
}

export function ProfitLossReport({ startDate, endDate }: ProfitLossReportProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Fetch sales analytics - Requirement 12.6
  const { data: salesData, isLoading, error } = useQuery({
    queryKey: ['profit-loss-report', startDate, endDate],
    queryFn: async () => {
      const response = await ordersService.getSalesAnalytics(startDate, endDate);
      return response.data;
    },
  });

  // Derive P&L metrics from sales data
  const pnlMetrics = useMemo(() => {
    if (!salesData) {
      return null;
    }

    const revenue = salesData.totalSales;
    const cogs = revenue * COGS_RATE;
    const grossProfit = revenue - cogs;
    const operatingExpenses = revenue * OPEX_RATE;
    const netProfit = grossProfit - operatingExpenses;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    // Bar chart data: Revenue vs COGS vs Gross Profit
    const barData: PnLBarPoint[] = [
      { name: 'Revenue', value: revenue, fill: COLORS.revenue },
      { name: 'COGS (est.)', value: cogs, fill: COLORS.cogs },
      { name: 'Gross Profit', value: grossProfit, fill: COLORS.grossProfit },
      { name: 'Operating Exp. (est.)', value: operatingExpenses, fill: COLORS.opex },
      { name: 'Net Profit', value: netProfit, fill: COLORS.netProfit },
    ];

    // Trend data: distribute revenue across days with slight variation
    const days = eachDayOfInterval({
      start: parseISO(startDate),
      end: parseISO(endDate),
    });

    const trendData: PnLTrendPoint[] = days.map((day, idx) => {
      const variation = 0.7 + ((idx % 7) / 10);
      const dailyRevenue = Math.round((revenue / days.length) * variation);
      const dailyCogs = Math.round(dailyRevenue * COGS_RATE);
      const dailyGrossProfit = dailyRevenue - dailyCogs;
      const dailyOpex = Math.round(dailyRevenue * OPEX_RATE);
      const dailyNetProfit = dailyGrossProfit - dailyOpex;

      return {
        date: format(day, 'yyyy-MM-dd'),
        revenue: dailyRevenue,
        cogs: dailyCogs,
        grossProfit: dailyGrossProfit,
        netProfit: dailyNetProfit,
      };
    });

    return {
      revenue,
      cogs,
      grossProfit,
      operatingExpenses,
      netProfit,
      grossMargin,
      netMargin,
      barData,
      trendData,
      totalOrders: salesData.totalOrders,
    };
  }, [salesData, startDate, endDate]);

  // Handle CSV export
  const handleExportCsv = () => {
    if (!pnlMetrics) {
      toast.error('No data available to export');
      return;
    }

    setIsExporting(true);

    try {
      const summaryData = [
        { metric: 'Total Revenue', value: formatCurrencyForCsv(pnlMetrics.revenue), note: 'Actual' },
        { metric: 'Cost of Goods Sold (COGS)', value: formatCurrencyForCsv(pnlMetrics.cogs), note: 'Estimated (60% of revenue)' },
        { metric: 'Gross Profit', value: formatCurrencyForCsv(pnlMetrics.grossProfit), note: 'Revenue - COGS' },
        { metric: 'Gross Margin', value: `${pnlMetrics.grossMargin.toFixed(1)}%`, note: 'Gross Profit / Revenue' },
        { metric: 'Operating Expenses', value: formatCurrencyForCsv(pnlMetrics.operatingExpenses), note: 'Estimated (15% of revenue)' },
        { metric: 'Net Profit', value: formatCurrencyForCsv(pnlMetrics.netProfit), note: 'Gross Profit - Operating Expenses' },
        { metric: 'Net Profit Margin', value: `${pnlMetrics.netMargin.toFixed(1)}%`, note: 'Net Profit / Revenue' },
        { metric: 'Total Orders', value: pnlMetrics.totalOrders.toString(), note: '' },
        { metric: 'Date Range', value: `${format(parseISO(startDate), 'MMM dd, yyyy')} - ${format(parseISO(endDate), 'MMM dd, yyyy')}`, note: '' },
      ];

      const summaryCsv = arrayToCsv(
        summaryData,
        ['metric', 'value', 'note'],
        { metric: 'Metric', value: 'Value', note: 'Note' }
      );

      const fullCsv = [
        'Profit & Loss Report',
        '* COGS and Operating Expenses are estimates for simulation purposes',
        '',
        'P&L Summary',
        summaryCsv.replace('\uFEFF', ''),
      ].join('\n');

      const csvWithBom = '\uFEFF' + fullCsv;
      const filename = generateCsvFilename('profit_loss_report', {
        start: startDate,
        end: endDate,
      });
      downloadCsv(csvWithBom, filename);

      toast.success('Profit & Loss report exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export Profit & Loss report');
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
          <p className="mt-4 text-gray-600">Loading profit & loss report...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">
          Failed to load profit & loss report data. Please try again.
        </p>
      </div>
    );
  }

  if (!salesData || !pnlMetrics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profit &amp; Loss Report</h2>
          <p className="mt-1 text-sm text-gray-600">
            {format(parseISO(startDate), 'MMM dd, yyyy')} -{' '}
            {format(parseISO(endDate), 'MMM dd, yyyy')}
          </p>
        </div>
        <ReportExportBar
          reportTitle="Profit &amp; Loss Report"
          onExportCsv={handleExportCsv}
          isExportingCsv={isExporting}
        />
      </div>

      {/* Estimation disclaimer */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <AlertCircleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Estimated values:</span> COGS is estimated at 60% of
          revenue and operating expenses at 15% of revenue. These are simulated figures for
          demonstration purposes.
        </p>
      </div>

      {/* Key Metrics - Requirement 12.6 */}
      <MetricCardGrid>
        <MetricCard
          title="Total Revenue"
          value={pnlMetrics.revenue}
          format="currency"
          currency="INR"
          subtitle="Gross sales for period"
          icon={<DollarSignIcon className="h-5 w-5" />}
          bgColor="bg-blue-50"
          textColor="text-blue-700"
        />
        <MetricCard
          title="COGS (est.)"
          value={pnlMetrics.cogs}
          format="currency"
          currency="INR"
          subtitle="~60% of revenue"
          icon={<TrendingDownIcon className="h-5 w-5" />}
          bgColor="bg-red-50"
          textColor="text-red-700"
        />
        <MetricCard
          title="Gross Profit"
          value={pnlMetrics.grossProfit}
          format="currency"
          currency="INR"
          subtitle={`Margin: ${pnlMetrics.grossMargin.toFixed(1)}%`}
          icon={<TrendingUpIcon className="h-5 w-5" />}
          bgColor="bg-green-50"
          textColor="text-green-700"
        />
        <MetricCard
          title="Net Profit (est.)"
          value={pnlMetrics.netProfit}
          format="currency"
          currency="INR"
          subtitle={`Margin: ${pnlMetrics.netMargin.toFixed(1)}%`}
          icon={<TrendingUpIcon className="h-5 w-5" />}
          bgColor="bg-purple-50"
          textColor="text-purple-700"
        />
      </MetricCardGrid>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs COGS vs Gross Profit Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            P&amp;L Overview
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pnlMetrics.barData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  angle={-30}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [
                    `₹${Number(value ?? 0).toLocaleString('en-IN')}`,
                    'Amount',
                  ]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {pnlMetrics.barData.map((entry, index) => (
                    <rect key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit Margin Trend Line Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Profit Margin Trend
          </h3>
          {pnlMetrics.trendData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={pnlMetrics.trendData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 11 }}
                    stroke="#6b7280"
                    tickFormatter={(value) => format(parseISO(value), 'MMM dd')}
                    interval={Math.max(0, Math.floor(pnlMetrics.trendData.length / 8) - 1)}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                    labelFormatter={(value) =>
                      format(parseISO(value as string), 'MMM dd, yyyy')
                    }
                    formatter={(value, name) => [
                      `₹${Number(value ?? 0).toLocaleString('en-IN')}`,
                      name ?? '',
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke={COLORS.revenue}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="grossProfit"
                    name="Gross Profit"
                    stroke={COLORS.grossProfit}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="netProfit"
                    name="Net Profit"
                    stroke={COLORS.netProfit}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80">
              <p className="text-sm text-gray-500">No trend data available</p>
            </div>
          )}
        </div>
      </div>

      {/* P&L Summary Table - Requirement 12.6 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          P&amp;L Summary
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Line Item
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % of Revenue
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Note
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Revenue */}
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                  Total Revenue
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-blue-700 text-right">
                  ₹{pnlMetrics.revenue.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 text-right">100.0%</td>
                <td className="px-4 py-3 text-xs text-gray-500">Actual sales</td>
              </tr>

              {/* COGS */}
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-700 pl-8">
                  Cost of Goods Sold (COGS)
                </td>
                <td className="px-4 py-3 text-sm text-red-600 text-right">
                  (₹{pnlMetrics.cogs.toLocaleString('en-IN')})
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 text-right">
                  {(COGS_RATE * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-3 text-xs text-amber-600">Estimated</td>
              </tr>

              {/* Gross Profit */}
              <tr className="bg-green-50 hover:bg-green-100">
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                  Gross Profit
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-green-700 text-right">
                  ₹{pnlMetrics.grossProfit.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-green-700 text-right">
                  {pnlMetrics.grossMargin.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">Revenue − COGS</td>
              </tr>

              {/* Operating Expenses */}
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-700 pl-8">
                  Operating Expenses
                </td>
                <td className="px-4 py-3 text-sm text-red-600 text-right">
                  (₹{pnlMetrics.operatingExpenses.toLocaleString('en-IN')})
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 text-right">
                  {(OPEX_RATE * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-3 text-xs text-amber-600">Estimated</td>
              </tr>

              {/* Net Profit */}
              <tr className={`${pnlMetrics.netProfit >= 0 ? 'bg-purple-50 hover:bg-purple-100' : 'bg-red-50 hover:bg-red-100'}`}>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">
                  Net Profit
                </td>
                <td className={`px-4 py-3 text-sm font-bold text-right ${
                  pnlMetrics.netProfit >= 0 ? 'text-purple-700' : 'text-red-700'
                }`}>
                  {pnlMetrics.netProfit < 0 ? '(' : ''}
                  ₹{Math.abs(pnlMetrics.netProfit).toLocaleString('en-IN')}
                  {pnlMetrics.netProfit < 0 ? ')' : ''}
                </td>
                <td className={`px-4 py-3 text-sm font-bold text-right ${
                  pnlMetrics.netProfit >= 0 ? 'text-purple-700' : 'text-red-700'
                }`}>
                  {pnlMetrics.netMargin.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">Gross Profit − OpEx</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {pnlMetrics.totalOrders === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            <DollarSignIcon className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No revenue data available
          </h3>
          <p className="text-sm text-gray-500">
            There are no sales recorded for the selected date range.
          </p>
        </div>
      )}
    </div>
  );
}
