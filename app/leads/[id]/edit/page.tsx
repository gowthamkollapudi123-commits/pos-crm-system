/**
 * Lead Edit Page
 * 
 * Form for editing existing lead records with validation.
 * Allows updating lead status and information.
 * Validates email and phone formats.
 * 
 * Requirements: 9.4, 10.10
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { leadsService } from '@/services/leads.service';
import { updateLeadFormSchema, type UpdateLeadFormData } from '@/types/forms';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Lead } from '@/types/entities';
import { LeadStatus } from '@/types/enums';
import { ArrowLeftIcon, TrashIcon } from 'lucide-react';

export default function EditLeadPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch lead data
  const { data: leadData, isLoading, error } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const response = await leadsService.getById(leadId);
      return response.data;
    },
    enabled: !!leadId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateLeadFormData>({
    resolver: zodResolver(updateLeadFormSchema),
  });

  // Populate form with lead data
  useEffect(() => {
    if (leadData) {
      reset({
        name: leadData.name,
        email: leadData.email || '',
        phone: leadData.phone,
        company: leadData.company || '',
        status: leadData.status,
        source: leadData.source || '',
        notes: leadData.notes || '',
        estimatedValue: leadData.estimatedValue,
      });
    }
  }, [leadData, reset]);

  // Update lead mutation
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateLeadFormData) => {
      const response = await leadsService.update(leadId, data);
      return response.data;
    },
    onSuccess: async (lead: Lead) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });

      toast.success('Lead updated successfully');
      router.push('/leads');
    },
    onError: (error: any) => {
      console.error('Failed to update lead:', error);
      toast.error(error.response?.data?.message || 'Failed to update lead');
    },
  });

  // Delete lead mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await leadsService.delete(leadId);
    },
    onSuccess: () => {
      // Invalidate leads query to refresh list
      queryClient.invalidateQueries({ queryKey: ['leads'] });

      toast.success('Lead deleted successfully');
      router.push('/leads');
    },
    onError: (error: any) => {
      console.error('Failed to delete lead:', error);
      toast.error(error.response?.data?.message || 'Failed to delete lead');
    },
  });

  const onSubmit = async (data: UpdateLeadFormData) => {
    setIsSubmitting(true);

    try {
      // Clean up empty optional fields
      if (!data.email) data.email = undefined;
      if (!data.company) data.company = undefined;
      if (!data.source) data.source = undefined;
      if (!data.notes) data.notes = undefined;
      if (!data.estimatedValue) data.estimatedValue = undefined;

      await updateMutation.mutateAsync(data);
    } catch {
      // Error is handled by mutation's onError callback
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await deleteMutation.mutateAsync();
    } catch {
      // Error is handled by mutation's onError callback
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Get status label with proper formatting
  const getStatusLabel = (status: LeadStatus): string => {
    const labels: Record<LeadStatus, string> = {
      [LeadStatus.NEW]: 'New',
      [LeadStatus.CONTACTED]: 'Contacted',
      [LeadStatus.QUALIFIED]: 'Qualified',
      [LeadStatus.PROPOSAL]: 'Proposal',
      [LeadStatus.NEGOTIATION]: 'Negotiation',
      [LeadStatus.WON]: 'Won',
      [LeadStatus.LOST]: 'Lost',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lead...</p>
        </div>
      </div>
    );
  }

  if (error || !leadData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">Failed to load lead</p>
          <button
            onClick={() => router.push('/leads')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/leads')}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Back to leads"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Lead</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Update lead information and status
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              aria-label="Delete lead"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </button>
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

              {/* Company */}
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  id="company"
                  type="text"
                  {...register('company')}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                    errors.company
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Acme Corporation"
                  aria-invalid={errors.company ? 'true' : 'false'}
                  aria-describedby={errors.company ? 'company-error' : undefined}
                />
                {errors.company && (
                  <p id="company-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.company.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Lead Status Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Status</h2>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                {...register('status')}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                  errors.status
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                aria-invalid={errors.status ? 'true' : 'false'}
                aria-describedby={errors.status ? 'status-error' : undefined}
              >
                <option value={LeadStatus.NEW}>{getStatusLabel(LeadStatus.NEW)}</option>
                <option value={LeadStatus.CONTACTED}>{getStatusLabel(LeadStatus.CONTACTED)}</option>
                <option value={LeadStatus.QUALIFIED}>{getStatusLabel(LeadStatus.QUALIFIED)}</option>
                <option value={LeadStatus.PROPOSAL}>{getStatusLabel(LeadStatus.PROPOSAL)}</option>
                <option value={LeadStatus.NEGOTIATION}>{getStatusLabel(LeadStatus.NEGOTIATION)}</option>
                <option value={LeadStatus.WON}>{getStatusLabel(LeadStatus.WON)}</option>
                <option value={LeadStatus.LOST}>{getStatusLabel(LeadStatus.LOST)}</option>
              </select>
              {errors.status && (
                <p id="status-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.status.message}
                </p>
              )}
            </div>
          </div>

          {/* Lead Details Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Details</h2>
            
            <div className="space-y-4">
              {/* Source */}
              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                  Source
                </label>
                <input
                  id="source"
                  type="text"
                  {...register('source')}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                    errors.source
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Website, Referral, Cold Call, etc."
                  aria-invalid={errors.source ? 'true' : 'false'}
                  aria-describedby={errors.source ? 'source-error' : undefined}
                />
                {errors.source && (
                  <p id="source-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.source.message}
                  </p>
                )}
              </div>

              {/* Estimated Value */}
              <div>
                <label htmlFor="estimatedValue" className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Value (₹)
                </label>
                <input
                  id="estimatedValue"
                  type="number"
                  step="0.01"
                  {...register('estimatedValue', { valueAsNumber: true })}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                    errors.estimatedValue
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="50000.00"
                  aria-invalid={errors.estimatedValue ? 'true' : 'false'}
                  aria-describedby={errors.estimatedValue ? 'estimatedValue-error' : undefined}
                />
                {errors.estimatedValue && (
                  <p id="estimatedValue-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.estimatedValue.message}
                  </p>
                )}
              </div>

              {/* Notes */}
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
                  placeholder="Add any additional notes about this lead..."
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
          </div>

          {/* Offline Warning */}
          {!isOnline && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                You are currently offline. Changes will be saved when you reconnect to the internet.
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/leads')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
              aria-label="Go back to leads"
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
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Lead</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this lead? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
