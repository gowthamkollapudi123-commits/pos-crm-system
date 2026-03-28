/**
 * Activity Timeline Component
 * 
 * Displays a chronological timeline of lead activities.
 * Shows activity type, description, timestamp, and user.
 */

import { format } from 'date-fns';
import { 
  PhoneIcon, 
  MailIcon, 
  CalendarIcon, 
  MessageSquareIcon, 
  CheckCircleIcon,
  AlertCircleIcon
} from 'lucide-react';
import type { LeadActivity } from '@/types/entities';

interface ActivityTimelineProps {
  activities: LeadActivity[];
}

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Status Change': AlertCircleIcon,
  'Note Added': MessageSquareIcon,
  'Email Sent': MailIcon,
  'Call Made': PhoneIcon,
  'Meeting Scheduled': CalendarIcon,
  'Follow-up Created': CheckCircleIcon,
};

const activityColors: Record<string, string> = {
  'Status Change': 'bg-blue-100 text-blue-600',
  'Note Added': 'bg-gray-100 text-gray-600',
  'Email Sent': 'bg-purple-100 text-purple-600',
  'Call Made': 'bg-green-100 text-green-600',
  'Meeting Scheduled': 'bg-yellow-100 text-yellow-600',
  'Follow-up Created': 'bg-indigo-100 text-indigo-600',
};

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  // Sort activities by date (most recent first)
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (sortedActivities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquareIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>No activities yet</p>
        <p className="text-sm mt-1">Activity history will appear here</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {sortedActivities.map((activity, index) => {
          const Icon = activityIcons[activity.type] || MessageSquareIcon;
          const colorClass = activityColors[activity.type] || 'bg-gray-100 text-gray-600';
          const isLast = index === sortedActivities.length - 1;

          return (
            <li key={activity.id}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex items-start space-x-3">
                  <div className="relative">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white ${colorClass}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{activity.type}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {format(new Date(activity.createdAt), 'MMM dd, yyyy • h:mm a')}
                      </p>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      <p>{activity.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
