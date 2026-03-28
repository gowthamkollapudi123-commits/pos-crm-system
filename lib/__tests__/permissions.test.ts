/**
 * Tests for lib/permissions.ts
 *
 * Validates ROLE_PERMISSIONS map, hasPermission, and canAccessRoute.
 * Requirements: 14.6, 14.7, 14.8, 14.9, 4.5
 */

import { describe, it, expect } from 'vitest';
import { ROLE_PERMISSIONS, hasPermission, canAccessRoute } from '@/lib/permissions';
import { Role } from '@/types/enums';

// ── ROLE_PERMISSIONS shape ────────────────────────────────────────────────────

describe('ROLE_PERMISSIONS', () => {
  it('defines permissions for all three roles', () => {
    expect(ROLE_PERMISSIONS[Role.ADMIN]).toBeDefined();
    expect(ROLE_PERMISSIONS[Role.MANAGER]).toBeDefined();
    expect(ROLE_PERMISSIONS[Role.STAFF]).toBeDefined();
  });

  it('Admin has full access including /users and /settings', () => {
    expect(ROLE_PERMISSIONS[Role.ADMIN]).toContain('/users');
    expect(ROLE_PERMISSIONS[Role.ADMIN]).toContain('/settings');
    expect(ROLE_PERMISSIONS[Role.ADMIN]).toContain('/reports');
    expect(ROLE_PERMISSIONS[Role.ADMIN]).toContain('/products');
  });

  it('Manager has access to reports, inventory, and customers but NOT /users', () => {
    expect(ROLE_PERMISSIONS[Role.MANAGER]).toContain('/reports');
    expect(ROLE_PERMISSIONS[Role.MANAGER]).toContain('/products');
    expect(ROLE_PERMISSIONS[Role.MANAGER]).toContain('/customers');
    expect(ROLE_PERMISSIONS[Role.MANAGER]).not.toContain('/users');
  });

  it('Staff has access to POS and customers only (no reports, inventory, users)', () => {
    expect(ROLE_PERMISSIONS[Role.STAFF]).toContain('/pos');
    expect(ROLE_PERMISSIONS[Role.STAFF]).toContain('/customers');
    expect(ROLE_PERMISSIONS[Role.STAFF]).not.toContain('/reports');
    expect(ROLE_PERMISSIONS[Role.STAFF]).not.toContain('/products');
    expect(ROLE_PERMISSIONS[Role.STAFF]).not.toContain('/users');
    expect(ROLE_PERMISSIONS[Role.STAFF]).not.toContain('/settings');
  });
});

// ── hasPermission ─────────────────────────────────────────────────────────────

describe('hasPermission', () => {
  describe('Admin role', () => {
    it('can access all routes', () => {
      expect(hasPermission(Role.ADMIN, '/users')).toBe(true);
      expect(hasPermission(Role.ADMIN, '/settings')).toBe(true);
      expect(hasPermission(Role.ADMIN, '/reports')).toBe(true);
      expect(hasPermission(Role.ADMIN, '/products')).toBe(true);
      expect(hasPermission(Role.ADMIN, '/customers')).toBe(true);
      expect(hasPermission(Role.ADMIN, '/pos')).toBe(true);
      expect(hasPermission(Role.ADMIN, '/dashboard')).toBe(true);
    });

    it('can access sub-routes', () => {
      expect(hasPermission(Role.ADMIN, '/users/new')).toBe(true);
      expect(hasPermission(Role.ADMIN, '/products/123/edit')).toBe(true);
    });
  });

  describe('Manager role', () => {
    it('can access reports, inventory, customers, orders, leads', () => {
      expect(hasPermission(Role.MANAGER, '/reports')).toBe(true);
      expect(hasPermission(Role.MANAGER, '/products')).toBe(true);
      expect(hasPermission(Role.MANAGER, '/customers')).toBe(true);
      expect(hasPermission(Role.MANAGER, '/orders')).toBe(true);
      expect(hasPermission(Role.MANAGER, '/leads')).toBe(true);
    });

    it('cannot access /users', () => {
      expect(hasPermission(Role.MANAGER, '/users')).toBe(false);
      expect(hasPermission(Role.MANAGER, '/users/new')).toBe(false);
    });
  });

  describe('Staff role', () => {
    it('can access /pos, /customers, /dashboard', () => {
      expect(hasPermission(Role.STAFF, '/pos')).toBe(true);
      expect(hasPermission(Role.STAFF, '/customers')).toBe(true);
      expect(hasPermission(Role.STAFF, '/dashboard')).toBe(true);
    });

    it('cannot access restricted routes', () => {
      expect(hasPermission(Role.STAFF, '/users')).toBe(false);
      expect(hasPermission(Role.STAFF, '/reports')).toBe(false);
      expect(hasPermission(Role.STAFF, '/products')).toBe(false);
      expect(hasPermission(Role.STAFF, '/settings')).toBe(false);
      expect(hasPermission(Role.STAFF, '/orders')).toBe(false);
      expect(hasPermission(Role.STAFF, '/leads')).toBe(false);
    });
  });

  it('accepts resource without leading slash', () => {
    expect(hasPermission(Role.ADMIN, 'users')).toBe(true);
    expect(hasPermission(Role.STAFF, 'reports')).toBe(false);
  });

  it('returns false for unknown role', () => {
    expect(hasPermission('unknown_role', '/dashboard')).toBe(false);
  });
});

// ── canAccessRoute ────────────────────────────────────────────────────────────

describe('canAccessRoute', () => {
  it('Admin can access any route', () => {
    expect(canAccessRoute(Role.ADMIN, '/users/123/edit')).toBe(true);
    expect(canAccessRoute(Role.ADMIN, '/settings')).toBe(true);
  });

  it('Manager cannot access /users routes', () => {
    expect(canAccessRoute(Role.MANAGER, '/users')).toBe(false);
    expect(canAccessRoute(Role.MANAGER, '/users/new')).toBe(false);
  });

  it('Staff can only access allowed routes', () => {
    expect(canAccessRoute(Role.STAFF, '/pos')).toBe(true);
    expect(canAccessRoute(Role.STAFF, '/customers/lookup')).toBe(true);
    expect(canAccessRoute(Role.STAFF, '/reports')).toBe(false);
  });
});
