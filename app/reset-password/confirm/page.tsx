/**
 * Password Reset Confirmation Page
 * 
 * Allows users to set a new password using a reset token
 * Integrates with auth service and notification system
 * 
 * Requirements: 5.6
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { FormInput } from '@/components/ui';
import { Button } from '@/components/ui';
import { resetPasswordConfirmFormSchema, type ResetPasswordConfirmFormData } from '@/types/forms';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { authService } from '@/services/auth.service';

function ResetPasswordConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string>('');
  
  const methods = useForm<ResetPasswordConfirmFormData>({
    resolver: zodResolver(resetPasswordConfirmFormSchema),
    defaultValues: {
      token: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    // Get token from URL query parameter
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      methods.setValue('token', tokenParam);
    }
  }, [searchParams, methods]);

  const onSubmit = async (data: ResetPasswordConfirmFormData) => {
    if (!data.token) {
      notifyError('Invalid reset link', {
        description: 'The password reset link is invalid or has expired.',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authService.resetPasswordConfirm({
        token: data.token,
        newPassword: data.newPassword,
      });
      
      if (response.success) {
        notifySuccess('Password reset successful', {
          description: 'You can now log in with your new password.',
        });
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        notifyError('Failed to reset password', {
          description: response.message || 'The reset link may be invalid or expired.',
        });
      }
    } catch {
      notifyError('Failed to reset password', {
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token && searchParams.get('token') === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Invalid reset link</h2>
            <p className="mt-4 text-sm text-gray-600">
              This password reset link is invalid or has expired.
              Please request a new password reset.
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <div>
              <Link
                href="/reset-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
              >
                Request new reset link
              </Link>
            </div>
            <div>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none focus:underline"
              >
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Set new password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>
        
        <FormProvider {...methods}>
          <form className="mt-8 space-y-6" onSubmit={methods.handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <FormInput
                name="newPassword"
                label="New password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                disabled={isLoading}
              />
              
              <FormInput
                name="confirmPassword"
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                disabled={isLoading}
              />
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>Password must:</p>
                <ul className="list-disc list-inside pl-2">
                  <li>Be at least 8 characters long</li>
                  <li>Contain at least one uppercase letter</li>
                  <li>Contain at least one lowercase letter</li>
                  <li>Contain at least one number</li>
                </ul>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Resetting password...' : 'Reset password'}
              </Button>
            </div>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
              >
                Back to login
              </Link>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ResetPasswordConfirmContent />
    </Suspense>
  );
}
