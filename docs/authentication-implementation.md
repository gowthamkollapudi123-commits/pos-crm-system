# Authentication Service Implementation

## Overview

This document describes the cookie-based authentication system implementation for the POS CRM System. The authentication service provides secure session management using HTTP-only cookies, automatic token refresh, and comprehensive error handling.

## Architecture

### Components

1. **Auth Service** (`services/auth.service.ts`)
   - Core authentication API calls
   - Login, logout, refresh, session verification, password reset

2. **Axios Client** (`lib/axios.ts`)
   - Configured with `withCredentials: true` for cookie handling
   - Automatic 401 response handling with token refresh
   - Request queuing during refresh operations
   - Tenant ID injection into all requests

3. **useAuth Hook** (`hooks/useAuth.ts`)
   - React hook for authentication state management
   - Login, logout, and password reset methods
   - Session checking on mount

4. **useSession Hook** (`hooks/useSession.ts`)
   - Session validation and monitoring
   - Automatic session refresh before expiration
   - Session expiry tracking

5. **AuthProvider** (`components/providers/AuthProvider.tsx`)
   - App-level authentication context
   - Session verification on app load
   - Global authentication state

## Cookie-Based Authentication Flow

### Initial App Load

```
1. App loads → AuthProvider mounts
2. AuthProvider calls /auth/me endpoint
3. If successful → User is authenticated
4. If 401 → Axios interceptor calls /auth/refresh
5. If refresh succeeds → Retry /auth/me
6. If refresh fails → Redirect to /login
```

### Login Flow

```
1. User submits credentials
2. useAuth.login() calls authService.login()
3. Backend sets HTTP-only cookie
4. Response includes user data
5. Auth state updated with user info
6. User redirected to dashboard
```

### Automatic Token Refresh

```
1. Any API call returns 401
2. Axios interceptor detects 401
3. If not already refreshing:
   a. Set isRefreshing flag
   b. Call /auth/refresh endpoint
   c. If successful, retry original request
   d. Process queued requests
4. If already refreshing:
   a. Queue the request
   b. Wait for refresh to complete
   c. Retry when refresh succeeds
```

### Logout Flow

```
1. User clicks logout
2. useAuth.logout() calls authService.logout()
3. Backend clears HTTP-only cookie
4. Local auth state cleared
5. User redirected to /login
```

## Security Features

### HTTP-Only Cookies

- Authentication tokens stored in HTTP-only cookies
- Not accessible via JavaScript
- Prevents XSS attacks from stealing tokens
- Automatically sent with every request via `withCredentials: true`

### No Client-Side Token Storage

- No tokens in localStorage
- No tokens in sessionStorage
- No tokens in any client-side storage
- Complies with security requirements 2.8, 2.9, 2.10, 2.11

### Automatic Session Management

- Session expiration monitoring
- Automatic refresh 5 minutes before expiration
- Graceful handling of expired sessions
- Redirect to login on authentication failure

### Request Queuing

- Prevents multiple simultaneous refresh attempts
- Queues requests during token refresh
- Retries all queued requests after successful refresh
- Fails all queued requests if refresh fails

## Usage Examples

### Using the useAuth Hook

```typescript
import { useAuth } from '@/hooks';

function LoginPage() {
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (credentials) => {
    const result = await login(credentials);
    if (result.success) {
      // Redirect to dashboard
      router.push('/dashboard');
    }
  };

  return (
    // Login form UI
  );
}
```

### Using the AuthProvider Context

```typescript
import { useAuthContext } from '@/components/providers/AuthProvider';

function ProtectedPage() {
  const { user, isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    redirect('/login');
  }

  return (
    <div>Welcome, {user.name}!</div>
  );
}
```

### Using the useSession Hook

```typescript
import { useSession } from '@/hooks';

function SessionMonitor() {
  const { isValid, expiresAt, refreshSession } = useSession();

  return (
    <div>
      Session valid: {isValid ? 'Yes' : 'No'}
      {expiresAt && <p>Expires at: {new Date(expiresAt).toLocaleString()}</p>}
      <button onClick={refreshSession}>Refresh Session</button>
    </div>
  );
}
```

## API Endpoints

### POST /auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "tenantId": "tenant-id" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "Admin",
      "tenantId": "tenant-id",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    "expiresAt": "2024-01-01T01:00:00Z"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Sets HTTP-only cookie:** `session_token`

### GET /auth/me

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "expiresAt": "2024-01-01T01:00:00Z"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### POST /auth/refresh

**Response:**
```json
{
  "success": true,
  "data": {
    "expiresAt": "2024-01-01T02:00:00Z"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Updates HTTP-only cookie:** `session_token`

### POST /auth/logout

**Response:**
```json
{
  "success": true,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Clears HTTP-only cookie:** `session_token`

### POST /auth/reset-password

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Error Handling

### Network Errors

- Detected by axios interceptor
- User-friendly error message displayed
- Original error logged for debugging

### 401 Unauthorized

- Automatically triggers refresh flow
- If refresh succeeds, original request retried
- If refresh fails, user redirected to login

### Other API Errors

- Error message extracted from response
- Displayed to user via error state
- Logged for debugging

## Testing Considerations

### Manual Testing

1. **Login Flow**
   - Test successful login
   - Test failed login (wrong credentials)
   - Verify redirect to dashboard after login

2. **Session Persistence**
   - Login and refresh page
   - Verify user remains authenticated
   - Check session cookie in browser DevTools

3. **Token Refresh**
   - Wait for session to near expiration
   - Make an API call
   - Verify automatic refresh occurs

4. **Logout Flow**
   - Click logout
   - Verify redirect to login
   - Verify session cookie cleared
   - Try accessing protected route

5. **Expired Session**
   - Let session expire completely
   - Make an API call
   - Verify redirect to login

### Integration Testing

- Mock API responses for auth endpoints
- Test hook state transitions
- Test error handling paths
- Test concurrent request queuing

## Requirements Satisfied

This implementation satisfies the following requirements:

- **2.1**: /auth/me endpoint called on app load
- **2.2**: /auth/refresh called when /auth/me returns unauthorized
- **2.3**: Original request retried after successful refresh
- **2.4**: Redirect to login on refresh failure
- **2.5**: withCredentials: true set for all requests
- **2.6**: 401 responses trigger automatic refresh flow
- **2.7**: Original request retried after token refresh
- **2.8**: No tokens in localStorage
- **2.9**: No tokens in sessionStorage
- **2.10**: No tokens in any client-side storage
- **2.11**: Exclusive use of HTTP-only cookies
- **5.1**: Login endpoint integration
- **5.2**: Redirect to dashboard on successful login
- **5.3**: Error message display on login failure
- **5.4**: Logout function with endpoint call
- **5.5**: Tenant context clearing and redirect on logout
- **5.6**: Password reset function
- **5.7**: Email and password validation
- **5.8**: Graceful session expiration handling

## Future Enhancements

1. **Multi-Factor Authentication (MFA)**
   - Add MFA challenge after initial login
   - Support TOTP and SMS verification

2. **Session Management UI**
   - Display active sessions
   - Allow user to revoke sessions
   - Show session expiration countdown

3. **Remember Me Functionality**
   - Extended session duration option
   - Persistent login across browser sessions

4. **Biometric Authentication**
   - WebAuthn integration
   - Fingerprint/Face ID support

5. **Security Monitoring**
   - Failed login attempt tracking
   - Suspicious activity detection
   - Account lockout after multiple failures
