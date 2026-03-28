/**
 * Dashboard Layout
 * 
 * Protected layout that wraps all dashboard routes with authentication.
 */

'use client';

import { ProtectedRoute } from '@/components/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}
