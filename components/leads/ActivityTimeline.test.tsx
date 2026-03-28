/**
 * Activity Timeline Component Tests
 * 
 * Tests for the activity timeline display component.
 */

import { render, screen } from '@testing-library/react';
import { ActivityTimeline } from './ActivityTimeline';
import type { LeadActivity } from '@/types/entities';

describe('ActivityTimeline', () => {
  const mockActivities: LeadActivity[] = [
    {
      id: 'activity-1',
      leadId: 'lead-123',
      type: 'Status Change',
      description: 'Lead status changed from New to Contacted',
      userId: 'user-1',
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'activity-2',
      leadId: 'lead-123',
      type: 'Call Made',
      description: 'Initial discovery call completed',
      userId: 'user-1',
      createdAt: '2024-01-16T14:30:00Z',
    },
    {
      id: 'activity-3',
      leadId: 'lead-123',
      type: 'Email Sent',
      description: 'Sent proposal document',
      userId: 'user-1',
      createdAt: '2024-01-17T09:15:00Z',
    },
  ];

  it('should render all activities', () => {
    render(<ActivityTimeline activities={mockActivities} />);

    expect(screen.getByText('Status Change')).toBeInTheDocument();
    expect(screen.getByText('Call Made')).toBeInTheDocument();
    expect(screen.getByText('Email Sent')).toBeInTheDocument();
  });

  it('should display activities in chronological order (most recent first)', () => {
    render(<ActivityTimeline activities={mockActivities} />);

    const descriptions = screen.getAllByText(/Lead status changed|Initial discovery call|Sent proposal/);
    expect(descriptions[0]).toHaveTextContent('Sent proposal document');
    expect(descriptions[1]).toHaveTextContent('Initial discovery call completed');
    expect(descriptions[2]).toHaveTextContent('Lead status changed from New to Contacted');
  });

  it('should display activity type and description', () => {
    render(<ActivityTimeline activities={mockActivities} />);

    expect(screen.getByText('Email Sent')).toBeInTheDocument();
    expect(screen.getByText('Sent proposal document')).toBeInTheDocument();
  });

  it('should display formatted timestamps', () => {
    render(<ActivityTimeline activities={mockActivities} />);

    expect(screen.getByText(/Jan 17, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 16, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
  });

  it('should display empty state when no activities exist', () => {
    render(<ActivityTimeline activities={[]} />);

    expect(screen.getByText('No activities yet')).toBeInTheDocument();
    expect(screen.getByText('Activity history will appear here')).toBeInTheDocument();
  });

  it('should handle different activity types', () => {
    const activities: LeadActivity[] = [
      {
        id: 'activity-1',
        leadId: 'lead-123',
        type: 'Note Added',
        description: 'Added notes about customer requirements',
        userId: 'user-1',
        createdAt: '2024-01-15T10:00:00Z',
      },
      {
        id: 'activity-2',
        leadId: 'lead-123',
        type: 'Meeting Scheduled',
        description: 'Scheduled demo for next week',
        userId: 'user-1',
        createdAt: '2024-01-16T14:30:00Z',
      },
      {
        id: 'activity-3',
        leadId: 'lead-123',
        type: 'Follow-up Created',
        description: 'Created follow-up task',
        userId: 'user-1',
        createdAt: '2024-01-17T09:15:00Z',
      },
    ];

    render(<ActivityTimeline activities={activities} />);

    expect(screen.getByText('Note Added')).toBeInTheDocument();
    expect(screen.getByText('Meeting Scheduled')).toBeInTheDocument();
    expect(screen.getByText('Follow-up Created')).toBeInTheDocument();
  });

  it('should handle unknown activity types gracefully', () => {
    const activities: LeadActivity[] = [
      {
        id: 'activity-1',
        leadId: 'lead-123',
        type: 'Unknown Type',
        description: 'Some unknown activity',
        userId: 'user-1',
        createdAt: '2024-01-15T10:00:00Z',
      },
    ];

    render(<ActivityTimeline activities={activities} />);

    expect(screen.getByText('Unknown Type')).toBeInTheDocument();
    expect(screen.getByText('Some unknown activity')).toBeInTheDocument();
  });
});
