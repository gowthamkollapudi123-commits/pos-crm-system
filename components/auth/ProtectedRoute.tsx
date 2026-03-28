/**
 * ProtectedRoute Component
 * 
 * A simplified wrapper for protecting routes in Next.js App Router.
 * Can be used in layout.tsx files to protect entire route segments.
 * 
 * Requirements: 4.6, 4.7
 */

'use client';

import { ReactNode } from 'react';
import { RouteGuard } from './RouteGuard';
import { type Permission } from '@/utils/permissions';
import { Role } from '@/types/enums';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requiredRole?: Role;
  requiredRoles?: Role[];
}

/**
 * Simplified component for protecting routes in Next.js App Router
 * Use this in layout.tsx files to protect entire route segments
 * 
 * @example
 * // In app/admin/layout.tsx
 * export default function AdminLayout({ children }) {
 *   return (
 *     <ProtectedRoute requiredRole={Role.ADMIN}>
 *       {children}
 *     </ProtectedRoute>
 *   );
 * }
 */
export function ProtectedRoute({
  children,
  requiredPermission,
  requiredPermissions,
  requiredRole,
  requiredRoles,
}: ProtectedRouteProps) {
  return (
    <RouteGuard
      requireAuth={true}
      requiredPermission={requiredPermission}
      requiredPermissions={requiredPermissions}
      requiredRole={requiredRole}
      requiredRoles={requiredRoles}
    >
      {children}
    </RouteGuard>
  );
}
