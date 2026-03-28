/**
 * useAuth Hook
 *
 * Provides login, logout, and password reset actions.
 * Session state is managed by AuthProvider — this hook only handles action-level loading.
 */

'use client';

import { useState, useCallback } from 'react';
import { authService } from '@/services/auth.service';
import { useAuthContext } from '@/components/providers/AuthProvider';
import type { LoginRequest } from '@/types/api';

export function useAuth() {
  const { user, isAuthenticated, isLoading: sessionLoading, checkSession } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);

      if (response.success && response.data.user) {
        // Refresh the auth context so the rest of the app picks up the new user
        await checkSession();
        return { success: true };
      } else {
        const errorMessage = response.message || 'Login failed';
        return { success: false, error: errorMessage };
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string; error?: { message?: string } } } })?.response?.data?.message ||
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
        'Login failed. Please try again.';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [checkSession]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // continue regardless
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const response = await authService.resetPassword({ email });
      return { success: response.success, message: response.message };
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Password reset failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,          // action-level loading (login in progress)
    sessionLoading,     // app-level session check loading
    login,
    logout,
    resetPassword,
    checkSession,
  };
}
