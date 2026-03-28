/**
 * withAuth Higher-Order Component
 * 
 * HOC for component-level authorization. Wraps components to enforce
 * authentication and permission requirements.
 * 
 * Requirements: 4.6, 4.7, 4.8, 14.9
 */

'use client';

import { ComponentType, ReactNode } from 'react';
import { RouteGuard } from './RouteGuard';
import { type Permission } from '@/utils/permissions';
import { Role } from '@/types/enums';

interface WithAuthOptions {
  /** Require authentication (default: true) */
  requireAuth?: boolean;
  /** Required permission for access */
  requiredPermission?: Permission;
  /** Required permissions (user must have at least one) */
  requiredPermissions?: Permission[];
  /** Required role for access */
  requiredRole?: Role;
  /** Required roles (user must have at least one) */
  requiredRoles?: Role[];
  /** Custom fallback component for unauthorized access */
  fallback?: ReactNode;
  /** Redirect path for unauthorized access */
  unauthorizedRedirect?: string;
}

/**
 * Higher-Order Component that wraps a component with authentication and authorization checks
 * 
 * @example
 * // Require authentication only
 * export default withAuth(MyComponent);
 * 
 * @example
 * // Require specific permission
 * export default withAuth(MyComponent, {
 *   requiredPermission: 'VIEW_REPORTS'
 * });
 * 
 * @example
 * // Require specific role
 * export default withAuth(MyComponent, {
 *   requiredRole: Role.ADMIN
 * });
 * 
 * @example
 * // Require one of multiple permissions
 * export default withAuth(MyComponent, {
 *   requiredPermissions: ['VIEW_CUSTOMERS', 'EDIT_CUSTOMER']
 * });
 */
export function withAuth<P extends object>(
  Component: ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const WrappedComponent = (props: P) => {
    return (
      <RouteGuard
        requireAuth={options.requireAuth}
        requiredPermission={options.requiredPermission}
        requiredPermissions={options.requiredPermissions}
        requiredRole={options.requiredRole}
        requiredRoles={options.requiredRoles}
        fallback={options.fallback}
        unauthorizedRedirect={options.unauthorizedRedirect}
      >
        <Component {...props} />
      </RouteGuard>
    );
  };

  // Set display name for debugging
  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

/**
 * HOC that requires admin role
 */
export function withAdminAuth<P extends object>(Component: ComponentType<P>) {
  return withAuth(Component, {
    requiredRole: Role.ADMIN,
  });
}

/**
 * HOC that requires manager or admin role
 */
export function withManagerAuth<P extends object>(Component: ComponentType<P>) {
  return withAuth(Component, {
    requiredRoles: [Role.ADMIN, Role.MANAGER],
  });
}

/**
 * HOC that requires staff, manager, or admin role (any authenticated user)
 */
export function withStaffAuth<P extends object>(Component: ComponentType<P>) {
  return withAuth(Component, {
    requiredRoles: [Role.ADMIN, Role.MANAGER, Role.STAFF],
  });
}
