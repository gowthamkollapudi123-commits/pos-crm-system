/**
 * Lead Detail Page
 * 
 * Displays lead information with conversion to customer functionality.
 * Shows lead details, status, and estimated value.
 * Allows converting lead to customer with status update to "Won".
 * Displays activity timeline and follow-up tasks.
 * 
 * Requirements: 9.5, 9.6, 9.8
 */

'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { leadsService } from '@/services/leads.service';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { LeadStatus } from '@/types/enums';
import { ArrowLeftIcon, EditIcon, UserCheckIcon, BuildingIcon, PhoneIcon, MailIcon, DollarSignIcon, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ActivityTimeline } from '@/components/leads/ActivityTimeline';
import { FollowUpTasks } from '@/components/leads/FollowUpTasks';
import { AddTaskModal } from '@/components/leads/AddTaskModal';

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // Fetch lead data
  const { data: leadData, isLoading, error } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const response = await leadsService.getById(leadId);
      return response.data;
    },
    enabled: !!leadId,
  });

  // Convert lead to customer mutation
  const convertMutation = useMutation({
    mutationFn: async () => {
      const response = await leadsService.convertToCustomer({ leadId });
      return response.data;
    },
    onSuccess: (customer) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });

      toast.success('Lead converted to customer successfully');
      
      // Redirect to customer detail page
      router.push(`/customers/${customer.id}`);
    },
    onError: (error: any) => {
      console.error('Failed to convert lead:', error);
      toast.error(error.response?.data?.message || 'Failed to convert lead to customer');
    },
  });

  const handleConvert = async () => {
    setIsConverting(true);
    try {
      await convertMutation.mutateAsync();
    } catch {
      // Error is handled by mutation's onError callback
    } finally {
      setIsConverting(false);
      setShowConvertConfirm(false);
    }
  };

  // Add follow-up task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string; dueDate: string; priority: string }) => {
      const response = await leadsService.createFollowUpTask(leadId, {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        assignedTo: 'current-user', // In a real app, this would be the current user's ID
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      toast.success('Follow-up task added successfully');
      setShowAddTaskModal(false);
    },
    onError: (error: any) => {
      console.error('Failed to add task:', error);
      toast.error(error.response?.data?.message || 'Failed to add follow-up task');
    },
  });

  // Toggle task completion mutation
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, isCompleted }: { taskId: string; isCompleted: boolean }) => {
      // In a real app, this would call an API endpoint to update the task
      // For now, we'll simulate it by refetching the lead data
      return { taskId, isCompleted };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      toast.success('Task updated successfully');
    },
    onError: (error: any) => {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    },
  });

  const handleAddTask = async (data: { title: string; description?: string; dueDate: string; priority: string }) => {
    try {
      await addTaskMutation.mutateAsync(data);
    } catch {
      // Error is handled by mutation's onError callback
    }
  };

  const handleToggleTask = (taskId: string, isCompleted: boolean) => {
    toggleTaskMutation.mutate({ taskId, isCompleted });
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

  // Get status badge color
  const getStatusColor = (status: LeadStatus): string => {
    const colors: Record<LeadStatus, string> = {
      [LeadStatus.NEW]: 'bg-blue-100 text-blue-800',
      [LeadStatus.CONTACTED]: 'bg-purple-100 text-purple-800',
      [LeadStatus.QUALIFIED]: 'bg-indigo-100 text-indigo-800',
      [LeadStatus.PROPOSAL]: 'bg-yellow-100 text-yellow-800',
      [LeadStatus.NEGOTIATION]: 'bg-orange-100 text-orange-800',
      [LeadStatus.WON]: 'bg-green-100 text-green-800',
      [LeadStatus.LOST]: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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

  // Check if lead can be converted (not already Won or Lost)
  const canConvert = leadData.status !== LeadStatus.WON && leadData.status !== LeadStatus.LOST;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                <h1 className="text-2xl font-bold text-gray-900">{leadData.name}</h1>
                <p className="mt-1 text-sm text-gray-600">Lead Details</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {canConvert && (
                <button
                  onClick={() => setShowConvertConfirm(true)}
                  disabled={!isOnline}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserCheckIcon className="h-4 w-4 mr-2" />
                  Convert to Customer
                </button>
              )}
              <button
                onClick={() => router.push(`/leads/${leadId}/edit`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <EditIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Information Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Lead Information</h2>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(leadData.status)}`}>
                  {getStatusLabel(leadData.status)}
                </span>
              </div>

              <div className="space-y-4">
                {/* Company */}
                {leadData.company && (
                  <div className="flex items-start gap-3">
                    <BuildingIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Company</p>
                      <p className="text-base text-gray-900">{leadData.company}</p>
                    </div>
                  </div>
                )}

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-base text-gray-900">{leadData.phone}</p>
                  </div>
                </div>

                {/* Email */}
                {leadData.email && (
                  <div className="flex items-start gap-3">
                    <MailIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-base text-gray-900">{leadData.email}</p>
                    </div>
                  </div>
                )}

                {/* Estimated Value */}
                {leadData.estimatedValue && (
                  <div className="flex items-start gap-3">
                    <DollarSignIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Estimated Value</p>
                      <p className="text-base text-gray-900 font-semibold">
                        ₹{leadData.estimatedValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Source */}
                {leadData.source && (
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Source</p>
                      <p className="text-base text-gray-900">{leadData.source}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {leadData.notes && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{leadData.notes}</p>
              </div>
            )}

            {/* Activity Timeline */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h2>
              <ActivityTimeline activities={leadData.activities || []} />
            </div>

            {/* Follow-up Tasks */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Follow-up Tasks</h2>
              <FollowUpTasks
                tasks={leadData.followUpTasks || []}
                onAddTask={() => setShowAddTaskModal(true)}
                onToggleComplete={handleToggleTask}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Metadata Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p className="text-sm text-gray-900">{format(new Date(leadData.createdAt), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Updated</p>
                  <p className="text-sm text-gray-900">{format(new Date(leadData.updatedAt), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Lead ID</p>
                  <p className="text-sm text-gray-900 font-mono">{leadData.id}</p>
                </div>
              </div>
            </div>

            {/* Conversion Info */}
            {canConvert && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Ready to Convert?</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Converting this lead will create a customer record and update the lead status to &quot;Won&quot;.
                </p>
                <button
                  onClick={() => setShowConvertConfirm(true)}
                  disabled={!isOnline}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserCheckIcon className="h-4 w-4 mr-2" />
                  Convert to Customer
                </button>
              </div>
            )}

            {/* Already Converted */}
            {leadData.status === LeadStatus.WON && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-900 mb-2">Lead Converted</h3>
                <p className="text-sm text-green-800">
                  This lead has been successfully converted to a customer.
                </p>
              </div>
            )}

            {/* Lost Lead */}
            {leadData.status === LeadStatus.LOST && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-900 mb-2">Lead Lost</h3>
                <p className="text-sm text-red-800">
                  This lead has been marked as lost and cannot be converted.
                </p>
              </div>
            )}

            {/* Offline Warning */}
            {!isOnline && canConvert && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  You are currently offline. Lead conversion requires an internet connection.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Convert Confirmation Modal */}
      {showConvertConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Convert Lead to Customer</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will create a new customer record with the following information:
            </p>
            <div className="bg-gray-50 rounded-md p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Name:</span>
                <span className="text-gray-900 font-medium">{leadData.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Phone:</span>
                <span className="text-gray-900 font-medium">{leadData.phone}</span>
              </div>
              {leadData.email && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Email:</span>
                  <span className="text-gray-900 font-medium">{leadData.email}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-6">
              The lead status will be updated to &quot;Won&quot; and you&apos;ll be redirected to the customer detail page.
            </p>
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={() => setShowConvertConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isConverting}
              >
                Cancel
              </button>
              <button
                onClick={handleConvert}
                disabled={isConverting}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConverting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Converting...
                  </span>
                ) : (
                  'Convert to Customer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSubmit={handleAddTask}
        isSubmitting={addTaskMutation.isPending}
      />
    </div>
  );
}
