/**
 * AppNavigation Component
 *
 * Sidebar/nav that renders navigation items filtered by the current user's role.
 * Uses PermissionGate to conditionally show each nav item.
 *
 * Requirements: 4.1, 4.4, 4.6, 4.9
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { NAV_ITEMS } from '@/lib/navigation';
import { Role } from '@/types/enums';

export function AppNavigation() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(user.role as Role)
  );

  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1 p-4">
      {visibleItems.map((item) => {
        const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
        return (
          <Link
            key={item.path}
            href={item.path}
            aria-current={isActive ? 'page' : undefined}
            className={[
              'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
            ].join(' ')}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
