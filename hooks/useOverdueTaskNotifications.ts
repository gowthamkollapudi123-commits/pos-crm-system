/**
 * useOverdueTaskNotifications Hook
 * 
 * Shows toast notifications for newly overdue tasks on app load.
 * Uses Sonner for warning-level toasts with 5-second auto-dismiss.
 * 
 * Requirements: 9.9, 29.4, 29.5, 29.6, 29.7
 */

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useOverdueTasks } from './useOverdueTasks';

/**
 * Hook to display toast notifications for overdue tasks
 * Shows notifications once per session on initial load
 */
export function useOverdueTaskNotifications() {
  const { data: overdueTasks = [], isLoading } = useOverdueTasks();
  const hasShownNotification = useRef(false);

  useEffect(() => {
    // Only show notifications once per session and when data is loaded
    if (isLoading || hasShownNotification.current || overdueTasks.length === 0) {
      return;
    }

    // Mark as shown to prevent duplicate notifications
    hasShownNotification.current = true;

    // Show a single notification summarizing overdue tasks
    if (overdueTasks.length === 1) {
      const task = overdueTasks[0];
      toast.warning(
        `Overdue task: ${task.title} for ${task.leadName}`,
        {
          description: `Due ${task.daysOverdue} ${task.daysOverdue === 1 ? 'day' : 'days'} ago`,
          duration: 5000, // 5 seconds
        }
      );
    } else {
      toast.warning(
        `You have ${overdueTasks.length} overdue follow-up tasks`,
        {
          description: 'Click the notification bell to view details',
          duration: 5000, // 5 seconds
        }
      );
    }
  }, [overdueTasks, isLoading]);
}
