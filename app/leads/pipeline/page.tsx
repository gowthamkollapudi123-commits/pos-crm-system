/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Lead Pipeline Kanban Board Page
 * 
 * Displays leads in a kanban board view with drag-and-drop functionality.
 * Shows conversion rate metrics and allows moving leads between status columns.
 * Updates lead status when cards are moved to different columns.
 * 
 * Requirements: 9.7, 9.10
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useAuth } from '@/hooks';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { leadsService } from '@/services/leads.service';
import { Lead } from '@/types/entities';
import { LeadStatus } from '@/types/enums';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { ArrowLeftIcon, TrendingUpIcon } from 'lucide-react';

// Column configuration for kanban board
const COLUMNS = [
  { id: LeadStatus.NEW, label: 'New', color: 'bg-blue-100 border-blue-300' },
  { id: LeadStatus.CONTACTED, label: 'Contacted', color: 'bg-purple-100 border-purple-300' },
  { id: LeadStatus.QUALIFIED, label: 'Qualified', color: 'bg-indigo-100 border-indigo-300' },
  { id: LeadStatus.PROPOSAL, label: 'Proposal', color: 'bg-yellow-100 border-yellow-300' },
  { id: LeadStatus.NEGOTIATION, label: 'Negotiation', color: 'bg-orange-100 border-orange-300' },
  { id: LeadStatus.WON, label: 'Won', color: 'bg-green-100 border-green-300' },
  { id: LeadStatus.LOST, label: 'Lost', color: 'bg-red-100 border-red-300' },
];

