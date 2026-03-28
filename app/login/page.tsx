/**
 * Login Page
 * 
 * Login form with React Hook Form and Zod validation
 * Integrates with auth service and notification system
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.7, 21.1, 21.2, 21.3, 21.4, 21.5
 */

'use client';

import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { FormInput } from '@/components/ui';
import { Button } from '@/components/ui';
import { loginFormSchema, type LoginFormData } from '@/types/forms';
import { notifySuccess, notifyError } from '@/utils/notifications';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  
  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    const result = await login({ email: data.email, password: data.password });

    if (result.success) {
      notifySuccess('Login successful', {
        description: 'Redirecting to dashboard...',
      });
      router.push('/dashboard');
    } else {
      notifyError('Login failed', {
        description: result.error || 'Invalid email or password. Please try again.',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Sign in to POS CRM
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your credentials to access your account
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
              
              <FormInput
                name="password"
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>

            <div className="text-center">
              <Link
                href="/reset-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
              >
                Forgot your password?
              </Link>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
