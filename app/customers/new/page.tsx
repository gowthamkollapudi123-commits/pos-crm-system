/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Customer Creation Page
 * 
 * Form for creating new customer records with validation.
 * Validates email, phone, and address formats.
 * Caches customer data in IndexedDB for offline access.
 * 
 * Requirements: 8.2, 8.8, 15.5
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { customersService } from '@/services/customers.service';
import { customerFormSchema, type CustomerFormData } from '@/types/forms';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { create, STORES } from '@/lib/indexeddb';
import { Customer } from '@/types/entities';
import { ArrowLeftIcon } from 'lucide-react';

export default function NewCustomerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      dateOfBirth: '',
      notes: '',
    },
  });

  // Watch address fields to show/hide address section
  const hasAddress = watch('address.street') || watch('address.city');

  // Create customer mutation
  const createMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const response = await customersService.create(data);
      return response.data;
    },
    onSuccess: async (customer: Customer) => {
      // Cache customer in IndexedDB for offline access
      try {
        await create(STORES.CUSTOMERS, customer);
      } catch (error) {
        console.error('Failed to cache customer in IndexedDB:', error);
      }

      // Invalidate customers query to refresh list
      queryClient.invalidateQueries({ queryKey: ['customers'] });

      toast.success('Customer created successfully');
      router.push('/customers');
    },
    onError: (error: any) => {
      console.error('Failed to create customer:', error);
      toast.error(error.response?.data?.message || 'Failed to create customer');
    },
  });

  const onSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);

    try {
      // Clean up empty address
      if (data.address && !data.address.street && !data.address.city) {
        data.address = undefined;
      }

      // Clean up empty optional fields
      if (!data.email) data.email = undefined;
      if (!data.dateOfBirth) data.dateOfBirth = undefined;
      if (!data.notes) data.notes = undefined;

      await createMutation.mutateAsync(data);
    } catch {
      // Error is handled by mutation's onError callback
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/customers')}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Back to customers"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Customer</h1>
              <p className="mt-1 text-sm text-gray-600">
                Create a new customer record with contact information
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {/* Basic Information Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
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
                  placeholder="John Doe"
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                    errors.phone
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="+1234567890"
                  aria-invalid={errors.phone ? 'true' : 'false'}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                />
                {errors.phone && (
                  <p id="phone-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.phone.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Use E.164 format (e.g., +1234567890)
                </p>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
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
                  placeholder="john@example.com"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  {...register('dateOfBirth')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Address Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Address (Optional)</h2>
            
            <div className="space-y-4">
              {/* Street */}
              <div>
                <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-1">
                  Street
                </label>
                <input
                  id="address.street"
                  type="text"
                  {...register('address.street')}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                    errors.address?.street
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="123 Main St"
                  aria-invalid={errors.address?.street ? 'true' : 'false'}
                  aria-describedby={errors.address?.street ? 'street-error' : undefined}
                />
                {errors.address?.street && (
                  <p id="street-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.address.street.message}
                  </p>
                )}
              </div>

              {/* City and State */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    id="address.city"
                    type="text"
                    {...register('address.city')}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                      errors.address?.city
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="New York"
                    aria-invalid={errors.address?.city ? 'true' : 'false'}
                    aria-describedby={errors.address?.city ? 'city-error' : undefined}
                  />
                  {errors.address?.city && (
                    <p id="city-error" className="mt-1 text-sm text-red-600" role="alert">
                      {errors.address.city.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    id="address.state"
                    type="text"
                    {...register('address.state')}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                      errors.address?.state
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="NY"
                    aria-invalid={errors.address?.state ? 'true' : 'false'}
                    aria-describedby={errors.address?.state ? 'state-error' : undefined}
                  />
                  {errors.address?.state && (
                    <p id="state-error" className="mt-1 text-sm text-red-600" role="alert">
                      {errors.address.state.message}
                    </p>
                  )}
                </div>
              </div>

              {/* ZIP Code and Country */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="address.zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    id="address.zipCode"
                    type="text"
                    {...register('address.zipCode')}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                      errors.address?.zipCode
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="10001"
                    aria-invalid={errors.address?.zipCode ? 'true' : 'false'}
                    aria-describedby={errors.address?.zipCode ? 'zipCode-error' : undefined}
                  />
                  {errors.address?.zipCode && (
                    <p id="zipCode-error" className="mt-1 text-sm text-red-600" role="alert">
                      {errors.address.zipCode.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="address.country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    id="address.country"
                    type="text"
                    {...register('address.country')}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                      errors.address?.country
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="United States"
                    aria-invalid={errors.address?.country ? 'true' : 'false'}
                    aria-describedby={errors.address?.country ? 'country-error' : undefined}
                  />
                  {errors.address?.country && (
                    <p id="country-error" className="mt-1 text-sm text-red-600" role="alert">
                      {errors.address.country.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={4}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                  errors.notes
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="Add any additional notes about this customer..."
                aria-invalid={errors.notes ? 'true' : 'false'}
                aria-describedby={errors.notes ? 'notes-error' : undefined}
              />
              {errors.notes && (
                <p id="notes-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.notes.message}
                </p>
              )}
            </div>
          </div>

          {/* Offline Warning */}
          {!isOnline && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                You are currently offline. The customer will be created when you reconnect to the internet.
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/customers')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
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
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Customer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
