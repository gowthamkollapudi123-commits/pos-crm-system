/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Password Reset Request Page
 * 
 * Allows users to request a password reset by entering their email
 * Integrates with auth service and notification system
 * 
 * Requirements: 5.6
 */

'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { FormInput } from '@/components/ui';
import { Button } from '@/components/ui';
import { resetPasswordFormSchema, type ResetPasswordFormData } from '@/types/forms';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { authService } from '@/services/auth.service';

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const methods = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    
    try {
      const response = await authService.resetPassword({ email: data.email });
      
      if (response.success) {
        setEmailSent(true);
        notifySuccess('Password reset email sent', {
          description: 'Check your email for instructions to reset your password.',
        });
      } else {
        notifyError('Failed to send reset email', {
          description: response.message || 'Please try again later.',
        });
      }
    } catch (error) {
      notifyError('Failed to send reset email', {
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Check your email</h2>
            <p className="mt-4 text-sm text-gray-600">
              We&apos;ve sent password reset instructions to your email address.
              Please check your inbox and follow the link to reset your password.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setEmailSent(false)}
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
              >
                try again
              </button>
              .
            </p>
          </div>
          
          <div className="text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
            >
              Back to login
            </Link>
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
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we&apos;ll send you instructions to reset your password
          </p>
        </div>
        
        <FormProvider {...methods}>
          <form className="mt-8 space-y-6" onSubmit={methods.handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <FormInput
                name="email"
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Sending...' : 'Send reset instructions'}
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
