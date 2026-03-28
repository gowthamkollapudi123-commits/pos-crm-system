/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Customer Segments Page
 * 
 * Displays customer segmentation analytics based on purchase behavior.
 * Shows segment distribution with charts and customer lists per segment.
 * 
 * Segmentation Logic:
 * - VIP: Lifetime value > ₹10,000
 * - Regular: Lifetime value ₹1,000 - ₹10,000
 * - New: Lifetime value < ₹1,000 or totalOrders < 3
 * - Inactive: No orders in last 6 months (if order data available)
 * 
 * Requirements: 8.6
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useAuth } from '@/hooks';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { customersService } from '@/services/customers.service';
import { Customer } from '@/types/entities';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Users, TrendingUp, UserCheck, UserPlus, UserX } from 'lucide-react';

// Segment colors
const SEGMENT_COLORS = {
  VIP: '#10b981', // green
  Regular: '#3b82f6', // blue
  New: '#f59e0b', // amber
  Inactive: '#ef4444', // red
};

// Segment icons
const SEGMENT_ICONS = {
  VIP: TrendingUp,
  Regular: UserCheck,
  New: UserPlus,
  Inactive: UserX,
};

interface SegmentData {
  segment: string;
  count: number;
  percentage: number;
  customers: Customer[];
  totalValue: number;
  avgValue: number;
}

export default function CustomerSegmentsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { logout } = useAuth();
  const { isOnline } = useNetworkStatus();

  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  // Fetch all customers
  const { data: customersData, isLoading: customersLoading, error } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => {
      const response = await customersService.getAll({ pageSize: 10000 });
      return response;
    },
    enabled: isAuthenticated,
  });

  // Calculate segments from customer data
  const segmentData = useMemo<SegmentData[]>(() => {
    if (!customersData?.data) return [];

    const customers = customersData.data;
    const totalCustomers = customers.length;

    // Categorize customers into segments
    const segments: Record<string, Customer[]> = {
      VIP: [],
      Regular: [],
      New: [],
      Inactive: [],
    };

    customers.forEach(customer => {
      const { lifetimeValue, totalOrders } = customer;

      // Segmentation logic (prioritize New segment for low orders or low value)
      if (totalOrders < 3 || lifetimeValue < 1000) {
        segments.New.push(customer);
      } else if (lifetimeValue > 10000) {
        segments.VIP.push(customer);
      } else {
        // Regular: 1000-10000 with 3+ orders
        segments.Regular.push(customer);
      }

      // Note: Inactive segment would require order date data
      // For now, we'll skip inactive classification
    });

    // Calculate segment statistics
    return Object.entries(segments).map(([segment, customers]) => {
      const count = customers.length;
      const percentage = totalCustomers > 0 ? (count / totalCustomers) * 100 : 0;
      const totalValue = customers.reduce((sum, c) => sum + c.lifetimeValue, 0);
      const avgValue = count > 0 ? totalValue / count : 0;

      return {
        segment,
        count,
        percentage,
        customers,
        totalValue,
        avgValue,
      };
    }).filter(s => s.count > 0); // Only show segments with customers
  }, [customersData]);

  // Prepare chart data
  const pieChartData = segmentData.map(s => ({
    name: s.segment,
    value: s.count,
  }));

  const barChartData = segmentData.map(s => ({
    segment: s.segment,
    count: s.count,
    avgValue: s.avgValue,
  }));

  // Get selected segment details
  const selectedSegmentData = selectedSegment
    ? segmentData.find(s => s.segment === selectedSegment)
    : null;

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
                onClick={() => router.push('/customers')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Customers
              </button>
              <h1 className="text-xl font-bold text-gray-900">Customer Segments</h1>
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
            <h2 className="text-2xl font-bold text-gray-900">Customer Segmentation Analytics</h2>
            <p className="mt-1 text-sm text-gray-600">
              Analyze customer segments based on purchase behavior and lifetime value
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                Failed to load customer data. {!isOnline && 'You are currently offline.'}
              </p>
            </div>
          )}

          {/* Loading State */}
          {customersLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading segment data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Segment Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {segmentData.map((segment) => {
                  const Icon = SEGMENT_ICONS[segment.segment as keyof typeof SEGMENT_ICONS] || Users;
                  const color = SEGMENT_COLORS[segment.segment as keyof typeof SEGMENT_COLORS];

                  return (
                    <div
                      key={segment.segment}
                      onClick={() => setSelectedSegment(segment.segment)}
                      className={`bg-white rounded-lg shadow p-6 cursor-pointer transition-all hover:shadow-md ${
                        selectedSegment === segment.segment ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className="h-12 w-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <Icon className="h-6 w-6" style={{ color }} />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{segment.count}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{segment.segment}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {segment.percentage.toFixed(1)}% of customers
                      </p>
                      <div className="text-xs text-gray-500">
                        <div>Avg Value: ₹{segment.avgValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                        <div>Total: ₹{segment.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Pie Chart - Segment Distribution */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Segment Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={SEGMENT_COLORS[entry.name as keyof typeof SEGMENT_COLORS]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar Chart - Average Value by Segment */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Customer Value by Segment</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="segment" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => `₹${Number(value ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                      />
                      <Bar dataKey="avgValue" fill="#3b82f6">
                        {barChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={SEGMENT_COLORS[entry.segment as keyof typeof SEGMENT_COLORS]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Customer List for Selected Segment */}
              {selectedSegmentData && (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedSegmentData.segment} Customers ({selectedSegmentData.count})
                      </h3>
                      <button
                        onClick={() => setSelectedSegment(null)}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {selectedSegmentData.customers.slice(0, 10).map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => router.push(`/customers/${customer.id}`)}
                        className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{customer.name}</h4>
                            <p className="text-sm text-gray-500">{customer.phone}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              ₹{customer.lifetimeValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-gray-500">{customer.totalOrders} orders</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedSegmentData.customers.length > 10 && (
                      <div className="px-6 py-4 text-center">
                        <button
                          onClick={() => router.push(`/customers?segment=${selectedSegmentData.segment}`)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View all {selectedSegmentData.customers.length} customers →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {segmentData.length === 0 && !customersLoading && (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No customer data available for segmentation.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
