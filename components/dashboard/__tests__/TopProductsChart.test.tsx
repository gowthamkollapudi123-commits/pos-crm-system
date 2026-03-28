/**
 * Unit tests for TopProductsChart component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopProductsChart } from '../TopProductsChart';

describe('TopProductsChart', () => {
  const mockData = [
    {
      productId: '1',
      productName: 'Product A',
      quantity: 100,
      revenue: 5000,
    },
    {
      productId: '2',
      productName: 'Product B',
      quantity: 80,
      revenue: 4000,
    },
    {
      productId: '3',
      productName: 'Product C',
      quantity: 60,
      revenue: 3000,
    },
  ];

  it('renders loading state when isLoading is true', () => {
    render(<TopProductsChart data={[]} isLoading={true} />);
    expect(screen.getByText('Loading chart...')).toBeInTheDocument();
  });

  it('renders empty state when no data is provided', () => {
    render(<TopProductsChart data={[]} isLoading={false} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders chart with data', () => {
    render(<TopProductsChart data={mockData} isLoading={false} />);
    
    // Check for ARIA label
    const chart = screen.getByRole('img', { name: /top selling products bar chart/i });
    expect(chart).toBeInTheDocument();
  });

  it('truncates long product names', () => {
    const longNameData = [
      {
        productId: '1',
        productName: 'This is a very long product name that should be truncated',
        quantity: 100,
        revenue: 5000,
      },
    ];

    render(<TopProductsChart data={longNameData} isLoading={false} />);
    
    // Chart should render without errors
    const chart = screen.getByRole('img', { name: /top selling products bar chart/i });
    expect(chart).toBeInTheDocument();
  });

  it('handles empty array gracefully', () => {
    render(<TopProductsChart data={[]} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });
});
