# Axios Client Implementation

## Overview

This document describes the implementation of the Axios HTTP client for the POS CRM System. The client is configured with interceptors for authentication, tenant ID injection, and error handling.

## Requirements Addressed

This implementation addresses the following requirements from the specification:

- **Requirement 1.6**: Use Axios for HTTP communication
- **Requirement 2.5**: Set withCredentials: true for all HTTP requests
- **Requirement 17.2**: Use a configured Axios instance for all HTTP requests
- **Requirement 17.3**: Add tenant identification to all requests
- **Requirement 17.4**: Handle authentication errors globally
- **Requirement 17.5**: Handle network errors globally
- **Requirement 17.9**: Implement request timeout configuration
- **Requirement 17.10**: Implement request cancellation for aborted operations

## Architecture

### File Structure

```
pos-crm-system/
├── lib/
│   ├── axios.ts                 # Main Axios client configuration
│   ├── README.md                # Library documentation
│   └── __tests__/
│       └── axios.test.ts        # Unit tests (placeholder)
├── services/
│   └── auth.service.ts          # Example service using the client
├── types/
│   └── api.ts                   # API type definitions (existing)
└── .env.example                 # Environment variable template
```

### Components

#### 1. Axios Client (`lib/axios.ts`)

The main HTTP client with the following features:

**Configuration:**
- Base URL: Configurable via `NEXT_PUBLIC_API_BASE_URL` (default: `/api`)
- Timeout: 30 seconds
- Credentials: Enabled (`withCredentials: true`)
- Content-Type: `application/json`

**Tenant ID Resolution:**
The client resolves tenant ID in the following priority order:
1. Subdomain (e.g., `tenant1.example.com` → `tenant1`)
2. URL parameter (`?tenantId=xxx`)
3. LocalStorage (`tenantId` key)

**Request Interceptor:**
- Automatically injects tenant ID into request URLs
- Formats URLs as: `/api/{tenantId}/endpoint`
- Prevents duplicate tenant ID injection

**Response Interceptor:**
- Handles 401 Unauthorized errors
- Implements automatic token refresh
- Queues requests during refresh to prevent race conditions
- Redirects to login on refresh failure
- Provides user-friendly error messages for network errors

#### 2. Authentication Service (`services/auth.service.ts`)

Example service demonstrating proper usage of the Axios client:
- `login()`: Authenticate user
- `refresh()`: Refresh session token
- `me()`: Verify current session
- `logout()`: End user session
- `resetPassword()`: Request password reset

## Usage Examples

### Basic GET Request

```typescript
import apiClient from '@/lib/axios';

const fetchProducts = async () => {
  try {
    const response = await apiClient.get('/products');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
};
```

### POST Request with Data

```typescript
import apiClient from '@/lib/axios';

const createProduct = async (productData) => {
  try {
    const response = await apiClient.post('/products', productData);
    return response.data;
  } catch (error) {
    console.error('Failed to create product:', error);
    throw error;
  }
};
```

### Using with React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';

const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await apiClient.get('/products');
      return response.data;
    },
  });
};
```

### Error Handling

```typescript
import apiClient from '@/lib/axios';
import { AxiosError } from 'axios';

const fetchData = async () => {
  try {
    const response = await apiClient.get('/data');
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response) {
        // Server responded with error status
        console.error('Server error:', error.response.status);
      } else if (error.request) {
        // Request made but no response received
        console.error('Network error:', error.message);
      }
    }
    throw error;
  }
};
```

## Authentication Flow

### Initial Request

1. User makes a request to a protected endpoint
2. Request interceptor injects tenant ID
3. Request includes HTTP-only cookies automatically
4. Server validates session and returns data

### Token Expiration (401 Error)

1. Server returns 401 Unauthorized
2. Response interceptor catches the error
3. Client attempts to refresh token via `/auth/refresh`
4. If successful:
   - Original request is retried
   - Queued requests are processed
5. If failed:
   - User is redirected to login page
   - Queued requests are rejected

### Request Queuing

When a token refresh is in progress:
1. Subsequent requests are queued
2. Requests wait for refresh to complete
3. On success: All queued requests are retried
4. On failure: All queued requests are rejected

## Security Features

### Cookie-Based Authentication

- Uses HTTP-only cookies for session management
- Tokens are never exposed to JavaScript
- Mitigates XSS attacks
- Automatic cookie inclusion via `withCredentials: true`

### CSRF Protection

- Relies on server-side CSRF token validation
- Cookies are sent with same-site policy
- State-changing operations use POST/PUT/DELETE methods

### Tenant Isolation

- Tenant ID is injected into every request
- Ensures data isolation at the API level
- Prevents cross-tenant data access

## Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

### Timeout Configuration

The default timeout is 30 seconds. To modify:

```typescript
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
  timeout: 60000, // 60 seconds
  withCredentials: true,
});
```

## Testing

### Unit Tests

Basic test structure is provided in `lib/__tests__/axios.test.ts`. To implement:

1. Install testing dependencies:
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

2. Run tests:
```bash
npm test
```

### Integration Tests

For integration testing:

1. Mock the API endpoints
2. Test the complete request/response cycle
3. Verify interceptor behavior
4. Test error handling scenarios

## Troubleshooting

### Common Issues

**Issue: Tenant ID not injected**
- Verify tenant ID is available (subdomain, URL param, or localStorage)
- Check browser console for errors
- Ensure `getTenantId()` function returns a valid value

**Issue: 401 errors not handled**
- Verify `/auth/refresh` endpoint is implemented
- Check that cookies are being sent with requests
- Ensure `withCredentials: true` is set

**Issue: Network errors**
- Check API base URL configuration
- Verify CORS settings on the server
- Ensure the API server is running

**Issue: Requests timing out**
- Increase timeout value if needed
- Check server response times
- Verify network connectivity

## Future Enhancements

1. **Request Logging**: Add development mode logging for debugging
2. **Retry Logic**: Implement automatic retry for failed requests
3. **Request Deduplication**: Prevent duplicate simultaneous requests
4. **Cancellation Tokens**: Support for manual request cancellation
5. **Metrics**: Add performance monitoring and analytics
6. **Rate Limiting**: Implement client-side rate limiting
7. **Offline Support**: Queue requests when offline and sync when online

## References

- [Axios Documentation](https://axios-http.com/docs/intro)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [HTTP-only Cookies](https://owasp.org/www-community/HttpOnly)
- [CSRF Protection](https://owasp.org/www-community/attacks/csrf)
