# Hooks Directory

This directory contains custom React hooks for the POS CRM System.

## Available Hooks

### useAuth

Provides authentication state and methods for login, logout, and session management.

**Features:**
- User authentication state
- Login with credentials
- Logout with session cleanup
- Password reset functionality
- Session checking on mount
- Error handling

**Usage:**
```typescript
import { useAuth } from '@/hooks';

function MyComponent() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  
  // Use authentication state and methods
}
```

### useSession

Provides session validation and automatic refresh functionality.

**Features:**
- Session validity checking
- Automatic session refresh before expiration
- Session expiry tracking
- Manual session refresh

**Usage:**
```typescript
import { useSession } from '@/hooks';

function MyComponent() {
  const { isValid, expiresAt, validateSession, refreshSession } = useSession();
  
  // Monitor and manage session
}
```

## Best Practices

1. **Use useAuth for authentication operations**
   - Login, logout, password reset
   - Accessing current user information
   - Checking authentication status

2. **Use useSession for session monitoring**
   - Tracking session expiration
   - Manual session refresh
   - Session validity checks

3. **Use AuthProvider context for global state**
   - App-level authentication state
   - Automatic session verification on load
   - Consistent authentication state across components

## Related Components

- `components/providers/AuthProvider.tsx` - Global authentication context provider
- `services/auth.service.ts` - Authentication API service
- `lib/axios.ts` - Axios client with automatic token refresh
