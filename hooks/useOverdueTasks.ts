/**
 * useOverdueTasks Hook
 * 
 * Custom hook to fetch and manage overdue follow-up tasks.
 * Queries all leads and identifies tasks where dueDate < current date AND isCompleted = false.
 * 
 * Requirements: 9.9, 29.4
 */

import { useQuery } from '@tanstack/react-query';
import { leadsService } from '@/services/leads.service';
import type { FollowUpTask } from '@/types/entities';

export interface OverdueTask extends FollowUpTask {
  leadName: string;
  daysOverdue: number;
}

/**
 * Hook to fetch overdue follow-up tasks
 */
export function useOverdueTasks() {
  return useQuery({
    queryKey: ['leads', 'tasks', 'overdue'],
    queryFn: async () => {
      const response = await leadsService.getOverdueTasks();
      
      // Calculate days overdue for each task
      const now = new Date();
      const tasksWithDaysOverdue: OverdueTask[] = response.data.map((task) => {
        const dueDate = new Date(task.dueDate);
        const diffTime = now.getTime() - dueDate.getTime();
        const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          id: task.leadId, // Using leadId as task id for now
          leadId: task.leadId,
          leadName: task.leadName,
          title: task.taskTitle,
          description: '',
          dueDate: task.dueDate,
          isCompleted: false,
          assignedTo: '',
          createdAt: task.dueDate,
          daysOverdue,
        };
      });
      
      return tasksWithDaysOverdue;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });
}
