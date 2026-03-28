/**
 * Central Navigation Configuration
 *
 * Maps routes to their required roles and labels.
 * Used by AppNavigation to render role-filtered nav items.
 *
 * Requirements: 4.1, 4.4, 4.6, 4.9
 */

import { Role } from '@/types/enums';

export interface NavItem {
  path: string;
  label: string;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', roles: [Role.ADMIN, Role.MANAGER, Role.STAFF] },
  { path: '/pos', label: 'POS Billing', roles: [Role.ADMIN, Role.MANAGER, Role.STAFF] },
  { path: '/customers', label: 'Customers', roles: [Role.ADMIN, Role.MANAGER, Role.STAFF] },
  { path: '/leads', label: 'Leads', roles: [Role.ADMIN, Role.MANAGER] },
  { path: '/orders', label: 'Orders', roles: [Role.ADMIN, Role.MANAGER] },
  { path: '/products', label: 'Products', roles: [Role.ADMIN, Role.MANAGER] },
  { path: '/reports', label: 'Reports', roles: [Role.ADMIN, Role.MANAGER] },
  { path: '/settings', label: 'Settings', roles: [Role.ADMIN, Role.MANAGER] },
  { path: '/users', label: 'Users', roles: [Role.ADMIN] },
  { path: '/activity-logs', label: 'Activity Logs', roles: [Role.ADMIN] },
];

/**
 * Filter nav items by user role.
 * Returns only items the given role is allowed to see.
 */
export function getNavItemsForRole(role: Role | string): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role as Role));
}

/**
 * Check whether a given path is accessible by a role.
 */
export function isNavItemAccessible(path: string, role: Role | string): boolean {
  const item = NAV_ITEMS.find((n) => n.path === path);
  if (!item) return false;
  return item.roles.includes(role as Role);
}
