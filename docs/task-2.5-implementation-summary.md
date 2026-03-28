# Task 2.5 Implementation Summary: Route Guards and Permission Checks

## Overview

This document summarizes the implementation of route guards and permission checks for the POS CRM System, completing task 2.5 from the implementation plan.

## Requirements Addressed

- **Requirement 4.6**: Route guards enforce authentication requirements on protected routes
- **Requirement 4.7**: Route guards enforce authorization requirements based on user role
- **Requirement 4.8**: Permission checks control UI element visibility based on user permissions
- **Requirement 14.9**: Permission checks enforce role-based access control on all protected operations

## Components Implemented

### 1. Permission Utilities (`utils/permissions.ts`)

A comprehensive set of utility functions for checking user permissions and roles.

**Key Features:**
- Permission definitions for all system features
- Role-based access control (Admin, Manager, Staff)
- Functions for checking single and multiple permissions
- Role checking utilities

**Functions:**
- `hasPermission(user, permission)` - Check if user has a specific permission
- `hasAnyPermission(user, permissions)` - Check if user has any of the specified permissions
- `hasAllPermissions(user, permissions)` - Check if user has all of the specified permissions
- `hasRole(user, role)` - Check if user has a specific role
- `hasAnyRole(user, roles)` - Check if user has any of the specified roles
- `isAdmin(user)` - Check if user is an admin
- `isManager(user)` - Check if user is a manager
- `isStaff(user)` - Check if user is staff

**Permission Categories:**
- Dashboard access
- POS billing operations
- Customer management
- Lead management
- Orders and sales
- Inventory management
- Reports
- Settings
- User management

### 2. RouteGuard Component (`components/auth/RouteGuard.tsx`)

A flexible component for protecting routes with authentication and authorization checks.

**Key Features:**
- Enforces authentication requirements
- Enforces authorization based on permissions or roles
- Redirects unauthenticated users to login
- Redirects unauthorized users to access denied page
- Shows loading state during auth check
- Supports custom fallback content
- Stores return URL for post-login redirect

**Props:**
- `requireAuth` - Require authentication (default: true)
- `requiredPermission` - Required permission for access
- `requiredPermissions` - Required permissions (user must have at least one)
- `requiredRole` - Required role for access
- `requiredRoles` - Required roles (user must have at least one)
- `fallback` - Custom fallback component for unauthorized access
- `unauthorizedRedirect` - Redirect path for unauthorized access

### 3. ProtectedRoute Component (`components/auth/ProtectedRoute.tsx`)

A simplified wrapper for protecting routes in Next.js App Router.

**Key Features:**
- Designed for use in layout.tsx files
- Protects entire route segments
- Simpler API than RouteGuard
- Automatically requires authentication

**Use Case:**
```tsx
// In app/admin/layout.tsx
export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute requiredRole={Role.ADMIN}>
      {children}
    </ProtectedRoute>
  );
}
```

### 4. PermissionGate Component (`components/auth/PermissionGate.tsx`)

Conditionally renders children based on user permissions.

**Key Features:**
- Shows/hides UI elements based on permissions
- Supports permission and role checks
- Supports fallback content
- Supports inverted checks (show when user does NOT have permission)
- No redirects - purely for conditional rendering

**Props:**
- `requiredPermission` - Required permission for rendering
- `requiredPermissions` - Required permissions (user must have at least one)
- `requiredAllPermissions` - Required permissions (user must have all)
- `requiredRole` - Required role for rendering
- `requiredRoles` - Required roles (user must have at least one)
- `fallback` - Fallback content when permission check fails
- `invert` - Invert the permission check

### 5. withAuth HOC (`components/auth/withAuth.tsx`)

Higher-Order Component for wrapping components with authentication and authorization.

**Key Features:**
- Wraps components with RouteGuard
- Supports all RouteGuard options
- Provides convenience HOCs for specific roles
- Preserves component display name for debugging

**Convenience HOCs:**
- `withAdminAuth` - Requires admin role
- `withManagerAuth` - Requires manager or admin role
- `withStaffAuth` - Requires any authenticated user

**Use Case:**
```tsx
function AdminPanel() {
  return <div>Admin Content</div>;
}

export default withAdminAuth(AdminPanel);
```

### 6. Access Denied Page (`app/access-denied/page.tsx`)

A user-friendly page displayed when access is denied.

**Key Features:**
- Shows clear error message
- Displays user's current role
- Provides navigation options (go back, go to dashboard)
- Suggests contacting administrator

### 7. Dashboard Layout (`app/dashboard/layout.tsx`)

Example implementation of ProtectedRoute in a layout file.

**Key Features:**
- Protects all dashboard routes
- Requires authentication
- Demonstrates proper usage pattern

## Role-Based Access Control

### Admin Role
- Full system access
- Can manage users, roles, and settings
- Can access all features

**Permissions:**
- All permissions available in the system

