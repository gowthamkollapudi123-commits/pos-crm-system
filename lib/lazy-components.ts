/**
 * Lazy-loaded component exports using Next.js dynamic imports.
 *
 * Implements route-based code splitting and deferred loading for heavy
 * components (Recharts charts, TanStack Table, Kanban board) so they are
 * only downloaded when the user navigates to the relevant page.
 *
 * Requirements: 19.3, 19.4
 */

import dynamic from 'next/dynamic';
import React from 'react';

// ── Spinner fallback ──────────────────────────────────────────────────────────

const Spinner = () =>
  React.createElement(
    'div',
    { className: 'flex items-center justify-center p-8' },
    React.createElement('div', {
      className:
        'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600',
      role: 'status',
      'aria-label': 'Loading',
    })
  );

// ── Lazy exports ──────────────────────────────────────────────────────────────

/**
 * LazyReportsPage — lazy-loads the reports page component bundle.
 * Defers loading of Recharts and report-specific logic until the user
 * navigates to /reports.
 */
export const LazyReportsPage = dynamic(
  () => import('@/app/reports/page'),
  { loading: Spinner, ssr: false }
);

/**
 * LazyDashboardCharts — lazy-loads Recharts-based chart components used on
 * the dashboard (TopProductsChart, SalesTrendChart, CustomerAcquisitionChart).
 * Recharts is a large dependency; deferring it improves initial load time.
 */
export const LazyDashboardCharts = dynamic(
  () =>
    import('@/components/dashboard').then((mod) => ({
      default: mod.TopProductsChart,
    })),
  { loading: Spinner, ssr: false }
);

/**
 * LazyDataTable — lazy-loads the TanStack Table-based DataTable component.
 * Useful for pages that conditionally render a table (e.g. after data loads).
 */
export const LazyDataTable = dynamic(
  () =>
    import('@/components/ui/data-table').then((mod) => ({
      default: mod.DataTable,
    })),
  { loading: Spinner, ssr: false }
);

/**
 * LazyKanbanBoard — lazy-loads the lead pipeline kanban board page.
 * The kanban board is only needed on the leads pipeline page and carries
 * drag-and-drop logic that should not be part of the initial bundle.
 */
export const LazyKanbanBoard = dynamic(
  () => import('@/app/leads/pipeline/page'),
  { loading: Spinner, ssr: false }
);
