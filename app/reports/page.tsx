/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Reports Page
 * 
 * Main reports page with report type selection and date range filtering.
 * Serves as the foundation for all report types: Sales, Inventory, Customer,
 * Product Performance, Payment Method, and P&L reports.
 * 
 * Requirements: 12.1, 28.6
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useAuth } from '@/hooks';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { Select, SelectOption } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { SalesReport, InventoryReport, CustomerReport, ProductPerformanceReport, PaymentMethodReport, ProfitLossReport, ScheduledReports } from '@/components/reports';
import { 
  BarChart3Icon, 
  PackageIcon, 
  UsersIcon, 
  TrendingUpIcon, 
  CreditCardIcon, 
  DollarSignIcon,
  CalendarIcon,
  FileTextIcon
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

// Report type definitions
type ReportType = 'sales' | 'inventory' | 'customer' | 'product-performance' | 'payment-method' | 'profit-loss';

interface ReportTypeOption {
  value: ReportType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export default function ReportsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { logout } = useAuth();
  const { isOnline } = useNetworkStatus();

  // Report selection state
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('sales');
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<'generate' | 'scheduled'>('generate');
  
  // Date range state - Requirement 28.6
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  // Report generation state
  const [showReport, setShowReport] = useState(false);

  // Quick date range presets
  const applyQuickRange = (preset: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth') => {
    const today = new Date();
    let start: Date;
    let end: Date = today;

    switch (preset) {
      case 'today':
        start = today;
        break;
      case 'yesterday':
        start = subDays(today, 1);
        end = subDays(today, 1);
        break;
      case 'last7days':
        start = subDays(today, 7);
        break;
      case 'last30days':
        start = subDays(today, 30);
        break;
      case 'thisMonth':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'lastMonth':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      default:
        start = today;
    }

    setDateRange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
    });
  };

  // Report type options - Requirement 12.1
  const reportTypes: ReportTypeOption[] = [
    {
      value: 'sales',
      label: 'Sales Report',
      description: 'View sales performance by date range with trends and comparisons',
      icon: <BarChart3Icon className="h-5 w-5" />,
    },
    {
      value: 'inventory',
      label: 'Inventory Report',
      description: 'Current stock levels, low stock alerts, and inventory value',
      icon: <PackageIcon className="h-5 w-5" />,
    },
    {
      value: 'customer',
      label: 'Customer Report',
      description: 'Customer acquisition, retention metrics, and lifetime value',
      icon: <UsersIcon className="h-5 w-5" />,
    },
    {
      value: 'product-performance',
      label: 'Product Performance',
      description: 'Top and bottom sellers, category performance analysis',
      icon: <TrendingUpIcon className="h-5 w-5" />,
    },
    {
      value: 'payment-method',
      label: 'Payment Method Report',
      description: 'Transaction distribution by payment method and trends',
      icon: <CreditCardIcon className="h-5 w-5" />,
    },
    {
      value: 'profit-loss',
      label: 'Profit & Loss Report',
      description: 'Revenue, costs, profit margins, and financial summary',
      icon: <DollarSignIcon className="h-5 w-5" />,
    },
  ];

  // Get current report type details
  const currentReportType = reportTypes.find(rt => rt.value === selectedReportType);

  // Convert report types to select options
  const reportTypeSelectOptions: SelectOption[] = reportTypes.map(rt => ({
    value: rt.value,
    label: rt.label,
  }));

  // Handle generate report
  const handleGenerateReport = () => {
    setShowReport(true);
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
              <h1 className="text-xl font-bold text-gray-900">Reports</h1>
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
            <h2 className="text-2xl font-bold text-gray-900">Business Reports</h2>
            <p className="mt-1 text-sm text-gray-600">
              Generate comprehensive reports to analyze your business performance
            </p>
          </div>

          {/* Tab Bar */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Report tabs">
              <button
                onClick={() => setActiveTab('generate')}
                className={`py-3 px-1 border-b-2 text-sm font-medium focus:outline-none ${
                  activeTab === 'generate'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                aria-current={activeTab === 'generate' ? 'page' : undefined}
              >
                Generate Report
              </button>
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`py-3 px-1 border-b-2 text-sm font-medium focus:outline-none ${
                  activeTab === 'scheduled'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                aria-current={activeTab === 'scheduled' ? 'page' : undefined}
              >
                Scheduled Reports
              </button>
            </nav>
          </div>

          {/* Scheduled Reports Tab */}
          {activeTab === 'scheduled' && <ScheduledReports />}

          {/* Generate Report Tab */}
          {activeTab === 'generate' && (
          <>
          {/* Report Configuration Panel */}
          <div className="bg-white rounded-lg shadow">
            {/* Report Type Selection */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select Report Type
              </h3>
              
              {/* Desktop: Grid View */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportTypes.map((reportType) => (
                  <button
                    key={reportType.value}
                    onClick={() => setSelectedReportType(reportType.value)}
                    className={`
                      p-4 rounded-lg border-2 text-left transition-all
                      ${selectedReportType === reportType.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        p-2 rounded-lg
                        ${selectedReportType === reportType.value
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600'
                        }
                      `}>
                        {reportType.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`
                          font-medium text-sm mb-1
                          ${selectedReportType === reportType.value
                            ? 'text-blue-900'
                            : 'text-gray-900'
                          }
                        `}>
                          {reportType.label}
                        </h4>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {reportType.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Mobile: Dropdown */}
              <div className="md:hidden">
                <Select
                  label="Report Type"
                  options={reportTypeSelectOptions}
                  value={selectedReportType}
                  onChange={(value) => setSelectedReportType(value as ReportType)}
                />
                {currentReportType && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                        {currentReportType.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-900 mb-1">
                          {currentReportType.label}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {currentReportType.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Date Range Selection - Requirement 28.6 */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-gray-600" />
                Date Range
              </h3>

              {/* Quick Range Buttons */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Select
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => applyQuickRange('today')}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => applyQuickRange('yesterday')}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Yesterday
                  </button>
                  <button
                    onClick={() => applyQuickRange('last7days')}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => applyQuickRange('last30days')}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Last 30 Days
                  </button>
                  <button
                    onClick={() => applyQuickRange('thisMonth')}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => applyQuickRange('lastMonth')}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Last Month
                  </button>
                </div>
              </div>

              {/* Custom Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePicker
                  label="Start Date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  max={dateRange.end || undefined}
                  required
                />
                <DatePicker
                  label="End Date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  min={dateRange.start || undefined}
                  required
                />
              </div>

              {/* Date Range Summary */}
              {dateRange.start && dateRange.end && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <span className="font-medium">Selected Range:</span>{' '}
                    {format(new Date(dateRange.start), 'MMM dd, yyyy')} to{' '}
                    {format(new Date(dateRange.end), 'MMM dd, yyyy')}
                    {' '}({Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24)) + 1} days)
                  </p>
                </div>
              )}
            </div>

            {/* Generate Report Button */}
            <div className="p-6">
              <button
                onClick={handleGenerateReport}
                disabled={!dateRange.start || !dateRange.end}
                className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileTextIcon className="h-5 w-5 mr-2" />
                Generate Report
              </button>
            </div>
          </div>

          {/* Report Visualization Area */}
          {showReport ? (
            <div className="mt-6">
              {selectedReportType === 'sales' && (
                <SalesReport startDate={dateRange.start} endDate={dateRange.end} />
              )}
              {selectedReportType === 'inventory' && (
                <InventoryReport startDate={dateRange.start} endDate={dateRange.end} />
              )}
              {selectedReportType === 'customer' && (
                <CustomerReport startDate={dateRange.start} endDate={dateRange.end} />
              )}
              {selectedReportType === 'product-performance' && (
                <ProductPerformanceReport startDate={dateRange.start} endDate={dateRange.end} />
              )}
              {selectedReportType === 'payment-method' && (
                <PaymentMethodReport startDate={dateRange.start} endDate={dateRange.end} />
              )}
              {selectedReportType === 'profit-loss' && (
                <ProfitLossReport startDate={dateRange.start} endDate={dateRange.end} />
              )}
            </div>
          ) : (
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <FileTextIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Report Preview
                </h3>
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                  Select a report type and date range, then click &quot;Generate Report&quot; to view your data.
                </p>
              </div>
            </div>
          )}
          </>
          )}
        </div>
      </main>
    </div>
  );
}
