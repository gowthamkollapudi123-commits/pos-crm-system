/**
 * Top Products Chart Component
 * 
 * Displays top-selling products using a bar chart.
 * Responsive and accessible with proper ARIA labels.
 * 
 * Requirements: 1.8, 6.5
 */

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TopProductsChartProps {
  data: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  isLoading?: boolean;
}

export function TopProductsChart({ data, isLoading }: TopProductsChartProps) {
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
    name: item.productName.length > 20 
      ? item.productName.substring(0, 20) + '...' 
      : item.productName,
    quantity: item.quantity,
    revenue: item.revenue,
  }));

  return (
    <div className="w-full h-80" role="img" aria-label="Top selling products bar chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis 
            yAxisId="left"
            orientation="left"
            stroke="#3b82f6"
            tick={{ fontSize: 12 }}
            label={{ value: 'Quantity', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#10b981"
            tick={{ fontSize: 12 }}
            label={{ value: 'Revenue (₹)', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '12px'
            }}
            formatter={(value, name) => {
              if (typeof value === 'number') {
                if (name === 'revenue') {
                  return [`₹${value.toLocaleString('en-IN')}`, 'Revenue'];
                }
                return [value, 'Quantity'];
              }
              return [value, name];
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value) => value === 'quantity' ? 'Quantity Sold' : 'Revenue (₹)'}
          />
          <Bar 
            yAxisId="left"
            dataKey="quantity" 
            fill="#3b82f6" 
            name="quantity"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            yAxisId="right"
            dataKey="revenue" 
            fill="#10b981" 
            name="revenue"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
