/**
 * MetricCard Component Tests
 * 
 * Unit tests for the MetricCard component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard, MetricCardGrid } from '../MetricCard';

describe('MetricCard', () => {
  describe('Basic Rendering', () => {
    it('should render title and value', () => {
      render(
        <MetricCard
          title="Test Metric"
          value="100"
        />
      );

      expect(screen.getByText('Test Metric')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should render subtitle when provided', () => {
      render(
        <MetricCard
          title="Test Metric"
          value="100"
          subtitle="Additional info"
        />
      );

      expect(screen.getByText('Additional info')).toBeInTheDocument();
    });

    it('should apply custom background and text colors', () => {
      const { container } = render(
        <MetricCard
          title="Test Metric"
          value="100"
          bgColor="bg-blue-50"
          textColor="text-blue-700"
        />
      );

      const card = container.querySelector('.bg-blue-50');
      expect(card).toBeInTheDocument();
      
      const value = container.querySelector('.text-blue-700');
      expect(value).toBeInTheDocument();
    });
  });

  describe('Value Formatting', () => {
    it('should format currency values with INR symbol', () => {
      render(
        <MetricCard
          title="Sales"
          value={1234567.89}
          format="currency"
          currency="INR"
        />
      );

      // Check for rupee symbol and formatted number
      const valueElement = screen.getByText(/₹/);
      expect(valueElement).toBeInTheDocument();
      expect(valueElement.textContent).toContain('12,34,567.89');
    });

    it('should format number values with separators', () => {
      render(
        <MetricCard
          title="Transactions"
          value={1234567}
          format="number"
        />
      );

      expect(screen.getByText('12,34,567')).toBeInTheDocument();
    });

    it('should display text values as-is', () => {
      render(
        <MetricCard
          title="Status"
          value="Active"
          format="text"
        />
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should handle string values', () => {
      render(
        <MetricCard
          title="Status"
          value="Pending"
        />
      );

      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  describe('Alert State', () => {
    it('should show alert badge when alert is true', () => {
      render(
        <MetricCard
          title="Low Stock"
          value={5}
          alert={true}
        />
      );

      expect(screen.getByText('Alert')).toBeInTheDocument();
      expect(screen.getByRole('status', { name: 'Alert' })).toBeInTheDocument();
    });

    it('should apply alert ring styling when alert is true', () => {
      const { container } = render(
        <MetricCard
          title="Low Stock"
          value={5}
          alert={true}
        />
      );

      const card = container.querySelector('.ring-2.ring-orange-400');
      expect(card).toBeInTheDocument();
    });

    it('should not show alert badge when alert is false', () => {
      render(
        <MetricCard
          title="Stock"
          value={100}
          alert={false}
        />
      );

      expect(screen.queryByText('Alert')).not.toBeInTheDocument();
    });
  });

  describe('Trend Indicator', () => {
    it('should show positive trend with up arrow', () => {
      render(
        <MetricCard
          title="Sales"
          value={1000}
          trend={{ value: 15, isPositive: true }}
        />
      );

      expect(screen.getByText('15%')).toBeInTheDocument();
      expect(screen.getByLabelText(/Trend: up 15%/)).toBeInTheDocument();
    });

    it('should show negative trend with down arrow', () => {
      render(
        <MetricCard
          title="Sales"
          value={1000}
          trend={{ value: -10, isPositive: false }}
        />
      );

      expect(screen.getByText('10%')).toBeInTheDocument();
      expect(screen.getByLabelText(/Trend: down 10%/)).toBeInTheDocument();
    });

    it('should not show trend when not provided', () => {
      render(
        <MetricCard
          title="Sales"
          value={1000}
        />
      );

      expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton when isLoading is true', () => {
      const { container } = render(
        <MetricCard
          title="Sales"
          value={1000}
          isLoading={true}
        />
      );

      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
      
      // Should not show actual content
      expect(screen.queryByText('Sales')).not.toBeInTheDocument();
      expect(screen.queryByText('1000')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when error is provided', () => {
      render(
        <MetricCard
          title="Sales"
          value={1000}
          error="Failed to load data"
        />
      );

      expect(screen.getByText('Sales')).toBeInTheDocument();
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      
      // Should not show value
      expect(screen.queryByText('1000')).not.toBeInTheDocument();
    });

    it('should apply error border styling', () => {
      const { container } = render(
        <MetricCard
          title="Sales"
          value={1000}
          error="Error occurred"
        />
      );

      const card = container.querySelector('.border-red-300');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Custom Icon', () => {
    it('should render custom icon when provided', () => {
      const TestIcon = () => <span data-testid="custom-icon">Icon</span>;
      
      render(
        <MetricCard
          title="Sales"
          value={1000}
          icon={<TestIcon />}
        />
      );

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label', () => {
      render(
        <MetricCard
          title="Sales"
          value={1000}
          format="currency"
          currency="INR"
        />
      );

      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label');
    });

    it('should have proper role for alert status', () => {
      render(
        <MetricCard
          title="Low Stock"
          value={5}
          alert={true}
        />
      );

      expect(screen.getByRole('status', { name: 'Alert' })).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should apply hover effect classes', () => {
      const { container } = render(
        <MetricCard
          title="Sales"
          value={1000}
        />
      );

      const card = container.querySelector('.hover\\:shadow-md');
      expect(card).toBeInTheDocument();
    });

    it('should have transition classes for smooth animations', () => {
      const { container } = render(
        <MetricCard
          title="Sales"
          value={1000}
        />
      );

      const card = container.querySelector('.transition-all');
      expect(card).toBeInTheDocument();
    });
  });
});

describe('MetricCardGrid', () => {
  it('should render children in a grid layout', () => {
    const { container } = render(
      <MetricCardGrid>
        <MetricCard title="Metric 1" value={100} />
        <MetricCard title="Metric 2" value={200} />
      </MetricCardGrid>
    );

    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(screen.getByText('Metric 1')).toBeInTheDocument();
    expect(screen.getByText('Metric 2')).toBeInTheDocument();
  });

  it('should have responsive grid classes', () => {
    const { container } = render(
      <MetricCardGrid>
        <MetricCard title="Metric" value={100} />
      </MetricCardGrid>
    );

    const grid = container.querySelector('.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4');
    expect(grid).toBeInTheDocument();
  });
});
