/**
 * Route-based Role Permissions
 *
 * Defines which routes/resources each role can access.
 * Complements the granular permission system in utils/permissions.ts
 * with route-level access control.
 *
 * Requirements: 14.6, 14.7, 14.8, 14.9, 4.5
 */

import { Role } from '@/types/enums';

/**
 * Route prefixes accessible per role.
 * Admin has full access; Manager has broad access; Staff has minimal access.
 */
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.ADMIN]: [
    '/dashboard',
    '/pos',
    '/customers',
    '/leads',
    '/orders',
    '/products',
    '/reports',
    '/settings',
    '/users',
    '/activity-logs',
  ],
  [Role.MANAGER]: [
    '/dashboard',
    '/pos',
    '/customers',
    '/leads',
    '/orders',
    '/products',
    '/reports',
    '/settings',
  ],
  [Role.STAFF]: [
    '/dashboard',
    '/pos',
    '/customers',
  ],
};

/**
 * Check if a role has access to a given resource/feature key.
 * Resource keys map to route prefixes (e.g. 'users' → '/users').
 *
 * @param role - The user's role
 * @param resource - A route prefix or resource name (e.g. '/users', 'reports')
 * @returns true if the role can access the resource
 */
export function hasPermission(role: Role | string, resource: string): boolean {
  const normalizedResource = resource.startsWith('/') ? resource : `/${resource}`;
  const allowed = ROLE_PERMISSIONS[role as Role];
  if (!allowed) return false;
  return allowed.some((r) => normalizedResource === r || normalizedResource.startsWith(`${r}/`));
}

/**
 * Check if a role can access a given pathname.
 *
 * @param role - The user's role
 * @param pathname - The full pathname (e.g. '/users/new')
 * @returns true if the role is allowed to access the pathname
 */
export function canAccessRoute(role: Role | string, pathname: string): boolean {
  return hasPermission(role, pathname);
}
