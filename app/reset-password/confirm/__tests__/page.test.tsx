/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Password Reset Confirmation Page Tests
 * 
 * Tests the password reset confirmation functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import ResetPasswordConfirmPage from '../page';
import { authService } from '@/services/auth.service';
import * as notifications from '@/utils/notifications';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('@/services/auth.service', () => ({
  authService: {
    resetPasswordConfirm: vi.fn(),
  },
}));

vi.mock('@/utils/notifications', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}));

describe('ResetPasswordConfirmPage', () => {
  const mockRouter = {
    push: vi.fn(),
  };

  const mockSearchParams = {
    get: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (useSearchParams as any).mockReturnValue(mockSearchParams);
  });

  it('renders the password reset form with valid token', () => {
    mockSearchParams.get.mockReturnValue('valid-token-123');
    
    render(<ResetPasswordConfirmPage />);
    
    expect(screen.getByText('Set new password')).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  it('displays error when token is missing', () => {
    mockSearchParams.get.mockReturnValue(null);
    
    render(<ResetPasswordConfirmPage />);
    
    expect(screen.getByText('Invalid reset link')).toBeInTheDocument();
    expect(screen.getByText(/this password reset link is invalid or has expired/i)).toBeInTheDocument();
  });

  it('validates password requirements', async () => {
    const user = userEvent.setup();
    mockSearchParams.get.mockReturnValue('valid-token-123');
    
    render(<ResetPasswordConfirmPage />);
    
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    // Try with weak password
    await user.type(newPasswordInput, 'weak');
    await user.type(confirmPasswordInput, 'weak');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
    
    expect(authService.resetPasswordConfirm).not.toHaveBeenCalled();
  });

  it('validates password match', async () => {
    const user = userEvent.setup();
    mockSearchParams.get.mockReturnValue('valid-token-123');
    
    render(<ResetPasswordConfirmPage />);
    
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    await user.type(newPasswordInput, 'ValidPass123');
    await user.type(confirmPasswordInput, 'DifferentPass123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
    
    expect(authService.resetPasswordConfirm).not.toHaveBeenCalled();
  });

  it('submits the form with valid passwords', async () => {
    const user = userEvent.setup();
    mockSearchParams.get.mockReturnValue('valid-token-123');
    (authService.resetPasswordConfirm as any).mockResolvedValue({
      success: true,
    });
    
    render(<ResetPasswordConfirmPage />);
    
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    await user.type(newPasswordInput, 'ValidPass123');
    await user.type(confirmPasswordInput, 'ValidPass123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(authService.resetPasswordConfirm).toHaveBeenCalledWith({
        token: 'valid-token-123',
        newPassword: 'ValidPass123',
      });
    });
    
    expect(notifications.notifySuccess).toHaveBeenCalledWith(
      'Password reset successful',
      expect.objectContaining({
        description: expect.stringContaining('log in with your new password'),
      })
    );
  });

  it('displays password requirements', () => {
    mockSearchParams.get.mockReturnValue('valid-token-123');
    
    render(<ResetPasswordConfirmPage />);
    
    expect(screen.getByText(/be at least 8 characters long/i)).toBeInTheDocument();
    expect(screen.getByText(/contain at least one uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/contain at least one lowercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/contain at least one number/i)).toBeInTheDocument();
  });

  it('has links to request new reset and login', () => {
    mockSearchParams.get.mockReturnValue(null);
    
    render(<ResetPasswordConfirmPage />);
    
    const requestNewLink = screen.getByText(/request new reset link/i);
    expect(requestNewLink).toBeInTheDocument();
    expect(requestNewLink).toHaveAttribute('href', '/reset-password');
    
    const loginLink = screen.getByText(/back to login/i);
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
