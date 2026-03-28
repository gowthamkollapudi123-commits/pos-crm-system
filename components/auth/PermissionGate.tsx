/**
 * PermissionGate Component
 * 
 * Conditionally renders children based on user permissions.
 * Used for showing/hiding UI elements based on role-based access control.
 * 
 * Requirements: 4.8, 14.9
 */

'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission, hasAnyPermission, hasAllPermissions, type Permission } from '@/utils/permissions';
import { Role } from '@/types/enums';

interface PermissionGateProps {
  children: ReactNode;
  /** Required permission for rendering */
  requiredPermission?: Permission;
  /** Required permissions (user must have at least one) */
  requiredPermissions?: Permission[];
  /** Required permissions (user must have all) */
  requiredAllPermissions?: Permission[];
  /** Required role for rendering */
  requiredRole?: Role;
  /** Required roles (user must have at least one) */
  requiredRoles?: Role[];
  /** Fallback content to render when permission check fails */
  fallback?: ReactNode;
  /** Invert the permission check (render when user does NOT have permission) */
  invert?: boolean;
}

/**
 * Component that conditionally renders children based on user permissions
 * 
 * @example
 * // Show button only to admins
 * <PermissionGate requiredRole={Role.ADMIN}>
 *   <button>Delete User</button>
 * </PermissionGate>
 * 
 * @example
 * // Show content to users with specific permission
 * <PermissionGate requiredPermission="VIEW_REPORTS">
 *   <ReportsSection />
 * </PermissionGate>
 * 
 * @example
 * // Show content to users with any of the specified permissions
 * <PermissionGate requiredPermissions={['EDIT_CUSTOMER', 'DELETE_CUSTOMER']}>
 *   <CustomerActions />
 * </PermissionGate>
 * 
 * @example
 * // Show fallback content when permission check fails
 * <PermissionGate 
 *   requiredPermission="VIEW_REPORTS"
 *   fallback={<p>You don't have access to reports</p>}
 * >
 *   <ReportsSection />
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  requiredPermission,
  requiredPermissions,
  requiredAllPermissions,
  requiredRole,
  requiredRoles,
  fallback = null,
  invert = false,
}: PermissionGateProps) {
  const { user, isAuthenticated } = useAuth();

  // If not authenticated, don't render anything (unless inverted)
  if (!isAuthenticated || !user) {
    return invert ? <>{children}</> : <>{fallback}</>;
  }

  let hasAccess = true;

  // Check single permission
  if (requiredPermission) {
    hasAccess = hasPermission(user, requiredPermission);
  }

  // Check multiple permissions (user needs at least one)
  if (requiredPermissions && requiredPermissions.length > 0) {
    hasAccess = hasAnyPermission(user, requiredPermissions);
  }

  // Check multiple permissions (user needs all)
  if (requiredAllPermissions && requiredAllPermissions.length > 0) {
    hasAccess = hasAllPermissions(user, requiredAllPermissions);
  }

  // Check single role
  if (requiredRole) {
    hasAccess = user.role === requiredRole;
  }

  // Check multiple roles (user needs at least one)
  if (requiredRoles && requiredRoles.length > 0) {
    hasAccess = requiredRoles.includes(user.role);
  }

  // Invert the check if requested
  if (invert) {
    hasAccess = !hasAccess;
  }

  // Render children or fallback based on access
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
