/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * New User Page Tests
 *
 * Tests for user creation form including:
 * - Form rendering
 * - Validation (name, email, password complexity, confirm password)
 * - Successful submission
 * - Error handling
 *
 * Requirements: 14.2, 14.10
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NewUserPage from '../page';
import { usersService } from '@/services/users.service';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/services/users.service');

const mockCreatedUser = {
  id: 'new-user-id',
  tenantId: 'tenant1',
  name: 'Jane Smith',
  email: 'jane@example.com',
  role: 'staff' as const,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('NewUserPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(usersService.create).mockResolvedValue({
      success: true,
      data: mockCreatedUser,
      timestamp: new Date().toISOString(),
    });
  });

  const renderPage = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <NewUserPage />
      </QueryClientProvider>
    );

  it('renders the page header', () => {
    renderPage();
    expect(screen.getByText('Add New User')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    renderPage();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('renders role options: Admin, Manager, Staff', () => {
    renderPage();
    expect(screen.getByRole('option', { name: 'Admin' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Manager' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Staff' })).toBeInTheDocument();
  });

  it('shows validation error when name is too short', async () => {
    renderPage();
    const nameInput = screen.getByLabelText(/full name/i);
    fireEvent.change(nameInput, { target: { value: 'A' } });
    fireEvent.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Smith' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for weak password (too short)', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Smith' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for password missing uppercase/number', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Smith' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'alllowercase' } });
    fireEvent.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/uppercase letter, one lowercase letter, and one number/i)
      ).toBeInTheDocument();
    });
  });

  it('shows validation error when passwords do not match', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Smith' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password1' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password2' } });
    fireEvent.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data and redirects to /users', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Smith' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/^role/i), { target: { value: 'staff' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password1' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password1' } });

    fireEvent.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(usersService.create).toHaveBeenCalledWith({
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'Password1',
        role: 'staff',
      });
      expect(mockPush).toHaveBeenCalledWith('/users');
    });
  });

  it('shows error toast when API call fails', async () => {
    const { toast } = await import('sonner');
    vi.mocked(usersService.create).mockRejectedValue(
      Object.assign(new Error('API Error'), { response: { data: { message: 'Failed to create user' } } })
    );

    renderPage();

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Smith' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password1' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password1' } });

    fireEvent.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('navigates back to /users when Cancel is clicked', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockPush).toHaveBeenCalledWith('/users');
  });

  it('navigates back to /users when back arrow is clicked', () => {
    renderPage();
    fireEvent.click(screen.getByLabelText(/back to users/i));
    expect(mockPush).toHaveBeenCalledWith('/users');
  });
});
