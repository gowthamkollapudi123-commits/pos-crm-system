/**
 * Permission Utilities Tests
 * 
 * Tests for role-based permission checking functions
 */

import { describe, it, expect } from '@jest/globals';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  isAdmin,
  isManager,
  isStaff,
} from '@/utils/permissions';
import { Role } from '@/types/enums';
import type { User } from '@/types/entities';

// Mock users for testing
const adminUser: User = {
  id: '1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: Role.ADMIN,
  tenantId: 'tenant1',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const managerUser: User = {
  id: '2',
  email: 'manager@example.com',
  name: 'Manager User',
  role: Role.MANAGER,
  tenantId: 'tenant1',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const staffUser: User = {
  id: '3',
  email: 'staff@example.com',
  name: 'Staff User',
  role: Role.STAFF,
  tenantId: 'tenant1',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('hasPermission', () => {
  it('should return true when user has permission', () => {
    expect(hasPermission(adminUser, 'VIEW_USERS')).toBe(true);
    expect(hasPermission(managerUser, 'VIEW_INVENTORY')).toBe(true);
    expect(hasPermission(staffUser, 'ACCESS_POS')).toBe(true);
  });

  it('should return false when user does not have permission', () => {
    expect(hasPermission(staffUser, 'VIEW_USERS')).toBe(false);
    expect(hasPermission(staffUser, 'VIEW_INVENTORY')).toBe(false);
    expect(hasPermission(managerUser, 'EDIT_SETTINGS')).toBe(false);
  });

  it('should return false for null user', () => {
    expect(hasPermission(null, 'VIEW_USERS')).toBe(false);
  });
});

describe('hasAnyPermission', () => {
  it('should return true when user has at least one permission', () => {
    expect(hasAnyPermission(managerUser, ['VIEW_INVENTORY', 'VIEW_USERS'])).toBe(true);
    expect(hasAnyPermission(staffUser, ['ACCESS_POS', 'VIEW_USERS'])).toBe(true);
  });

  it('should return false when user has none of the permissions', () => {
    expect(hasAnyPermission(staffUser, ['VIEW_USERS', 'EDIT_SETTINGS'])).toBe(false);
  });

  it('should return false for null user', () => {
    expect(hasAnyPermission(null, ['VIEW_USERS'])).toBe(false);
  });
});

describe('hasAllPermissions', () => {
  it('should return true when user has all permissions', () => {
    expect(hasAllPermissions(adminUser, ['VIEW_USERS', 'EDIT_SETTINGS'])).toBe(true);
    expect(hasAllPermissions(staffUser, ['ACCESS_POS', 'VIEW_CUSTOMERS'])).toBe(true);
  });

  it('should return false when user is missing at least one permission', () => {
    expect(hasAllPermissions(managerUser, ['VIEW_INVENTORY', 'EDIT_SETTINGS'])).toBe(false);
    expect(hasAllPermissions(staffUser, ['ACCESS_POS', 'VIEW_INVENTORY'])).toBe(false);
  });

  it('should return false for null user', () => {
    expect(hasAllPermissions(null, ['VIEW_USERS'])).toBe(false);
  });
});

describe('hasRole', () => {
  it('should return true when user has the role', () => {
    expect(hasRole(adminUser, Role.ADMIN)).toBe(true);
    expect(hasRole(managerUser, Role.MANAGER)).toBe(true);
    expect(hasRole(staffUser, Role.STAFF)).toBe(true);
  });

  it('should return false when user does not have the role', () => {
    expect(hasRole(adminUser, Role.STAFF)).toBe(false);
    expect(hasRole(managerUser, Role.ADMIN)).toBe(false);
    expect(hasRole(staffUser, Role.ADMIN)).toBe(false);
  });

  it('should return false for null user', () => {
    expect(hasRole(null, Role.ADMIN)).toBe(false);
  });
});

describe('hasAnyRole', () => {
  it('should return true when user has at least one role', () => {
    expect(hasAnyRole(adminUser, [Role.ADMIN, Role.MANAGER])).toBe(true);
    expect(hasAnyRole(managerUser, [Role.ADMIN, Role.MANAGER])).toBe(true);
    expect(hasAnyRole(staffUser, [Role.STAFF, Role.MANAGER])).toBe(true);
  });

  it('should return false when user has none of the roles', () => {
    expect(hasAnyRole(staffUser, [Role.ADMIN, Role.MANAGER])).toBe(false);
  });

  it('should return false for null user', () => {
    expect(hasAnyRole(null, [Role.ADMIN])).toBe(false);
  });
});

describe('isAdmin', () => {
  it('should return true for admin user', () => {
    expect(isAdmin(adminUser)).toBe(true);
  });

  it('should return false for non-admin users', () => {
    expect(isAdmin(managerUser)).toBe(false);
    expect(isAdmin(staffUser)).toBe(false);
  });

  it('should return false for null user', () => {
    expect(isAdmin(null)).toBe(false);
  });
});

describe('isManager', () => {
  it('should return true for manager user', () => {
    expect(isManager(managerUser)).toBe(true);
  });

  it('should return false for non-manager users', () => {
    expect(isManager(adminUser)).toBe(false);
    expect(isManager(staffUser)).toBe(false);
  });

  it('should return false for null user', () => {
    expect(isManager(null)).toBe(false);
  });
});

describe('isStaff', () => {
  it('should return true for staff user', () => {
    expect(isStaff(staffUser)).toBe(true);
  });

  it('should return false for non-staff users', () => {
    expect(isStaff(adminUser)).toBe(false);
    expect(isStaff(managerUser)).toBe(false);
  });

  it('should return false for null user', () => {
    expect(isStaff(null)).toBe(false);
  });
});
