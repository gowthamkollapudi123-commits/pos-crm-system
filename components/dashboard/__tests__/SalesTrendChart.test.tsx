/**
 * Unit tests for SalesTrendChart component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SalesTrendChart } from '../SalesTrendChart';

describe('SalesTrendChart', () => {
  const mockData = [
    {
      date: '2024-01-01',
      sales: 10000,
    },
    {
      date: '2024-01-02',
      sales: 15000,
    },
    {
      date: '2024-01-03',
      sales: 12000,
    },
  ];

  it('renders loading state when isLoading is true', () => {
    render(<SalesTrendChart data={[]} isLoading={true} />);
    expect(screen.getByText('Loading chart...')).toBeInTheDocument();
  });

  it('renders empty state when no data is provided', () => {
    render(<SalesTrendChart data={[]} isLoading={false} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders chart with data', () => {
    render(<SalesTrendChart data={mockData} isLoading={false} />);
    
    // Check for ARIA label
    const chart = screen.getByRole('img', { name: /sales trends over time area chart/i });
    expect(chart).toBeInTheDocument();
  });

  it('handles single data point', () => {
    const singleData = [
      {
        date: '2024-01-01',
        sales: 10000,
      },
    ];

    render(<SalesTrendChart data={singleData} isLoading={false} />);
    
    const chart = screen.getByRole('img', { name: /sales trends over time area chart/i });
    expect(chart).toBeInTheDocument();
  });

  it('handles empty array gracefully', () => {
    render(<SalesTrendChart data={[]} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });
});
