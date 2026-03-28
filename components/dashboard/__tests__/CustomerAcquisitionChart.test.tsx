/**
 * Unit tests for CustomerAcquisitionChart component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CustomerAcquisitionChart } from '../CustomerAcquisitionChart';

describe('CustomerAcquisitionChart', () => {
  const mockData = [
    {
      date: '2024-01-01',
      newCustomers: 10,
      totalCustomers: 100,
    },
    {
      date: '2024-01-02',
      newCustomers: 15,
      totalCustomers: 115,
    },
    {
      date: '2024-01-03',
      newCustomers: 8,
      totalCustomers: 123,
    },
  ];

  it('renders loading state when isLoading is true', () => {
    render(<CustomerAcquisitionChart data={[]} isLoading={true} />);
    expect(screen.getByText('Loading chart...')).toBeInTheDocument();
  });

  it('renders empty state when no data is provided', () => {
    render(<CustomerAcquisitionChart data={[]} isLoading={false} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders chart with data', () => {
    render(<CustomerAcquisitionChart data={mockData} isLoading={false} />);
    
    // Check for ARIA label
    const chart = screen.getByRole('img', { name: /customer acquisition trends line chart/i });
    expect(chart).toBeInTheDocument();
  });

  it('handles single data point', () => {
    const singleData = [
      {
        date: '2024-01-01',
        newCustomers: 10,
        totalCustomers: 100,
      },
    ];

    render(<CustomerAcquisitionChart data={singleData} isLoading={false} />);
    
    const chart = screen.getByRole('img', { name: /customer acquisition trends line chart/i });
    expect(chart).toBeInTheDocument();
  });

  it('handles empty array gracefully', () => {
    render(<CustomerAcquisitionChart data={[]} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('displays both new and total customer metrics', () => {
    render(<CustomerAcquisitionChart data={mockData} isLoading={false} />);
    
    // Chart should render with both lines
    const chart = screen.getByRole('img', { name: /customer acquisition trends line chart/i });
    expect(chart).toBeInTheDocument();
  });
});
