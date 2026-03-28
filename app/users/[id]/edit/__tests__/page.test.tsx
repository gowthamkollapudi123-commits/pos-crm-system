/**
 * Edit User Page Tests
 *
 * Tests for user edit form including:
 * - Form pre-population
 * - Validation
 * - Successful update
 * - Deactivation
 * - Preventing deactivation of last Admin
 *
 * Requirements: 14.3, 14.4, 14.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EditUserPage from '../page';
import { usersService } from '@/services/users.service';
import { User } from '@/types/entities';
import { Role } from '@/types/enums';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: 'user-1' }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/services/users.service');

const mockUser: User = {
  id: 'user-1',
  tenantId: 'tenant1',
  name: 'Alice Admin',
  email: 'alice@example.com',
  role: Role.ADMIN,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockStaffUser: User = {
  id: 'user-2',
  tenantId: 'tenant1',
  name: 'Bob Staff',
  email: 'bob@example.com',
  role: Role.STAFF,
  isActive: true,
  createdAt: '2024-01-02T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
};

const mockPaginatedResponse = (users: User[]) => ({
  success: true,
  data: users,
  pagination: { page: 1, pageSize: 100, totalItems: users.length, totalPages: 1 },
  timestamp: new Date().toISOString(),
});

const mockApiResponse = (user: User) => ({
  success: true,
  data: user,
  timestamp: new Date().toISOString(),
});

describe('EditUserPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    vi.mocked(usersService.getById).mockResolvedValue(mockApiResponse(mockUser));
    vi.mocked(usersService.getAll).mockResolvedValue(
      mockPaginatedResponse([mockUser, mockStaffUser])
    );
    vi.mocked(usersService.update).mockResolvedValue(mockApiResponse(mockUser));
    vi.mocked(usersService.deactivate).mockResolvedValue(mockApiResponse({ ...mockUser, isActive: false }));
  });

  const renderPage = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <EditUserPage />
      </QueryClientProvider>
    );

  it('renders loading state initially', () => {
    renderPage();
    expect(screen.getByText(/loading user/i)).toBeInTheDocument();
  });

  it('renders the page header after loading', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Edit User')).toBeInTheDocument();
    });
  });

  it('pre-populates form with user data', async () => {
    renderPage();

    await waitFor(() => {
      expect((screen.getByLabelText(/full name/i) as HTMLInputElement).value).toBe('Alice Admin');
      expect((screen.getByLabelText(/email address/i) as HTMLInputElement).value).toBe('alice@example.com');
    });
  });

  it('pre-populates role select with user role', async () => {
    renderPage();

    await waitFor(() => {
      const roleSelect = screen.getByLabelText(/^role/i) as HTMLSelectElement;
      expect(roleSelect.value).toBe(Role.ADMIN);
    });
  });

  it('shows validation error when name is too short', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'A' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for password mismatch', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'Password1' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'Password2' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });

  it('submits form and redirects to /users on success', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Alice Updated' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(usersService.update).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ name: 'Alice Updated' })
      );
      expect(mockPush).toHaveBeenCalledWith('/users');
    });
  });

  it('does not include password in update payload when password field is empty', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      const callArg = vi.mocked(usersService.update).mock.calls[0]?.[1];
      expect(callArg).not.toHaveProperty('password');
    });
  });

  it('includes password in update payload when provided', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'NewPass1' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'NewPass1' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      const callArg = vi.mocked(usersService.update).mock.calls[0]?.[1];
      expect(callArg).toHaveProperty('password', 'NewPass1');
    });
  });

  it('shows Deactivate User button for active users', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /deactivate user/i })).toBeInTheDocument();
    });
  });

  it('calls deactivate service when Deactivate User is clicked (non-last-admin)', async () => {
    // Set up: two admins so this is NOT the last admin
    const secondAdmin: User = {
      ...mockUser,
      id: 'user-3',
      name: 'Second Admin',
      email: 'admin2@example.com',
    };
    vi.mocked(usersService.getAll).mockResolvedValue(
      mockPaginatedResponse([mockUser, secondAdmin, mockStaffUser])
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /deactivate user/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /deactivate user/i }));

    await waitFor(() => {
      expect(usersService.deactivate).toHaveBeenCalledWith('user-1');
      expect(mockPush).toHaveBeenCalledWith('/users');
    });
  });

  it('prevents deactivation of the last Admin user', async () => {
    const { toast } = await import('sonner');
    // Only one admin (the current user)
    vi.mocked(usersService.getAll).mockResolvedValue(
      mockPaginatedResponse([mockUser, mockStaffUser])
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /deactivate user/i })).toBeInTheDocument();
    });

    // Button should be disabled
    const deactivateBtn = screen.getByRole('button', { name: /deactivate user/i });
    expect(deactivateBtn).toBeDisabled();

    // Clicking disabled button should not call deactivate
    fireEvent.click(deactivateBtn);
    expect(usersService.deactivate).not.toHaveBeenCalled();
  });

  it('shows last Admin warning when user is the last admin', async () => {
    vi.mocked(usersService.getAll).mockResolvedValue(
      mockPaginatedResponse([mockUser, mockStaffUser])
    );

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/last active admin user/i)
      ).toBeInTheDocument();
    });
  });

  it('shows error toast when update fails', async () => {
    const { toast } = await import('sonner');
    vi.mocked(usersService.update).mockRejectedValue(Object.assign(new Error('API Error'), { response: { data: { message: 'Failed to update user' } } }));

    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('shows error state when user fetch fails', async () => {
    vi.mocked(usersService.getById).mockRejectedValue(new Error('Not found'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/failed to load user/i)).toBeInTheDocument();
    });
  });

  it('navigates back to /users when Cancel is clicked', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockPush).toHaveBeenCalledWith('/users');
  });

  it('navigates back to /users when back arrow is clicked', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/back to users/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/back to users/i));
    expect(mockPush).toHaveBeenCalledWith('/users');
  });
});
