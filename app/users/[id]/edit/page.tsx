/**
 * Edit User Page
 *
 * Form for editing existing user accounts including role assignment,
 * active status toggle, and optional password update.
 * Prevents deactivating the last Admin user.
 *
 * Requirements: 14.3, 14.4, 14.5
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usersService } from '@/services/users.service';
import { passwordValidator } from '@/types/forms';
import { Role } from '@/types/enums';
import { ArrowLeftIcon } from 'lucide-react';

const editUserFormSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().min(1, 'Email is required').email('Invalid email format'),
    role: z.enum(['admin', 'manager', 'staff'], {
      message: 'Please select a valid role',
    }),
    isActive: z.boolean(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.password && data.password.length > 0) {
        return passwordValidator.safeParse(data.password).success;
      }
      return true;
    },
    {
      message:
        'Password must be at least 8 characters with uppercase, lowercase, and a number',
      path: ['password'],
    }
  )
  .refine(
    (data) => {
      if (data.password && data.password.length > 0) {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }
  );

type EditUserFormData = z.infer<typeof editUserFormSchema>;

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Fetch user data
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await usersService.getById(userId);
      return response.data;
    },
    enabled: !!userId,
  });

  // Fetch all users to check if this is the last Admin
  const { data: allUsersData } = useQuery({
    queryKey: ['users', '', 1, 100],
    queryFn: () => usersService.getAll({ page: 1, pageSize: 100 }),
    enabled: !!userId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserFormSchema),
  });

  const isActiveValue = watch('isActive');

  // Populate form with user data
  useEffect(() => {
    if (userData) {
      reset({
        name: userData.name,
        email: userData.email,
        role: userData.role as 'admin' | 'manager' | 'staff',
        isActive: userData.isActive,
        password: '',
        confirmPassword: '',
      });
    }
  }, [userData, reset]);

  // Check if this is the last active Admin
  const isLastAdmin = (): boolean => {
    if (!allUsersData?.data || !userData) return false;
    const activeAdmins = allUsersData.data.filter(
      (u) => u.role === Role.ADMIN && u.isActive
    );
    return activeAdmins.length === 1 && activeAdmins[0].id === userId;
  };

  const updateMutation = useMutation({
    mutationFn: (data: EditUserFormData) => {
      const payload: { name?: string; role?: string; isActive?: boolean; password?: string } = {
        name: data.name,
        role: data.role,
        isActive: data.isActive,
      };
      if (data.password && data.password.length > 0) {
        payload.password = data.password;
      }
      return usersService.update(userId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      toast.success('User updated successfully');
      router.push('/users');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => usersService.deactivate(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      toast.success('User deactivated successfully');
      router.push('/users');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to deactivate user');
    },
  });

  const onSubmit = async (data: EditUserFormData) => {
    setIsSubmitting(true);
    try {
      await updateMutation.mutateAsync(data);
    } catch {
      // Error is handled by mutation's onError callback
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (isLastAdmin()) {
      toast.error('Cannot deactivate the last Admin user');
      return;
    }
    setIsDeactivating(true);
    try {
      await deactivateMutation.mutateAsync();
    } catch {
      // Error is handled by mutation's onError callback
    } finally {
      setIsDeactivating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading user...</p>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">Failed to load user</p>
          <button
            onClick={() => router.push('/users')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  const lastAdmin = isLastAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/users')}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Back to users"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
              <p className="mt-1 text-sm text-gray-600">
                Update user information and role assignment
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="bg-white shadow rounded-lg p-6 space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                  errors.name
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                aria-invalid={errors.name ? 'true' : 'false'}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email (read-only display) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                  errors.email
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                {...register('role')}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                  errors.role
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                aria-invalid={errors.role ? 'true' : 'false'}
                aria-describedby={errors.role ? 'role-error' : undefined}
              >
                <option value={Role.ADMIN}>Admin</option>
                <option value={Role.MANAGER}>Manager</option>
                <option value={Role.STAFF}>Staff</option>
              </select>
              {errors.role && (
                <p id="role-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.role.message}
                </p>
              )}
            </div>

            {/* Is Active Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="isActive" className="block text-sm font-medium text-gray-700">
                  Account Status
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isActiveValue ? 'User can log in and access the system' : 'User cannot log in'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="isActive"
                  type="checkbox"
                  {...register('isActive')}
                  className="sr-only peer"
                  aria-label="Account active status"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            {/* Password (optional update) */}
            <div className="border-t pt-5">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Change Password <span className="text-gray-400 font-normal">(optional)</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    {...register('password')}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                      errors.password
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Leave blank to keep current password"
                    aria-invalid={errors.password ? 'true' : 'false'}
                    aria-describedby={errors.password ? 'password-error' : 'password-hint'}
                  />
                  {errors.password ? (
                    <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
                      {errors.password.message}
                    </p>
                  ) : (
                    <p id="password-hint" className="mt-1 text-xs text-gray-500">
                      At least 8 characters with uppercase, lowercase, and a number
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                      errors.confirmPassword
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Re-enter new password"
                    aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                    aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                  />
                  {errors.confirmPassword && (
                    <p id="confirmPassword-error" className="mt-1 text-sm text-red-600" role="alert">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Last Admin Warning */}
          {lastAdmin && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                This is the last active Admin user. Deactivation is not allowed to prevent loss of admin access.
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between mt-6">
            {/* Deactivate button (only shown for active users) */}
            {userData.isActive && (
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={isDeactivating || lastAdmin}
                className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title={lastAdmin ? 'Cannot deactivate the last Admin user' : undefined}
              >
                {isDeactivating ? 'Deactivating...' : 'Deactivate User'}
              </button>
            )}

            <div className={`flex items-center gap-4 ${!userData.isActive ? 'ml-auto' : ''}`}>
              <button
                type="button"
                onClick={() => router.push('/users')}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
