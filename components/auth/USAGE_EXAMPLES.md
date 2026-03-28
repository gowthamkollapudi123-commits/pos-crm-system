# Route Guards and Permission Checks - Usage Examples

This document provides comprehensive examples of how to use the route guards and permission checking system in the POS CRM application.

## Table of Contents

1. [Protecting Routes](#protecting-routes)
2. [Conditional UI Rendering](#conditional-ui-rendering)
3. [Using HOCs](#using-hocs)
4. [Permission Checks in Code](#permission-checks-in-code)
5. [Common Patterns](#common-patterns)

## Protecting Routes

### Example 1: Protect a Single Page

```tsx
// app/reports/page.tsx
'use client';

import { ProtectedRoute } from '@/components/auth';

export default function ReportsPage() {
  return (
    <ProtectedRoute requiredPermission="VIEW_REPORTS">
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Reports</h1>
        {/* Report content */}
      </div>
    </ProtectedRoute>
  );
}
```

### Example 2: Protect an Entire Route Segment

```tsx
// app/admin/layout.tsx
'use client';

import { ProtectedRoute } from '@/components/auth';
import { Role } from '@/types/enums';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole={Role.ADMIN}>
      <div className="admin-layout">
        <aside className="sidebar">
          {/* Admin sidebar */}
        </aside>
        <main className="content">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
```

### Example 3: Multiple Role Requirements

```tsx
// app/inventory/page.tsx
'use client';

import { ProtectedRoute } from '@/components/auth';
import { Role } from '@/types/enums';

export default function InventoryPage() {
  return (
    <ProtectedRoute requiredRoles={[Role.ADMIN, Role.MANAGER]}>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Inventory Management</h1>
        {/* Inventory content */}
      </div>
    </ProtectedRoute>
  );
}
```

## Conditional UI Rendering

### Example 4: Show/Hide Buttons Based on Permissions

```tsx
// components/CustomerActions.tsx
'use client';

import { PermissionGate } from '@/components/auth';

interface CustomerActionsProps {
  customerId: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function CustomerActions({ customerId, onEdit, onDelete }: CustomerActionsProps) {
  return (
    <div className="flex gap-2">
      {/* All authenticated users can view */}
      <button className="btn btn-primary">View Details</button>

      {/* Only managers and admins can edit */}
      <PermissionGate requiredPermission="EDIT_CUSTOMER">
        <button onClick={onEdit} className="btn btn-secondary">
          Edit
        </button>
      </PermissionGate>

      {/* Only managers and admins can delete */}
      <PermissionGate requiredPermission="DELETE_CUSTOMER">
        <button onClick={onDelete} className="btn btn-danger">
          Delete
        </button>
      </PermissionGate>
    </div>
  );
}
```

### Example 5: Role-Based Navigation Menu

```tsx
// components/Navigation.tsx
'use client';

import Link from 'next/link';
import { PermissionGate } from '@/components/auth';
import { Role } from '@/types/enums';

export function Navigation() {
  return (
    <nav className="bg-white shadow">
      <ul className="flex space-x-4 p-4">
        {/* Available to all authenticated users */}
        <li>
          <Link href="/dashboard">Dashboard</Link>
        </li>
        <li>
          <Link href="/pos">POS</Link>
        </li>

        {/* Available to managers and admins */}
        <PermissionGate requiredPermission="VIEW_INVENTORY">
          <li>
            <Link href="/inventory">Inventory</Link>
          </li>
        </PermissionGate>

        <PermissionGate requiredPermission="VIEW_REPORTS">
          <li>
            <Link href="/reports">Reports</Link>
          </li>
        </PermissionGate>

        {/* Available to admins only */}
        <PermissionGate requiredRole={Role.ADMIN}>
          <li>
            <Link href="/settings">Settings</Link>
          </li>
          <li>
            <Link href="/users">Users</Link>
          </li>
        </PermissionGate>
      </ul>
    </nav>
  );
}
```

### Example 6: Conditional Content with Fallback

```tsx
// components/ReportsSection.tsx
'use client';

import { PermissionGate } from '@/components/auth';

export function ReportsSection() {
  return (
    <PermissionGate
      requiredPermission="VIEW_REPORTS"
      fallback={
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p className="text-yellow-800">
            You don't have permission to view reports. Contact your administrator for access.
          </p>
        </div>
      }
    >
      <div className="reports-content">
        <h2>Sales Reports</h2>
        {/* Report charts and data */}
      </div>
    </PermissionGate>
  );
}
```

### Example 7: Inverted Permission Check

```tsx
// components/UpgradePrompt.tsx
'use client';

import { PermissionGate } from '@/components/auth';
import { Role } from '@/types/enums';

export function UpgradePrompt() {
  return (
    <PermissionGate requiredRole={Role.ADMIN} invert>
      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
        <p className="text-blue-800">
          Upgrade to Admin role to access advanced features like user management and system settings.
        </p>
      </div>
    </PermissionGate>
  );
}
```

## Using HOCs

### Example 8: Protect a Component with HOC

```tsx
// components/AdminPanel.tsx
import { withAdminAuth } from '@/components/auth';

function AdminPanel() {
  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <h2>User Management</h2>
          {/* User management content */}
        </div>
        <div className="card">
          <h2>System Settings</h2>
          {/* Settings content */}
        </div>
      </div>
    </div>
  );
}

// Export with admin authentication required
export default withAdminAuth(AdminPanel);
```

### Example 9: HOC with Custom Options

```tsx
// components/ReportsPanel.tsx
import { withAuth } from '@/components/auth';

function ReportsPanel() {
  return (
    <div className="reports-panel">
      <h1>Reports</h1>
      {/* Reports content */}
    </div>
  );
}

// Export with specific permission required
export default withAuth(ReportsPanel, {
  requiredPermission: 'VIEW_REPORTS',
  unauthorizedRedirect: '/dashboard',
});
```

### Example 10: Multiple Permission Requirements with HOC

```tsx
// components/InventoryManager.tsx
import { withAuth } from '@/components/auth';

function InventoryManager() {
  return (
    <div className="inventory-manager">
      <h1>Inventory Management</h1>
      {/* Inventory management content */}
    </div>
  );
}

// Require user to have at least one of these permissions
export default withAuth(InventoryManager, {
  requiredPermissions: ['VIEW_INVENTORY', 'EDIT_PRODUCT'],
});
```

## Permission Checks in Code

### Example 11: Conditional Logic Based on Permissions

```tsx
// components/ProductCard.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { hasPermission } from '@/utils/permissions';

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const { user } = useAuth();

  const canEdit = hasPermission(user, 'EDIT_PRODUCT');
  const canDelete = hasPermission(user, 'DELETE_PRODUCT');

  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <p className="price">${product.price}</p>

      <div className="actions">
        {canEdit && (
          <button onClick={onEdit} className="btn btn-secondary">
            Edit
          </button>
        )}
        {canDelete && (
          <button onClick={onDelete} className="btn btn-danger">
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
```

### Example 12: Role-Based Feature Flags

```tsx
// hooks/useFeatures.ts
import { useAuth } from '@/hooks/useAuth';
import { isAdmin, isManager } from '@/utils/permissions';

export function useFeatures() {
  const { user } = useAuth();

  return {
    canExportData: isAdmin(user) || isManager(user),
    canImportData: isAdmin(user) || isManager(user),
    canManageUsers: isAdmin(user),
    canViewReports: isAdmin(user) || isManager(user),
    canEditSettings: isAdmin(user),
    canDeleteOrders: isAdmin(user),
    canRefundOrders: isAdmin(user),
  };
}

// Usage in component
function OrderActions() {
  const features = useFeatures();

  return (
    <div>
      {features.canDeleteOrders && <button>Delete Order</button>}
      {features.canRefundOrders && <button>Refund Order</button>}
    </div>
  );
}
```

### Example 13: Multiple Permission Checks

```tsx
// components/CustomerForm.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { hasAnyPermission, hasAllPermissions } from '@/utils/permissions';

export function CustomerForm() {
  const { user } = useAuth();

  // User needs at least one of these permissions
  const canModifyCustomer = hasAnyPermission(user, ['CREATE_CUSTOMER', 'EDIT_CUSTOMER']);

  // User needs all of these permissions
  const canFullyManageCustomer = hasAllPermissions(user, [
    'CREATE_CUSTOMER',
    'EDIT_CUSTOMER',
    'DELETE_CUSTOMER',
  ]);

  if (!canModifyCustomer) {
    return <p>You don't have permission to modify customers.</p>;
  }

  return (
    <form>
      {/* Form fields */}
      <button type="submit">Save Customer</button>
      {canFullyManageCustomer && (
        <button type="button" className="btn-danger">
          Delete Customer
        </button>
      )}
    </form>
  );
}
```

## Common Patterns

### Example 14: Protected API Route Handler

```tsx
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { hasPermission } from '@/utils/permissions';
import { getCurrentUser } from '@/lib/auth'; // Hypothetical function

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);

  if (!hasPermission(user, 'VIEW_USERS')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }

  // Fetch and return users
  const users = await fetchUsers();
  return NextResponse.json(users);
}
```

### Example 15: Dynamic Permission-Based Routing

```tsx
// components/DashboardRouter.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { hasPermission } from '@/utils/permissions';

export function DashboardRouter() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    // Redirect based on user permissions
    if (hasPermission(user, 'VIEW_REPORTS')) {
      router.push('/dashboard/reports');
    } else if (hasPermission(user, 'ACCESS_POS')) {
      router.push('/dashboard/pos');
    } else {
      router.push('/dashboard/profile');
    }
  }, [user, isAuthenticated, router]);

  return <div>Redirecting...</div>;
}
```

### Example 16: Permission-Based Form Validation

```tsx
// components/OrderForm.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { hasPermission } from '@/utils/permissions';
import { useForm } from 'react-hook-form';

export function OrderForm() {
  const { user } = useAuth();
  const { register, handleSubmit } = useForm();

  const canApplyDiscount = hasPermission(user, 'EDIT_ORDER');
  const canRefund = hasPermission(user, 'REFUND_ORDER');

  const onSubmit = (data: any) => {
    // Validate permissions before submission
    if (data.discount && !canApplyDiscount) {
      alert('You do not have permission to apply discounts');
      return;
    }

    if (data.refund && !canRefund) {
      alert('You do not have permission to process refunds');
      return;
    }

    // Process order
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Order fields */}

      {canApplyDiscount && (
        <div>
          <label>Discount</label>
          <input {...register('discount')} type="number" />
        </div>
      )}

      {canRefund && (
        <div>
          <label>
            <input {...register('refund')} type="checkbox" />
            Process as refund
          </label>
        </div>
      )}

      <button type="submit">Submit Order</button>
    </form>
  );
}
```

## Best Practices

1. **Always check permissions on both client and server**: Client-side checks improve UX, but server-side checks are essential for security.

2. **Use the most specific permission check**: Prefer `requiredPermission` over `requiredRole` when possible for better granularity.

3. **Provide clear feedback**: Use fallback content to explain why access is denied and how to get access.

4. **Cache permission checks**: For frequently checked permissions, consider memoizing the results.

5. **Test with different roles**: Always test your components with all three roles (Admin, Manager, Staff) to ensure proper access control.

6. **Document permission requirements**: Add comments explaining why specific permissions are required for features.
