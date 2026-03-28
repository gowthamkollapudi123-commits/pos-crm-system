/**
 * RouteGuard Component
 * 
 * Protects routes by enforcing authentication and authorization requirements.
 * Redirects unauthenticated users to login and unauthorized users to access denied page.
 * 
 * Requirements: 4.6, 4.7, 4.8
 */

'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission, hasAnyPermission, type Permission } from '@/utils/permissions';
import { Role } from '@/types/enums';

interface RouteGuardProps {
  children: ReactNode;
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
  /** Redirect path for unauthorized access (default: '/access-denied') */
  unauthorizedRedirect?: string;
}

export function RouteGuard({
  children,
  requireAuth = true,
  requiredPermission,
  requiredPermissions,
  requiredRole,
  requiredRoles,
  fallback,
  unauthorizedRedirect = '/access-denied',
}: RouteGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait for auth state to load
    if (isLoading) {
      return;
    }

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      // Store the intended destination for redirect after login
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/login?returnUrl=${returnUrl}`);
      return;
    }

    // If authenticated, check authorization
    if (isAuthenticated && user) {
      let hasAccess = true;

      // Check single permission
      if (requiredPermission) {
        hasAccess = hasPermission(user, requiredPermission);
      }

      // Check multiple permissions (user needs at least one)
      if (requiredPermissions && requiredPermissions.length > 0) {
        hasAccess = hasAnyPermission(user, requiredPermissions);
      }

      // Check single role
      if (requiredRole) {
        hasAccess = user.role === requiredRole;
      }

      // Check multiple roles (user needs at least one)
      if (requiredRoles && requiredRoles.length > 0) {
        hasAccess = requiredRoles.includes(user.role);
      }

      // Redirect if user doesn't have access
      if (!hasAccess) {
        router.push(unauthorizedRedirect);
        return;
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    requireAuth,
    requiredPermission,
    requiredPermissions,
    requiredRole,
    requiredRoles,
    router,
    pathname,
    unauthorizedRedirect,
  ]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show fallback if provided and user is not authenticated
  if (requireAuth && !isAuthenticated && fallback) {
    return <>{fallback}</>;
  }

  // Check authorization before rendering children
  if (isAuthenticated && user) {
    let hasAccess = true;

    if (requiredPermission) {
      hasAccess = hasPermission(user, requiredPermission);
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      hasAccess = hasAnyPermission(user, requiredPermissions);
    }

    if (requiredRole) {
      hasAccess = user.role === requiredRole;
    }

    if (requiredRoles && requiredRoles.length > 0) {
      hasAccess = requiredRoles.includes(user.role);
    }

    if (!hasAccess && fallback) {
      return <>{fallback}</>;
    }

    if (!hasAccess) {
      return null; // Will redirect via useEffect
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
}