### Manager Role
- Access to reports, inventory, and customer management
- Can manage products, customers, leads, and orders
- Cannot manage users or system settings

**Permissions:**
- VIEW_DASHBOARD
- ACCESS_POS, PROCESS_TRANSACTIONS
- VIEW_CUSTOMERS, CREATE_CUSTOMER, EDIT_CUSTOMER, DELETE_CUSTOMER
- VIEW_LEADS, CREATE_LEAD, EDIT_LEAD, DELETE_LEAD
- VIEW_ORDERS, EDIT_ORDER, CANCEL_ORDER
- VIEW_INVENTORY, CREATE_PRODUCT, EDIT_PRODUCT, DELETE_PRODUCT, IMPORT_PRODUCTS
- VIEW_REPORTS, EXPORT_REPORTS

### Staff Role
- Access to POS billing and customer lookup only
- Can process transactions and view customer information
- Limited access to other features

**Permissions:**
- VIEW_DASHBOARD
- ACCESS_POS, PROCESS_TRANSACTIONS
- VIEW_CUSTOMERS, CREATE_CUSTOMER

## Usage Examples

### Protecting a Page

```tsx
// app/reports/page.tsx
'use client';

import { ProtectedRoute } from '@/components/auth';

export default function ReportsPage() {
  return (
    <ProtectedRoute requiredPermission="VIEW_REPORTS">
      <div>Reports Content</div>
    </ProtectedRoute>
  );
}
```

### Conditional UI Elements

```tsx
import { PermissionGate } from '@/components/auth';

function CustomerActions() {
  return (
    <div>
      <PermissionGate requiredPermission="EDIT_CUSTOMER">
        <button>Edit</button>
      </PermissionGate>
      
      <PermissionGate requiredPermission="DELETE_CUSTOMER">
        <button>Delete</button>
      </PermissionGate>
    </div>
  );
}
```

### Using HOC

```tsx
import { withAdminAuth } from '@/components/auth';

function AdminPanel() {
  return <div>Admin Content</div>;
}

export default withAdminAuth(AdminPanel);
```

### Permission Checks in Code

```tsx
import { useAuth } from '@/hooks/useAuth';
import { hasPermission } from '@/utils/permissions';

function MyComponent() {
  const { user } = useAuth();

  if (hasPermission(user, 'VIEW_REPORTS')) {
    // User can view reports
  }
}
```

## Files Created

1. `utils/permissions.ts` - Permission utilities and definitions
2. `components/auth/RouteGuard.tsx` - Route guard component
3. `components/auth/ProtectedRoute.tsx` - Simplified protected route component
4. `components/auth/PermissionGate.tsx` - Conditional rendering component
5. `components/auth/withAuth.tsx` - Higher-Order Component for auth
6. `components/auth/index.ts` - Export file for auth components
7. `components/auth/README.md` - Comprehensive documentation
8. `components/auth/USAGE_EXAMPLES.md` - Detailed usage examples
9. `components/auth/__tests__/permissions.test.ts` - Unit tests for permissions
10. `app/access-denied/page.tsx` - Access denied page
11. `app/dashboard/layout.tsx` - Example protected layout

## Files Modified

1. `utils/index.ts` - Added exports for permission utilities

## Testing

Unit tests have been created for the permission utilities in `components/auth/__tests__/permissions.test.ts`. The tests cover:

- Permission checking for all roles
- Multiple permission checks
- Role checking
- Null user handling
- Edge cases

## Integration Points

The route guards and permission checks integrate with:

1. **useAuth Hook** - Gets current user and authentication state
2. **Next.js Router** - Handles redirects for unauthorized access
3. **Type System** - Uses TypeScript for type-safe permission checks
4. **Role Enum** - Uses the Role enum from types/enums.ts

## Security Considerations

1. **Client-Side Only**: These checks are for UX purposes only. Server-side validation is still required for security.
2. **No Token Storage**: Works with cookie-based authentication (no tokens in client storage)
3. **Type Safety**: TypeScript ensures permission names are valid at compile time
4. **Fail Secure**: Defaults to denying access when user is null or undefined

## Best Practices

1. Always check permissions on both client and server
2. Use the most specific permission check available
3. Provide clear feedback when access is denied
4. Test with all three roles (Admin, Manager, Staff)
5. Document permission requirements for features

## Future Enhancements

Potential improvements for future iterations:

1. Permission caching for performance
2. Dynamic permission loading from backend
3. Permission groups for easier management
4. Audit logging for permission checks
5. Permission inheritance and hierarchies

## Conclusion

Task 2.5 has been successfully completed. The implementation provides a comprehensive, type-safe, and flexible system for route protection and permission-based access control. The system supports three roles (Admin, Manager, Staff) with granular permissions for all system features.

All requirements (4.6, 4.7, 4.8, 14.9) have been satisfied with well-documented, tested, and reusable components.
