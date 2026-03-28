/**
 * Dashboard Layout
 * 
 * Protected layout that wraps all dashboard routes with authentication.
 */

'use client';

import { ProtectedRoute } from '@/components/auth';
import { AppNavigation } from '@/components/layout/AppNavigation';
import { useAuth } from '@/hooks/useAuth';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <span className="text-xl font-bold text-blue-600">POS CRM</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <AppNavigation />
          </div>
          {/* Sidebar Footer with User Info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {user?.name?.[0]}
              </div>
              <div className="overflow-hidden text-sm">
                <p className="font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-gray-500 truncate capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar for Mobile/Global Info */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
            <div className="md:hidden">
              <span className="text-xl font-bold text-blue-600">POS CRM</span>
            </div>
            <div className="flex-1"></div>
            <div className="flex items-center space-x-4">
              <OfflineIndicator />
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="py-6 px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
