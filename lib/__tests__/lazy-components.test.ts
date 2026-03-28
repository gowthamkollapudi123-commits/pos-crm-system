/**
 * Tests for lib/lazy-components.ts
 *
 * Verifies that all lazy-loaded component exports exist and are valid
 * React components (functions or objects with $$typeof) returned by next/dynamic.
 *
 * Requirements: 19.3, 19.4
 */

import { describe, it, expect } from 'vitest';
import {
  LazyReportsPage,
  LazyDashboardCharts,
  LazyDataTable,
  LazyKanbanBoard,
} from '@/lib/lazy-components';

/**
 * next/dynamic returns a React component. In a jsdom/vitest environment the
 * result may be a function (class or arrow) OR a plain object with a React
 * $$typeof symbol. Both are valid renderable components.
 */
function isReactComponent(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'function') return true;
  // next/dynamic can return a forwardRef / memo object
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return (
      typeof obj['$$typeof'] === 'symbol' ||
      typeof obj['render'] === 'function' ||
      typeof obj['type'] === 'function'
    );
  }
  return false;
}

describe('lazy-components', () => {
  it('LazyReportsPage is exported and is a valid React component', () => {
    expect(LazyReportsPage).toBeDefined();
    expect(isReactComponent(LazyReportsPage)).toBe(true);
  });

  it('LazyDashboardCharts is exported and is a valid React component', () => {
    expect(LazyDashboardCharts).toBeDefined();
    expect(isReactComponent(LazyDashboardCharts)).toBe(true);
  });

  it('LazyDataTable is exported and is a valid React component', () => {
    expect(LazyDataTable).toBeDefined();
    expect(isReactComponent(LazyDataTable)).toBe(true);
  });

  it('LazyKanbanBoard is exported and is a valid React component', () => {
    expect(LazyKanbanBoard).toBeDefined();
    expect(isReactComponent(LazyKanbanBoard)).toBe(true);
  });

  it('all lazy exports are distinct', () => {
    const exports = [LazyReportsPage, LazyDashboardCharts, LazyDataTable, LazyKanbanBoard];
    const unique = new Set(exports);
    expect(unique.size).toBe(exports.length);
  });
});
