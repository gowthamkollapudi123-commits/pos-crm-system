/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Password Reset Request Page Tests
 * 
 * Tests the password reset request functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import ResetPasswordPage from '../page';
import { authService } from '@/services/auth.service';
import * as notifications from '@/utils/notifications';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/services/auth.service', () => ({
  authService: {
    resetPassword: vi.fn(),
  },
}));

vi.mock('@/utils/notifications', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}));

describe('ResetPasswordPage', () => {
  const mockRouter = {
    push: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
  });

  it('renders the password reset form', () => {
    render(<ResetPasswordPage />);
    
    expect(screen.getByText('Reset your password')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset instructions/i })).toBeInTheDocument();
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });

  it('submits the form with valid email', async () => {
    const user = userEvent.setup();
    (authService.resetPassword as any).mockResolvedValue({
      success: true,
    });
    
    render(<ResetPasswordPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset instructions/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });
    
    expect(notifications.notifySuccess).toHaveBeenCalledWith(
      'Password reset email sent',
      expect.objectContaining({
        description: expect.stringContaining('Check your email'),
      })
    );
  });

  it('displays success message after email is sent', async () => {
    const user = userEvent.setup();
    (authService.resetPassword as any).mockResolvedValue({
      success: true,
    });
    
    render(<ResetPasswordPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset instructions/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });
    
    expect(screen.getByText(/we've sent password reset instructions/i)).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    (authService.resetPassword as any).mockResolvedValue({
      success: false,
      message: 'Email not found',
    });
    
    render(<ResetPasswordPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset instructions/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(notifications.notifyError).toHaveBeenCalledWith(
        'Failed to send reset email',
        expect.objectContaining({
          description: 'Email not found',
        })
      );
    });
  });

  it('allows user to try again after success', async () => {
    const user = userEvent.setup();
    (authService.resetPassword as any).mockResolvedValue({
      success: true,
    });
    
    render(<ResetPasswordPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset instructions/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });
    
    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    await user.click(tryAgainButton);
    
    // Should show the form again
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it('has a link back to login', () => {
    render(<ResetPasswordPage />);
    
    const loginLink = screen.getByText(/back to login/i);
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
