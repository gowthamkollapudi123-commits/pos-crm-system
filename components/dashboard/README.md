# Dashboard Components

This directory contains reusable components for the dashboard module.

## MetricCard Component

A reusable card component for displaying dashboard metrics with optional trends, alerts, and visual indicators.

### Features

- **Multiple Format Types**: Supports currency, number, and text formatting
- **Currency Formatting**: Displays values with ₹ (INR) symbol and proper number separators (e.g., ₹12,34,567.89)
- **Number Formatting**: Formats large numbers with Indian numbering system separators (e.g., 12,34,567)
- **Trend Indicators**: Shows up/down arrows with percentage changes
- **Alert States**: Visual indicators for items requiring attention
- **Loading States**: Animated skeleton loaders
- **Error States**: Graceful error display with appropriate styling
- **Responsive Design**: Mobile-first responsive layout
- **Accessibility**: Proper ARIA labels and keyboard navigation support
- **Custom Icons**: Support for custom icon components

### Usage

```tsx
import { MetricCard, MetricCardGrid } from '@/components/dashboard';
import { DollarSignIcon } from 'lucide-react';

// Basic usage
<MetricCard
  title="Total Sales"
  value={123456.78}
  format="currency"
  currency="INR"
/>

// With subtitle
<MetricCard
  title="Transactions Today"
  value={150}
  format="number"
  subtitle="Week: 1,234 | Month: 5,678"
/>

// With trend indicator
<MetricCard
  title="Revenue"
  value={50000}
  format="currency"
  trend={{ value: 15, isPositive: true }}
/>

// With alert
<MetricCard
  title="Low Stock Items"
  value={5}
  format="number"
  alert={true}
  subtitle="Items below threshold"
/>

// With custom icon and colors
<MetricCard
  title="Sales Today"
  value={25000}
  format="currency"
  icon={<DollarSignIcon className="h-5 w-5" />}
  bgColor="bg-blue-50"
  textColor="text-blue-700"
/>

// Loading state
<MetricCard
  title="Loading..."
  value={0}
  isLoading={true}
/>

// Error state
<MetricCard
  title="Sales"
  value={0}
  error="Failed to load data"
/>

// Grid layout
<MetricCardGrid>
  <MetricCard title="Metric 1" value={100} />
  <MetricCard title="Metric 2" value={200} />
  <MetricCard title="Metric 3" value={300} />
  <MetricCard title="Metric 4" value={400} />
</MetricCardGrid>
```

### Props

#### MetricCard

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Title of the metric |
| `value` | `string \| number` | required | Main value to display |
| `subtitle` | `string` | optional | Additional context or breakdown |
| `trend` | `{ value: number, isPositive: boolean }` | optional | Trend indicator with percentage |
| `format` | `'currency' \| 'number' \| 'text'` | `'text'` | Format type for the value |
| `currency` | `string` | `'INR'` | Currency code for currency formatting |
| `alert` | `boolean` | `false` | Show alert styling and badge |
| `icon` | `React.ReactNode` | optional | Custom icon component |
| `isLoading` | `boolean` | `false` | Show loading skeleton |
| `error` | `string` | optional | Error message to display |
| `bgColor` | `string` | `'bg-white'` | Background color class |
| `textColor` | `string` | `'text-gray-900'` | Text color class for value |

#### MetricCardGrid

A responsive grid container for metric cards.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | MetricCard components to display in grid |

### Responsive Behavior

The `MetricCardGrid` component uses a responsive grid layout:
- **Mobile** (< 640px): 1 column
- **Tablet** (≥ 640px): 2 columns
- **Desktop** (≥ 1024px): 4 columns

### Accessibility

- All cards have proper `role="article"` and `aria-label` attributes
- Alert badges use `role="status"` for screen reader announcements
- Trend indicators include descriptive aria-labels
- Keyboard navigation is fully supported
- Color contrast ratios meet WCAG 2.1 AA standards

### Testing

Unit tests are located in `__tests__/MetricCard.test.tsx` and cover:
- Basic rendering
- Value formatting (currency, number, text)
- Alert states
- Trend indicators
- Loading states
- Error states
- Custom icons
- Accessibility features
- Responsive design

Run tests with:
```bash
npm test -- components/dashboard/__tests__/MetricCard.test.tsx
```

### Requirements Satisfied

- **6.1**: Display total sales for day, week, and month
- **6.2**: Display transaction counts for day, week, and month
- **6.3**: Display current inventory value
- **6.4**: Display low stock alerts with visual indicators