export default function LeadPipelinePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { logout } = useAuth();
  const { isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();

  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<LeadStatus | null>(null);

  // Fetch all leads
  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads', 'all'],
    queryFn: async () => {
      const response = await leadsService.getAll({
        pageSize: 1000, // Get all leads for kanban view
      });
      return response;
    },
    enabled: isAuthenticated,
  });

  // Fetch conversion metrics
  const { data: metricsData } = useQuery({
    queryKey: ['leads', 'metrics'],
    queryFn: async () => {
      const response = await leadsService.getConversionMetrics();
      return response.data;
    },
    enabled: isAuthenticated,
  });

  // Update lead status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: LeadStatus }) => {
      const response = await leadsService.update(leadId, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead status updated successfully');
    },
    onError: (error: any) => {
      console.error('Failed to update lead status:', error);
      toast.error(error.response?.data?.message || 'Failed to update lead status');
    },
  });

  // Group leads by status
  const leadsByStatus = leadsData?.data.reduce<Record<LeadStatus, Lead[]>>((acc, lead) => {
    if (!acc[lead.status]) {
      acc[lead.status] = [];
    }
    acc[lead.status].push(lead);
    return acc;
  }, {} as Record<LeadStatus, Lead[]>) || {} as Record<LeadStatus, Lead[]>;

  // Calculate metrics per stage
  const stageMetrics = COLUMNS.map(column => {
    const leads = leadsByStatus[column.id] || [];
    const totalValue = leads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);
    return {
      status: column.id,
      label: column.label,
      count: leads.length,
      totalValue,
    };
  });

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: LeadStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedLead || draggedLead.status === targetStatus) {
      setDraggedLead(null);
      return;
    }

    if (!isOnline) {
      toast.error('Cannot update lead status while offline');
      setDraggedLead(null);
      return;
    }

    // Optimistic update
    const previousLeads = leadsData?.data;
    queryClient.setQueryData(['leads', 'all'], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        data: old.data.map((lead: Lead) =>
          lead.id === draggedLead.id ? { ...lead, status: targetStatus } : lead
        ),
      };
    });

    try {
      await updateStatusMutation.mutateAsync({
        leadId: draggedLead.id,
        status: targetStatus,
      });
    } catch (error) {
      // Revert on error
      queryClient.setQueryData(['leads', 'all'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: previousLeads,
        };
      });
    }

    setDraggedLead(null);
  };

  const handleCardClick = (leadId: string) => {
    router.push(`/leads/${leadId}`);
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/leads')}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Leads
              </button>
              <h1 className="text-xl font-bold text-gray-900">Lead Pipeline</h1>
            </div>
            <div className="flex items-center space-x-4">
              <OfflineIndicator />
              <span className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{user.name}</span>
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Metrics Section */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUpIcon className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Conversion Metrics</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Overall Conversion Rate */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-1">Overall Conversion Rate</p>
                <p className="text-3xl font-bold text-blue-700">
                  {metricsData?.conversionRate ? `${metricsData.conversionRate.toFixed(1)}%` : '0%'}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {metricsData?.convertedLeads || 0} of {metricsData?.totalLeads || 0} leads won
                </p>
              </div>

              {/* Total Leads */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <p className="text-sm font-medium text-purple-900 mb-1">Total Leads</p>
                <p className="text-3xl font-bold text-purple-700">
                  {leadsData?.pagination.totalItems || 0}
                </p>
                <p className="text-xs text-purple-600 mt-1">Active in pipeline</p>
              </div>

              {/* Won Leads */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <p className="text-sm font-medium text-green-900 mb-1">Won Leads</p>
                <p className="text-3xl font-bold text-green-700">
                  {(leadsByStatus[LeadStatus.WON] || []).length}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  ₹{(leadsByStatus[LeadStatus.WON] || [])
                    .reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0)
                    .toLocaleString('en-IN')}
                </p>
              </div>

              {/* Lost Leads */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                <p className="text-sm font-medium text-red-900 mb-1">Lost Leads</p>
                <p className="text-3xl font-bold text-red-700">
                  {(leadsByStatus[LeadStatus.LOST] || []).length}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  ₹{(leadsByStatus[LeadStatus.LOST] || [])
                    .reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0)
                    .toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="bg-white rounded-lg shadow p-4">
          {leadsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading pipeline...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="inline-flex gap-4 min-w-full pb-4">
                {COLUMNS.map((column) => {
                  const columnLeads = leadsByStatus[column.id] || [];
                  const metrics = stageMetrics.find(m => m.status === column.id);
                  const isDragOver = dragOverColumn === column.id;

                  return (
                    <div
                      key={column.id}
                      className="flex-shrink-0 w-80"
                      onDragOver={(e) => handleDragOver(e, column.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, column.id)}
                    >
                      {/* Column Header */}
                      <div className={`rounded-t-lg border-2 ${column.color} p-3`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{column.label}</h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-gray-700">
                            {metrics?.count || 0}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          Total: ₹{(metrics?.totalValue || 0).toLocaleString('en-IN')}
                        </div>
                      </div>

                      {/* Column Content */}
                      <div
                        className={`min-h-[500px] border-2 border-t-0 rounded-b-lg p-2 space-y-2 transition-colors ${
                          isDragOver ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        {columnLeads.length === 0 ? (
                          <div className="flex items-center justify-center h-32 text-sm text-gray-400">
                            No leads
                          </div>
                        ) : (
                          columnLeads.map((lead) => (
                            <div
                              key={lead.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, lead)}
                              onDragEnd={handleDragEnd}
                              onClick={() => handleCardClick(lead.id)}
                              className={`bg-white rounded-lg border border-gray-200 p-3 cursor-move hover:shadow-md transition-shadow ${
                                draggedLead?.id === lead.id ? 'opacity-50' : ''
                              }`}
                            >
                              <h4 className="font-medium text-gray-900 mb-1 truncate">
                                {lead.name}
                              </h4>
                              {lead.company && (
                                <p className="text-xs text-gray-600 mb-2 truncate">
                                  {lead.company}
                                </p>
                              )}
                              {lead.estimatedValue && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-500">Est. Value:</span>
                                  <span className="font-semibold text-gray-900">
                                    ₹{lead.estimatedValue.toLocaleString('en-IN')}
                                  </span>
                                </div>
                              )}
                              <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                                {lead.phone}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Offline Warning */}
        {!isOnline && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              You are currently offline. Drag-and-drop updates require an internet connection.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
