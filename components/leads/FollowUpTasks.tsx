/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Follow-Up Tasks Component
 * 
 * Displays and manages follow-up tasks for a lead.
 * Allows adding new tasks and marking tasks as complete.
 */

'use client';

import { useState } from 'react';
import { format, isPast } from 'date-fns';
import { CheckCircleIcon, CircleIcon, PlusIcon, AlertTriangleIcon } from 'lucide-react';
import type { FollowUpTask } from '@/types/entities';

interface FollowUpTasksProps {
  tasks: FollowUpTask[];
  onAddTask: () => void;
  onToggleComplete: (taskId: string, isCompleted: boolean) => void;
}

export function FollowUpTasks({ tasks, onAddTask, onToggleComplete }: FollowUpTasksProps) {
  // Separate pending and completed tasks
  const pendingTasks = tasks.filter(task => !task.isCompleted);
  const completedTasks = tasks.filter(task => task.isCompleted);

  // Check if task is overdue
  const isOverdue = (task: FollowUpTask) => {
    return !task.isCompleted && isPast(new Date(task.dueDate));
  };

  const renderTask = (task: FollowUpTask) => {
    const overdue = isOverdue(task);

    return (
      <div
        key={task.id}
        className={`flex items-start gap-3 p-3 rounded-lg border ${
          overdue ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
        }`}
      >
        <button
          onClick={() => onToggleComplete(task.id, !task.isCompleted)}
          className="mt-0.5 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label={task.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {task.isCompleted ? (
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
          ) : (
            <CircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={`text-sm font-medium ${
                task.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
              }`}
            >
              {task.title}
            </h4>
            {overdue && (
              <span className="flex items-center gap-1 text-xs font-medium text-red-600 flex-shrink-0">
                <AlertTriangleIcon className="h-3 w-3" />
                Overdue
              </span>
            )}
          </div>
          {task.description && (
            <p className={`mt-1 text-sm ${task.isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
              {task.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
            <span>
              Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
            </span>
            {task.completedAt && (
              <span>
                Completed: {format(new Date(task.completedAt), 'MMM dd, yyyy')}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Add Task Button */}
      <button
        onClick={onAddTask}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <PlusIcon className="h-4 w-4" />
        Add Follow-up Task
      </button>

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Pending Tasks ({pendingTasks.length})
          </h3>
          <div className="space-y-2">
            {pendingTasks.map(renderTask)}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Completed Tasks ({completedTasks.length})
          </h3>
          <div className="space-y-2">
            {completedTasks.map(renderTask)}
          </div>
        </div>
      )}

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <CheckCircleIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No follow-up tasks yet</p>
          <p className="text-sm mt-1">Add tasks to track your follow-ups</p>
        </div>
      )}
    </div>
  );
}
