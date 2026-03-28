/**
 * PermissionGate Component Tests
 *
 * Validates that PermissionGate renders/hides children based on role.
 * Requirements: 4.8, 14.9
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Role } from '@/types/enums';
import type { User } from '@/types/entities';

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/hooks/useAuth';

const makeUser = (role: Role): User => ({
  id: '1',
  email: 'user@example.com',
  name: 'Test User',
  role,
  tenantId: 'tenant1',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
});

const mockAuth = (role: Role | null) => {
  vi.mocked(useAuth).mockReturnValue({
    user: role ? makeUser(role) : null,
    isAuthenticated: role !== null,
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    resetPassword: vi.fn(),
    checkSession: vi.fn(),
  });
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PermissionGate', () => {
  describe('requiredRole', () => {
    it('renders children when user has the required role', () => {
      mockAuth(Role.ADMIN);
      render(
        <PermissionGate requiredRole={Role.ADMIN}>
          <span>Admin Content</span>
        </PermissionGate>
      );
      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });

    it('does not render children when user lacks the required role', () => {
      mockAuth(Role.STAFF);
      render(
        <PermissionGate requiredRole={Role.ADMIN}>
          <span>Admin Content</span>
        </PermissionGate>
      );
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('renders fallback when user lacks the required role', () => {
      mockAuth(Role.STAFF);
      render(
        <PermissionGate requiredRole={Role.ADMIN} fallback={<span>No Access</span>}>
          <span>Admin Content</span>
        </PermissionGate>
      );
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
      expect(screen.getByText('No Access')).toBeInTheDocument();
    });
  });

  describe('requiredRoles', () => {
    it('renders children when user has one of the allowed roles', () => {
      mockAuth(Role.MANAGER);
      render(
        <PermissionGate requiredRoles={[Role.ADMIN, Role.MANAGER]}>
          <span>Manager+ Content</span>
        </PermissionGate>
      );
      expect(screen.getByText('Manager+ Content')).toBeInTheDocument();
    });

    it('hides children when user role is not in the allowed list', () => {
      mockAuth(Role.STAFF);
      render(
        <PermissionGate requiredRoles={[Role.ADMIN, Role.MANAGER]}>
          <span>Manager+ Content</span>
        </PermissionGate>
      );
      expect(screen.queryByText('Manager+ Content')).not.toBeInTheDocument();
    });
  });

  describe('requiredPermission', () => {
    it('renders children when user has the required permission', () => {
      mockAuth(Role.ADMIN);
      render(
        <PermissionGate requiredPermission="VIEW_USERS">
          <span>Users Section</span>
        </PermissionGate>
      );
      expect(screen.getByText('Users Section')).toBeInTheDocument();
    });

    it('hides children when user lacks the required permission', () => {
      mockAuth(Role.STAFF);
      render(
        <PermissionGate requiredPermission="VIEW_USERS">
          <span>Users Section</span>
        </PermissionGate>
      );
      expect(screen.queryByText('Users Section')).not.toBeInTheDocument();
    });
  });

  describe('unauthenticated user', () => {
    it('renders fallback when user is not authenticated', () => {
      mockAuth(null);
      render(
        <PermissionGate requiredRole={Role.ADMIN} fallback={<span>Please log in</span>}>
          <span>Protected</span>
        </PermissionGate>
      );
      expect(screen.queryByText('Protected')).not.toBeInTheDocument();
      expect(screen.getByText('Please log in')).toBeInTheDocument();
    });
  });

  describe('invert prop', () => {
    it('hides children for the specified role when inverted', () => {
      mockAuth(Role.ADMIN);
      render(
        <PermissionGate requiredRole={Role.ADMIN} invert>
          <span>Non-Admin Content</span>
        </PermissionGate>
      );
      expect(screen.queryByText('Non-Admin Content')).not.toBeInTheDocument();
    });

    it('shows children for other roles when inverted', () => {
      mockAuth(Role.STAFF);
      render(
        <PermissionGate requiredRole={Role.ADMIN} invert>
          <span>Non-Admin Content</span>
        </PermissionGate>
      );
      expect(screen.getByText('Non-Admin Content')).toBeInTheDocument();
    });
  });
});
