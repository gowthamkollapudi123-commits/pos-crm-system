/**
 * MetricCard Component
 * 
 * Reusable card component for displaying dashboard metrics with optional trends.
 * Supports currency formatting, number formatting, and visual indicators.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, AlertCircleIcon } from 'lucide-react';

export interface MetricCardProps {
  /** Title of the metric */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Optional subtitle or additional context */
  subtitle?: string;
  /** Optional trend indicator (positive/negative percentage) */
  trend?: {
    value: number;
    isPositive: boolean;
  };
  /** Format type for the value */
  format?: 'currency' | 'number' | 'text';
  /** Currency code for currency formatting (default: INR) */
  currency?: string;
  /** Show alert styling */
  alert?: boolean;
  /** Custom icon component */
  icon?: React.ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: string;
  /** Custom background color class */
  bgColor?: string;
  /** Custom text color class */
  textColor?: string;
}

/**
 * Format number with proper separators
 */
function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

/**
 * Format currency with rupee symbol
 */
function formatCurrency(value: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format value based on format type
 */
function formatValue(
  value: string | number,
  format?: 'currency' | 'number' | 'text',
  currency?: string
): string {
  if (typeof value === 'string') {
    return value;
  }

  switch (format) {
    case 'currency':
      return formatCurrency(value, currency);
    case 'number':
      return formatNumber(value);
    case 'text':
    default:
      return String(value);
  }
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  format = 'text',
  currency = 'INR',
  alert = false,
  icon,
  isLoading = false,
  error,
  bgColor = 'bg-white',
  textColor = 'text-gray-900',
}: MetricCardProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={`${bgColor} rounded-lg shadow p-6 animate-pulse`}>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${bgColor} rounded-lg shadow p-6 border-2 border-red-300`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <AlertCircleIcon className="h-5 w-5 text-red-500" />
        </div>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const formattedValue = formatValue(value, format, currency);

  return (
    <div
      className={`${bgColor} rounded-lg shadow p-6 transition-all hover:shadow-md ${
        alert ? 'ring-2 ring-orange-400' : ''
      }`}
      role="article"
      aria-label={`${title}: ${formattedValue}`}
    >
      {/* Header with title and optional alert badge */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className="flex items-center space-x-2">
          {icon && <div className="text-gray-400">{icon}</div>}
          {alert && (
            <span
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
              role="status"
              aria-label="Alert"
            >
              <AlertCircleIcon className="h-3 w-3 mr-1" />
              Alert
            </span>
          )}
        </div>
      </div>

      {/* Main value */}
      <div className="flex items-baseline justify-between">
        <p className={`text-3xl font-bold ${textColor} break-words`}>
          {formattedValue}
        </p>

        {/* Trend indicator */}
        {trend && (
          <div
            className={`flex items-center text-sm font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
            aria-label={`Trend: ${trend.isPositive ? 'up' : 'down'} ${Math.abs(
              trend.value
            )}%`}
          >
            {trend.isPositive ? (
              <ArrowUpIcon className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 mr-1" />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="mt-2 text-xs text-gray-500 leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}

/**
 * Metric Card Grid Container
 * Responsive grid layout for metric cards
 */
export function MetricCardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {children}
    </div>
  );
}
