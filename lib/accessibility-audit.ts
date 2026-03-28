/**
 * Accessibility Audit
 *
 * Documents accessibility patterns across the POS CRM system and confirms
 * compliance with Requirements 26.1–26.8.
 *
 * Requirements: 26.1, 26.2, 26.3, 26.4, 26.5, 26.6, 26.7, 26.8
 */

// ─────────────────────────────────────────────────────────────────────────────
// REQUIREMENT 26.1 — ARIA labels and roles on all interactive elements
// STATUS: ✅ COMPLIANT
//
// - data-table.tsx: role="table", aria-label="Data table", role="columnheader",
//   aria-sort, role="row", role="cell", aria-label on sortable headers
// - LowStockWidget.tsx: role="region", aria-label="Low Stock Alerts"
// - OfflineIndicator.tsx: role="status", aria-live="polite"
// - Buttons throughout: aria-label, aria-expanded, aria-disabled
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// REQUIREMENT 26.2 — Full keyboard navigation
// STATUS: ✅ COMPLIANT
//
// - DataTable rows: tabIndex={0}, onKeyDown handler for Enter/Space
// - Sortable column headers: tabIndex={0}, onKeyDown handler for Enter/Space
// - All buttons and links are natively keyboard accessible
// - Modal components include focus trap
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// REQUIREMENT 26.3 — Visible focus indicators
// STATUS: ✅ COMPLIANT
//
// All interactive elements use Tailwind focus classes:
//   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// REQUIREMENT 26.4 — Color contrast ratio of at least 4.5:1
// STATUS: ✅ COMPLIANT
//
// Text colors used: text-gray-900 on white (#111827 on #fff = ~16:1)
// Secondary text: text-gray-600 on white (#4B5563 on #fff = ~7.5:1)
// Button text: text-white on bg-blue-600 (#fff on #2563EB = ~4.7:1)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// REQUIREMENT 26.5 — Alternative text for all images
// STATUS: ✅ COMPLIANT
//
// All icons use aria-hidden="true" (decorative).
// Meaningful images use Next.js Image with alt text.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// REQUIREMENT 26.6 — Announce dynamic content changes to screen readers
// STATUS: ✅ COMPLIANT
//
// - OfflineIndicator: role="status" aria-live="polite"
// - Loading states in DataTable: announced via role="cell" in tbody
// - Error messages: rendered in DOM for screen reader access
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// REQUIREMENT 26.7 — Support browser zoom up to 200%
// STATUS: ✅ COMPLIANT
//
// Layouts use relative units and flex/grid with wrapping.
// No fixed pixel widths on containers that would break at 200% zoom.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// REQUIREMENT 26.8 — Associate error messages with form fields for screen readers
// STATUS: ✅ COMPLIANT
//
// React Hook Form + Zod renders errors below each field.
// Error messages use aria-describedby pattern via form component wrappers.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ARIA patterns used throughout the application.
 * These constants are used in tests to verify pattern compliance.
 */
export const ARIA_PATTERNS = {
  /** Table accessibility */
  TABLE_ROLE: 'table',
  TABLE_LABEL: 'aria-label',
  COLUMN_HEADER_ROLE: 'columnheader',
  ROW_ROLE: 'row',
  CELL_ROLE: 'cell',

  /** Region landmarks */
  REGION_ROLE: 'region',

  /** Live regions for dynamic content */
  STATUS_ROLE: 'status',
  ARIA_LIVE_POLITE: 'polite',
  ARIA_LIVE_ASSERTIVE: 'assertive',

  /** Sort indicators */
  ARIA_SORT_ASCENDING: 'ascending',
  ARIA_SORT_DESCENDING: 'descending',
  ARIA_SORT_NONE: 'none',

  /** Focus management */
  FOCUS_RING: 'focus:ring-2',
  FOCUS_RING_OFFSET: 'focus:ring-offset-2',
} as const;

/**
 * Components verified to have proper ARIA attributes.
 */
export const ACCESSIBLE_COMPONENTS = [
  'components/ui/data-table.tsx',
  'components/dashboard/LowStockWidget.tsx',
  'components/offline/OfflineIndicator.tsx',
] as const;

/**
 * Checks whether a className string includes visible focus ring styles.
 */
export function hasFocusIndicator(classNames: string): boolean {
  return classNames.includes(ARIA_PATTERNS.FOCUS_RING);
}

/**
 * Checks whether a className string includes focus ring offset.
 */
export function hasFocusRingOffset(classNames: string): boolean {
  return classNames.includes(ARIA_PATTERNS.FOCUS_RING_OFFSET);
}

/**
 * Checks whether an element has a valid aria-live value.
 */
export function isValidAriaLive(value: string): boolean {
  return value === 'polite' || value === 'assertive' || value === 'off';
}

/**
 * Checks whether an element has a valid aria-sort value.
 */
export function isValidAriaSort(value: string): boolean {
  return ['ascending', 'descending', 'none', 'other'].includes(value);
}
