/**
 * Tests for lib/navigation.ts
 *
 * Validates NAV_ITEMS structure, getNavItemsForRole, and isNavItemAccessible.
 * Requirements: 4.1, 4.4, 4.6, 4.9
 */

import { describe, it, expect } from 'vitest';
import { NAV_ITEMS, getNavItemsForRole, isNavItemAccessible } from '@/lib/navigation';
import { Role } from '@/types/enums';

// ── NAV_ITEMS shape ───────────────────────────────────────────────────────────

describe('NAV_ITEMS', () => {
  it('contains all expected routes', () => {
    const paths = NAV_ITEMS.map((n) => n.path);
    expect(paths).toContain('/dashboard');
    expect(paths).toContain('/pos');
    expect(paths).toContain('/customers');
    expect(paths).toContain('/leads');
    expect(paths).toContain('/orders');
    expect(paths).toContain('/products');
    expect(paths).toContain('/reports');
    expect(paths).toContain('/settings');
    expect(paths).toContain('/users');
    expect(paths).toContain('/activity-logs');
  });

  it('every item has a non-empty label', () => {
    NAV_ITEMS.forEach((item) => {
      expect(item.label.length).toBeGreaterThan(0);
    });
  });

  it('every item has at least one role', () => {
    NAV_ITEMS.forEach((item) => {
      expect(item.roles.length).toBeGreaterThan(0);
    });
  });

  it('/users and /activity-logs are admin-only', () => {
    const adminOnly = NAV_ITEMS.filter(
      (n) => n.path === '/users' || n.path === '/activity-logs'
    );
    adminOnly.forEach((item) => {
      expect(item.roles).toEqual([Role.ADMIN]);
    });
  });

  it('/dashboard, /pos, /customers are accessible to all roles', () => {
    const allRoles = [Role.ADMIN, Role.MANAGER, Role.STAFF];
    ['/dashboard', '/pos', '/customers'].forEach((path) => {
      const item = NAV_ITEMS.find((n) => n.path === path)!;
      allRoles.forEach((role) => {
        expect(item.roles).toContain(role);
      });
    });
  });
});

// ── getNavItemsForRole ────────────────────────────────────────────────────────

describe('getNavItemsForRole', () => {
  it('Admin sees all nav items', () => {
    const items = getNavItemsForRole(Role.ADMIN);
    expect(items.length).toBe(NAV_ITEMS.length);
  });

  it('Manager does not see /users or /activity-logs', () => {
    const items = getNavItemsForRole(Role.MANAGER);
    const paths = items.map((i) => i.path);
    expect(paths).not.toContain('/users');
    expect(paths).not.toContain('/activity-logs');
  });

  it('Manager sees /leads, /orders, /products, /reports, /settings', () => {
    const items = getNavItemsForRole(Role.MANAGER);
    const paths = items.map((i) => i.path);
    ['/leads', '/orders', '/products', '/reports', '/settings'].forEach((p) => {
      expect(paths).toContain(p);
    });
  });

  it('Staff sees only /dashboard, /pos, /customers', () => {
    const items = getNavItemsForRole(Role.STAFF);
    const paths = items.map((i) => i.path);
    expect(paths).toContain('/dashboard');
    expect(paths).toContain('/pos');
    expect(paths).toContain('/customers');
    expect(paths).not.toContain('/leads');
    expect(paths).not.toContain('/orders');
    expect(paths).not.toContain('/products');
    expect(paths).not.toContain('/reports');
    expect(paths).not.toContain('/settings');
    expect(paths).not.toContain('/users');
    expect(paths).not.toContain('/activity-logs');
  });

  it('returns empty array for unknown role', () => {
    const items = getNavItemsForRole('unknown' as Role);
    expect(items).toHaveLength(0);
  });
});

// ── isNavItemAccessible ───────────────────────────────────────────────────────

describe('isNavItemAccessible', () => {
  it('Admin can access all paths', () => {
    NAV_ITEMS.forEach((item) => {
      expect(isNavItemAccessible(item.path, Role.ADMIN)).toBe(true);
    });
  });

  it('Manager cannot access /users', () => {
    expect(isNavItemAccessible('/users', Role.MANAGER)).toBe(false);
  });

  it('Manager cannot access /activity-logs', () => {
    expect(isNavItemAccessible('/activity-logs', Role.MANAGER)).toBe(false);
  });

  it('Staff cannot access /leads', () => {
    expect(isNavItemAccessible('/leads', Role.STAFF)).toBe(false);
  });

  it('Staff can access /pos', () => {
    expect(isNavItemAccessible('/pos', Role.STAFF)).toBe(true);
  });

  it('returns false for unknown path', () => {
    expect(isNavItemAccessible('/unknown', Role.ADMIN)).toBe(false);
  });
});
