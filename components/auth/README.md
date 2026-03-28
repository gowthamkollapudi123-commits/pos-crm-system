# Authentication and Authorization Components

This directory contains components and utilities for implementing route guards and permission-based access control in the POS CRM System.

## Components

### RouteGuard

The `RouteGuard` component protects routes by enforcing authentication and authorization requirements. It redirects unauthenticated users to the login page and unauthorized users to an access denied page.

**Usage:**

```tsx
import { RouteGuard } from '@/components/auth';
import { Role } from '@/types/enums';

// Require authentication only
<RouteGuard>
  <ProtectedContent />
</RouteGuard>

// Require specific permission
<RouteGuard requiredPermission="VIEW_REPORTS">
  <ReportsPage />
</RouteGuard>

// Require specific role
<RouteGuard requiredRole={Role.ADMIN}>
  <AdminPanel />
</RouteGuard>

// Require one of multiple roles
<RouteGuard requiredRoles={[Role.ADMIN, Role.MANAGER]}>
  <ManagerContent />
</RouteGuard>
```

### ProtectedRoute

A simplified wrapper for protecting routes in Next.js App Router. Use this in `layout.tsx` files to protect entire route segments.

**Usage:**

```tsx
// In app/admin/layout.tsx
import { ProtectedRoute } from '@/components/auth';
import { Role } from '@/types/enums';

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute requiredRole={Role.ADMIN}>
      {children}
    </ProtectedRoute>
  );
}
```

### PermissionGate

Conditionally renders children based on user permissions. Used for showing/hiding UI elements based on role-based access control.

**Usage:**

```tsx
import { PermissionGate } from '@/components/auth';
import { Role } from '@/types/enums';

// Show button only to admins
<PermissionGate requiredRole={Role.ADMIN}>
  <button>Delete User</button>
</PermissionGate>

// Show content to users with specific permission
<PermissionGate requiredPermission="VIEW_REPORTS">
  <ReportsSection />
</PermissionGate>

// Show content to users with any of the specified permissions
<PermissionGate requiredPermissions={['EDIT_CUSTOMER', 'DELETE_CUSTOMER']}>
  <CustomerActions />
</PermissionGate>

// Show fallback content when permission check fails
<PermissionGate 
  requiredPermission="VIEW_REPORTS"
  fallback={<p>You don't have access to reports</p>}
>
  <ReportsSection />
</PermissionGate>

// Invert the check (show when user does NOT have permission)
<PermissionGate requiredRole={Role.ADMIN} invert>
  <p>You are not an admin</p>
</PermissionGate>
```

### withAuth HOC

Higher-Order Component that wraps components with authentication and authorization checks.

**Usage:**

```tsx
import { withAuth, withAdminAuth, withManagerAuth } from '@/components/auth';
import { Role } from '@/types/enums';

// Require authentication only
export default withAuth(MyComponent);

// Require specific permission
export default withAuth(MyComponent, {
  requiredPermission: 'VIEW_REPORTS'
});

// Require specific role
export default withAuth(MyComponent, {
  requiredRole: Role.ADMIN
});

// Require one of multiple permissions
export default withAuth(MyComponent, {
  requiredPermissions: ['VIEW_CUSTOMERS', 'EDIT_CUSTOMER']
});

// Convenience HOCs for specific roles
export default withAdminAuth(AdminComponent);
export default withManagerAuth(ManagerComponent);
export default withStaffAuth(StaffComponent);
```

## Permission Utilities

The `permissions.ts` utility file provides functions for checking user permissions and roles.

### Available Functions

- `hasPermission(user, permission)` - Check if user has a specific permission
- `hasAnyPermission(user, permissions)` - Check if user has any of the specified permissions
- `hasAllPermissions(user, permissions)` - Check if user has all of the specified permissions
- `hasRole(user, role)` - Check if user has a specific role
- `hasAnyRole(user, roles)` - Check if user has any of the specified roles
- `isAdmin(user)` - Check if user is an admin
- `isManager(user)` - Check if user is a manager
- `isStaff(user)` - Check if user is staff

**Usage:**

```tsx
import { useAuth } from '@/hooks/useAuth';
import { hasPermission, isAdmin } from '@/utils/permissions';

function MyComponent() {
  const { user } = useAuth();

  if (hasPermission(user, 'VIEW_REPORTS')) {
    // User can view reports
  }

  if (isAdmin(user)) {
    // User is an admin
  }
}
```

## Permission Definitions

The system defines three roles with different access levels:

### Admin Role
- Full system access
- Can manage users, roles, and settings
- Can access all features

### Manager Role
- Access to reports, inventory, and customer management
- Can manage products, customers, leads, and orders
- Cannot manage users or system settings

### Staff Role
- Access to POS billing and customer lookup only
- Can process transactions and view customer information
- Limited access to other features

## Available Permissions

See `utils/permissions.ts` for the complete list of permissions. Key permissions include:

- **Dashboard**: `VIEW_DASHBOARD`
- **POS**: `ACCESS_POS`, `PROCESS_TRANSACTIONS`
- **Customers**: `VIEW_CUSTOMERS`, `CREATE_CUSTOMER`, `EDIT_CUSTOMER`, `DELETE_CUSTOMER`
- **Leads**: `VIEW_LEADS`, `CREATE_LEAD`, `EDIT_LEAD`, `DELETE_LEAD`
- **Orders**: `VIEW_ORDERS`, `EDIT_ORDER`, `CANCEL_ORDER`, `REFUND_ORDER`
- **Inventory**: `VIEW_INVENTORY`, `CREATE_PRODUCT`, `EDIT_PRODUCT`, `DELETE_PRODUCT`, `IMPORT_PRODUCTS`
- **Reports**: `VIEW_REPORTS`, `EXPORT_REPORTS`
- **Settings**: `VIEW_SETTINGS`, `EDIT_SETTINGS`
- **Users**: `VIEW_USERS`, `CREATE_USER`, `EDIT_USER`, `DELETE_USER`, `MANAGE_ROLES`

## Examples

### Protecting a Page

```tsx
// app/reports/page.tsx
'use client';

import { ProtectedRoute } from '@/components/auth';

export default function ReportsPage() {
  return (
    <ProtectedRoute requiredPermission="VIEW_REPORTS">
      <div>
        <h1>Reports</h1>
        {/* Report content */}
      </div>
    </ProtectedRoute>
  );
}
```

### Conditional UI Elements

```tsx
import { PermissionGate } from '@/components/auth';

function CustomerList() {
  return (
    <div>
      <h1>Customers</h1>
      
      <PermissionGate requiredPermission="CREATE_CUSTOMER">
        <button>Add Customer</button>
      </PermissionGate>

      <table>
        {/* Customer list */}
      </table>
    </div>
  );
}
```

### Using HOC

```tsx
// components/AdminPanel.tsx
import { withAdminAuth } from '@/components/auth';

function AdminPanel() {
  return (
    <div>
      <h1>Admin Panel</h1>
      {/* Admin content */}
    </div>
  );
}

export default withAdminAuth(AdminPanel);
```

## Requirements Satisfied

- **4.6**: Route guards enforce authentication requirements on protected routes
- **4.7**: Route guards enforce authorization requirements based on user role
- **4.8**: Permission checks control UI element visibility based on user permissions
- **14.9**: Permission checks enforce role-based access control on all protected operations
