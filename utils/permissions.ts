/**
 * Permission Utilities
 * 
 * Provides role-based access control utilities for checking user permissions.
 * Implements the permission system defined in requirements 4.6, 4.7, 4.8, 14.9.
 */

import { Role } from '@/types/enums';
import type { User } from '@/types/entities';

/**
 * Permission definitions for different roles
 * Admin: Full system access
 * Manager: Access to reports, inventory, and customer management
 * Staff: Access to POS billing and customer lookup only
 */
export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: [Role.ADMIN, Role.MANAGER, Role.STAFF],
  
  // POS Billing
  ACCESS_POS: [Role.ADMIN, Role.MANAGER, Role.STAFF],
  PROCESS_TRANSACTIONS: [Role.ADMIN, Role.MANAGER, Role.STAFF],
  
  // Customer Management
  VIEW_CUSTOMERS: [Role.ADMIN, Role.MANAGER, Role.STAFF],
  CREATE_CUSTOMER: [Role.ADMIN, Role.MANAGER, Role.STAFF],
  EDIT_CUSTOMER: [Role.ADMIN, Role.MANAGER],
  DELETE_CUSTOMER: [Role.ADMIN, Role.MANAGER],
  
  // Lead Management
  VIEW_LEADS: [Role.ADMIN, Role.MANAGER],
  CREATE_LEAD: [Role.ADMIN, Role.MANAGER],
  EDIT_LEAD: [Role.ADMIN, Role.MANAGER],
  DELETE_LEAD: [Role.ADMIN, Role.MANAGER],
  
  // Orders and Sales
  VIEW_ORDERS: [Role.ADMIN, Role.MANAGER],
  EDIT_ORDER: [Role.ADMIN, Role.MANAGER],
  CANCEL_ORDER: [Role.ADMIN, Role.MANAGER],
  REFUND_ORDER: [Role.ADMIN],
  
  // Inventory Management
  VIEW_INVENTORY: [Role.ADMIN, Role.MANAGER],
  CREATE_PRODUCT: [Role.ADMIN, Role.MANAGER],
  EDIT_PRODUCT: [Role.ADMIN, Role.MANAGER],
  DELETE_PRODUCT: [Role.ADMIN, Role.MANAGER],
  IMPORT_PRODUCTS: [Role.ADMIN, Role.MANAGER],
  
  // Reports
  VIEW_REPORTS: [Role.ADMIN, Role.MANAGER],
  EXPORT_REPORTS: [Role.ADMIN, Role.MANAGER],
  
  // Settings
  VIEW_SETTINGS: [Role.ADMIN],
  EDIT_SETTINGS: [Role.ADMIN],
  
  // User Management
  VIEW_USERS: [Role.ADMIN],
  CREATE_USER: [Role.ADMIN],
  EDIT_USER: [Role.ADMIN],
  DELETE_USER: [Role.ADMIN],
  MANAGE_ROLES: [Role.ADMIN],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a user has a specific permission
 * @param user - The user to check permissions for
 * @param permission - The permission to check
 * @returns true if the user has the permission, false otherwise
 */
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) {
    return false;
  }

  const allowedRoles = PERMISSIONS[permission];
  return (allowedRoles as readonly Role[]).includes(user.role);
}

/**
 * Check if a user has any of the specified permissions
 * @param user - The user to check permissions for
 * @param permissions - Array of permissions to check
 * @returns true if the user has at least one of the permissions, false otherwise
 */
export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
  if (!user) {
    return false;
  }

  return permissions.some((permission) => hasPermission(user, permission));
}

/**
 * Check if a user has all of the specified permissions
 * @param user - The user to check permissions for
 * @param permissions - Array of permissions to check
 * @returns true if the user has all of the permissions, false otherwise
 */
export function hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
  if (!user) {
    return false;
  }

  return permissions.every((permission) => hasPermission(user, permission));
}

/**
 * Check if a user has a specific role
 * @param user - The user to check
 * @param role - The role to check for
 * @returns true if the user has the role, false otherwise
 */
export function hasRole(user: User | null, role: Role): boolean {
  if (!user) {
    return false;
  }

  return user.role === role;
}

/**
 * Check if a user has any of the specified roles
 * @param user - The user to check
 * @param roles - Array of roles to check
 * @returns true if the user has at least one of the roles, false otherwise
 */
export function hasAnyRole(user: User | null, roles: Role[]): boolean {
  if (!user) {
    return false;
  }

  return roles.includes(user.role);
}

/**
 * Check if a user is an admin
 * @param user - The user to check
 * @returns true if the user is an admin, false otherwise
 */
export function isAdmin(user: User | null): boolean {
  return hasRole(user, Role.ADMIN);
}

/**
 * Check if a user is a manager
 * @param user - The user to check
 * @returns true if the user is a manager, false otherwise
 */
export function isManager(user: User | null): boolean {
  return hasRole(user, Role.MANAGER);
}

/**
 * Check if a user is staff
 * @param user - The user to check
 * @returns true if the user is staff, false otherwise
 */
export function isStaff(user: User | null): boolean {
  return hasRole(user, Role.STAFF);
}
