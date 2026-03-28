/**
 * Overdue Tasks Widget
 * 
 * Dashboard widget displaying overdue follow-up tasks.
 * Shows task details with lead information and navigation.
 * 
 * Requirements: 29.4
 */

'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { AlertTriangleIcon, CheckCircleIcon, ArrowRightIcon } from 'lucide-react';
import { useOverdueTasks } from '@/hooks/useOverdueTasks';

export function OverdueTasksWidget() {
  const router = useRouter();
  const { data: overdueTasks = [], isLoading } = useOverdueTasks();

  const handleTaskClick = (leadId: string) => {
    router.push(`/leads/${leadId}`);
  };

  const handleViewAll = () => {
    router.push('/leads');
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Overdue Follow-up Tasks
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Overdue Follow-up Tasks
        </h3>
        {overdueTasks.length > 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {overdueTasks.length} overdue
          </span>
        )}
      </div>

      {/* Content */}
      {overdueTasks.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500 mb-3" />
          <p className="text-sm text-gray-600">No overdue tasks</p>
          <p className="text-xs text-gray-500 mt-1">All follow-ups are on track!</p>
        </div>
      ) : (
        <>
          {/* Task List */}
          <div className="space-y-3 mb-4">
            {overdueTasks.slice(0, 5).map((task) => (
              <button
                key={`${task.leadId}-${task.title}`}
                onClick={() => handleTaskClick(task.leadId)}
                className="w-full text-left p-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {task.leadName}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          {task.title}
                        </p>
                      </div>
                      <ArrowRightIcon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className="text-gray-600">
                        Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                      </span>
                      <span className="text-red-600 font-medium">
                        ({task.daysOverdue} {task.daysOverdue === 1 ? 'day' : 'days'} overdue)
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* View All Link */}
          {overdueTasks.length > 5 && (
            <div className="pt-3 border-t border-gray-200">
              <button
                onClick={handleViewAll}
                className="w-full text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:underline"
              >
                View all {overdueTasks.length} overdue tasks
              </button>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleViewAll}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Manage Follow-ups
            </button>
          </div>
        </>
      )}
    </div>
  );
}
