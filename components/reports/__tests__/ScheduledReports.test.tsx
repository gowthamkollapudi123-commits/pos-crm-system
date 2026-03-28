/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ScheduledReports Component Tests
 *
 * Tests for the scheduled reports UI: list display, add modal, toggle, delete.
 *
 * Requirements: 12.10
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScheduledReports } from '../ScheduledReports';

// Mock the hook so we control state
const mockSchedules: any[] = [];
const mockAddSchedule = vi.fn();
const mockDeleteSchedule = vi.fn();
const mockToggleSchedule = vi.fn();
const mockUpdateSchedule = vi.fn();

vi.mock('@/hooks/useReportSchedules', () => ({
  useReportSchedules: () => ({
    schedules: mockSchedules,
    addSchedule: mockAddSchedule,
    deleteSchedule: mockDeleteSchedule,
    toggleSchedule: mockToggleSchedule,
    updateSchedule: mockUpdateSchedule,
  }),
}));

const SAMPLE_SCHEDULE = {
  id: 'sched-1',
  reportType: 'sales' as const,
  frequency: 'daily' as const,
  time: '08:00',
  email: 'reports@example.com',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  nextRunAt: new Date(Date.now() + 86400000).toISOString(),
};

describe('ScheduledReports', () => {
  beforeEach(() => {
    mockSchedules.length = 0;
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    it('shows empty state when no schedules exist', () => {
      render(<ScheduledReports />);
      expect(screen.getByText('No schedules configured')).toBeInTheDocument();
    });

    it('shows Add Schedule button', () => {
      render(<ScheduledReports />);
      expect(screen.getByRole('button', { name: /add schedule/i })).toBeInTheDocument();
    });
  });

  describe('Schedule List', () => {
    beforeEach(() => {
      mockSchedules.push(SAMPLE_SCHEDULE);
    });

    it('renders schedule table with headers', () => {
      render(<ScheduledReports />);
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Report')).toBeInTheDocument();
      expect(screen.getByText('Schedule')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Next Run')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('displays schedule details', () => {
      render(<ScheduledReports />);
      expect(screen.getByText('Sales Report')).toBeInTheDocument();
      expect(screen.getByText('reports@example.com')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('shows inactive badge for inactive schedule', () => {
      mockSchedules[0] = { ...SAMPLE_SCHEDULE, isActive: false };
      render(<ScheduledReports />);
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('calls toggleSchedule when toggle button is clicked', async () => {
      const user = userEvent.setup();
      render(<ScheduledReports />);

      const toggleBtn = screen.getByRole('button', { name: /deactivate schedule/i });
      await user.click(toggleBtn);

      expect(mockToggleSchedule).toHaveBeenCalledWith('sched-1');
    });

    it('calls deleteSchedule when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<ScheduledReports />);

      const deleteBtn = screen.getByRole('button', { name: /delete schedule/i });
      await user.click(deleteBtn);

      expect(mockDeleteSchedule).toHaveBeenCalledWith('sched-1');
    });
  });

  describe('Add Schedule Modal', () => {
    it('opens modal when Add Schedule is clicked', async () => {
      const user = userEvent.setup();
      render(<ScheduledReports />);

      await user.click(screen.getByRole('button', { name: /add schedule/i }));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Add Report Schedule')).toBeInTheDocument();
    });

    it('closes modal when Cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<ScheduledReports />);

      await user.click(screen.getByRole('button', { name: /add schedule/i }));
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shows validation error for missing email', async () => {
      const user = userEvent.setup();
      render(<ScheduledReports />);

      await user.click(screen.getByRole('button', { name: /add schedule/i }));
      await user.click(screen.getByRole('button', { name: /save schedule/i }));

      expect(screen.getByText('Valid email is required')).toBeInTheDocument();
    });

    it('calls addSchedule with correct data on valid submit', async () => {
      const user = userEvent.setup();
      render(<ScheduledReports />);

      await user.click(screen.getByRole('button', { name: /add schedule/i }));

      const emailInput = screen.getByLabelText(/delivery email/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'new@example.com');

      await user.click(screen.getByRole('button', { name: /save schedule/i }));

      expect(mockAddSchedule).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@example.com', frequency: 'daily' })
      );
    });

    it('shows day of week selector for weekly frequency', async () => {
      const user = userEvent.setup();
      render(<ScheduledReports />);

      await user.click(screen.getByRole('button', { name: /add schedule/i }));

      const freqSelect = screen.getByLabelText(/frequency/i);
      await user.selectOptions(freqSelect, 'weekly');

      expect(screen.getByLabelText(/day of week/i)).toBeInTheDocument();
    });

    it('shows day of month selector for monthly frequency', async () => {
      const user = userEvent.setup();
      render(<ScheduledReports />);

      await user.click(screen.getByRole('button', { name: /add schedule/i }));

      const freqSelect = screen.getByLabelText(/frequency/i);
      await user.selectOptions(freqSelect, 'monthly');

      expect(screen.getByLabelText(/day of month/i)).toBeInTheDocument();
    });

    it('does not show day of week selector for daily frequency', async () => {
      const user = userEvent.setup();
      render(<ScheduledReports />);

      await user.click(screen.getByRole('button', { name: /add schedule/i }));

      expect(screen.queryByLabelText(/day of week/i)).not.toBeInTheDocument();
    });
  });
});

