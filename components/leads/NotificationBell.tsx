/**
 * Notification Bell Component
 * 
 * Displays a notification bell icon with badge showing count of overdue tasks.
 * Includes dropdown panel showing overdue tasks with lead information.
 * 
 * Requirements: 29.4
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BellIcon, AlertTriangleIcon, XIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useOverdueTasks } from '@/hooks/useOverdueTasks';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: overdueTasks = [], isLoading } = useOverdueTasks();

  const overdueCount = overdueTasks.length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleTaskClick = (leadId: string) => {
    setIsOpen(false);
    router.push(`/leads/${leadId}`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        aria-label={`Notifications${overdueCount > 0 ? ` (${overdueCount} overdue tasks)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <BellIcon className="h-6 w-6" />
        
        {/* Badge */}
        {overdueCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[20px]">
            {overdueCount > 99 ? '99+' : overdueCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          role="dialog"
          aria-label="Overdue tasks notifications"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">
              Overdue Follow-up Tasks
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Close notifications"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading...</p>
              </div>
            ) : overdueCount === 0 ? (
              <div className="px-4 py-8 text-center">
                <BellIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-600">No overdue tasks</p>
                <p className="text-xs text-gray-500 mt-1">You&apos;re all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {overdueTasks.map((task) => (
                  <button
                    key={`${task.leadId}-${task.title}`}
                    onClick={() => handleTaskClick(task.leadId)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {task.leadName}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <span>
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
            )}
          </div>

          {/* Footer */}
          {overdueCount > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/leads');
                }}
                className="w-full text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:underline"
              >
                View all leads
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
