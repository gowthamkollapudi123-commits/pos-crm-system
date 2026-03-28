/**
 * Sales Trend Chart Component
 * 
 * Displays sales trends over time using an area chart.
 * Responsive and accessible with proper ARIA labels.
 * 
 * Requirements: 1.8, 6.6
 */

'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface SalesTrendChartProps {
  data: Array<{
    date: string;
    sales: number;
  }>;
  isLoading?: boolean;
}

export function SalesTrendChart({ data, isLoading }: SalesTrendChartProps) {
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
    sales: item.sales,
    fullDate: item.date,
  }));

  return (
    <div className="w-full h-80" role="img" aria-label="Sales trends over time area chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
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
              fontSize: '12px'
            }}
            labelFormatter={(label) => `Date: ${label}`}
            formatter={(value) => {
              if (typeof value === 'number') {
                return [`₹${value.toLocaleString('en-IN')}`, 'Sales'];
              }
              return [value, 'Sales'];
            }}
          />
          <Area 
            type="monotone" 
            dataKey="sales" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorSales)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
