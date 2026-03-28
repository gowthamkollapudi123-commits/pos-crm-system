/**
 * Customer Acquisition Chart Component
 * 
 * Displays customer acquisition trends over time using a line chart.
 * Responsive and accessible with proper ARIA labels.
 * 
 * Requirements: 1.8, 6.8
 */

'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface CustomerAcquisitionChartProps {
  data: Array<{
    date: string;
    newCustomers: number;
    totalCustomers: number;
  }>;
  isLoading?: boolean;
}

export function CustomerAcquisitionChart({ data, isLoading }: CustomerAcquisitionChartProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading chart...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80">
        <p className="text-sm text-gray-500">No data available</p>
      </div>
    );
  }

  // Format data for the chart
  const chartData = data.map((item) => ({
    date: format(parseISO(item.date), 'MMM dd'),
    newCustomers: item.newCustomers,
    totalCustomers: item.totalCustomers,
    fullDate: item.date,
  }));

  return (
    <div className="w-full h-80" role="img" aria-label="Customer acquisition trends line chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            label={{ value: 'Customers', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '12px'
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value) => {
              if (value === 'newCustomers') return 'New Customers';
              if (value === 'totalCustomers') return 'Total Customers';
              return value;
            }}
          />
          <Line 
            type="monotone" 
            dataKey="newCustomers" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name="newCustomers"
          />
          <Line 
            type="monotone" 
            dataKey="totalCustomers" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
            name="totalCustomers"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
