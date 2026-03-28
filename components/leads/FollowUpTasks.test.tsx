/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Follow-Up Tasks Component Tests
 * 
 * Tests for the follow-up tasks display and management component.
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FollowUpTasks } from './FollowUpTasks';
import type { FollowUpTask } from '@/types/entities';
import { vi } from 'vitest';

describe('FollowUpTasks', () => {
  const mockTasks: FollowUpTask[] = [
    {
      id: 'task-1',
      leadId: 'lead-123',
      title: 'Follow up on proposal',
      description: 'Check if they reviewed the proposal',
      dueDate: '2024-12-31T00:00:00Z',
      isCompleted: false,
      assignedTo: 'user-1',
      createdAt: '2024-01-17T10:00:00Z',
    },
    {
      id: 'task-2',
      leadId: 'lead-123',
      title: 'Schedule demo',
      description: 'Set up product demo meeting',
      dueDate: '2024-12-25T00:00:00Z',
      isCompleted: false,
      assignedTo: 'user-1',
      createdAt: '2024-01-17T10:05:00Z',
    },
    {
      id: 'task-3',
      leadId: 'lead-123',
      title: 'Send welcome email',
      description: 'Initial contact email sent',
      dueDate: '2024-01-15T00:00:00Z',
      isCompleted: true,
      assignedTo: 'user-1',
      createdAt: '2024-01-14T10:00:00Z',
      completedAt: '2024-01-15T09:00:00Z',
    },
  ];

  const mockOnAddTask = vi.fn();
  const mockOnToggleComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render "Add Follow-up Task" button', () => {
    render(
      <FollowUpTasks
        tasks={mockTasks}
        onAddTask={mockOnAddTask}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.getByText('Add Follow-up Task')).toBeInTheDocument();
  });

  it('should call onAddTask when "Add Follow-up Task" button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FollowUpTasks
        tasks={mockTasks}
        onAddTask={mockOnAddTask}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    const addButton = screen.getByText('Add Follow-up Task');
    await user.click(addButton);

    expect(mockOnAddTask).toHaveBeenCalledTimes(1);
  });

  it('should display pending tasks section', () => {
    render(
      <FollowUpTasks
        tasks={mockTasks}
        onAddTask={mockOnAddTask}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.getByText('Pending Tasks (2)')).toBeInTheDocument();
    expect(screen.getByText('Follow up on proposal')).toBeInTheDocument();
    expect(screen.getByText('Schedule demo')).toBeInTheDocument();
  });

  it('should display completed tasks section', () => {
    render(
      <FollowUpTasks
        tasks={mockTasks}
        onAddTask={mockOnAddTask}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.getByText('Completed Tasks (1)')).toBeInTheDocument();
    expect(screen.getByText('Send welcome email')).toBeInTheDocument();
  });

  it('should display task details including title, description, and due date', () => {
    render(
      <FollowUpTasks
        tasks={mockTasks}
        onAddTask={mockOnAddTask}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.getByText('Follow up on proposal')).toBeInTheDocument();
    expect(screen.getByText('Check if they reviewed the proposal')).toBeInTheDocument();
    expect(screen.getByText(/Dec 31, 2024/)).toBeInTheDocument();
  });

  it('should display overdue indicator for overdue tasks', () => {
    const overdueTasks: FollowUpTask[] = [
      {
        id: 'task-1',
        leadId: 'lead-123',
        title: 'Overdue task',
        dueDate: '2020-01-01T00:00:00Z', // Past date
        isCompleted: false,
        assignedTo: 'user-1',
        createdAt: '2024-01-17T10:00:00Z',
      },
    ];

    render(
      <FollowUpTasks
        tasks={overdueTasks}
        onAddTask={mockOnAddTask}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('should not display overdue indicator for completed tasks', () => {
    const tasks: FollowUpTask[] = [
      {
        id: 'task-1',
        leadId: 'lead-123',
        title: 'Completed overdue task',
        dueDate: '2020-01-01T00:00:00Z', // Past date
        isCompleted: true,
        assignedTo: 'user-1',
        createdAt: '2024-01-17T10:00:00Z',
        completedAt: '2024-01-18T10:00:00Z',
      },
    ];

    render(
      <FollowUpTasks
        tasks={tasks}
        onAddTask={mockOnAddTask}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
  });

  it('should call onToggleComplete when task checkbox is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FollowUpTasks
        tasks={mockTasks}
        onAddTask={mockOnAddTask}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    // Find all buttons with aria-label containing "Mark as"
    const buttons = screen.getAllByRole('button');
    const completeButton = buttons.find(btn => 
      btn.getAttribute('aria-label')?.includes('Mark as complete')
    );

    expect(completeButton).toBeDefined();
    await user.click(completeButton!);

    expect(mockOnToggleComplete).toHaveBeenCalledWith('task-1', true);
  });

  it('should call onToggleComplete with false for completed tasks', async () => {
    const user = userEvent.setup();
    render(
      <FollowUpTasks
        tasks={mockTasks}
        onAddTask={mockOnAddTask}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    // Find all buttons with aria-label containing "Mark as"
    const buttons = screen.getAllByRole('button');
    const incompleteButton = buttons.find(btn => 
      btn.getAttribute('aria-label')?.includes('Mark as incomplete')
    );

    expect(incompleteButton).toBeDefined();
    await user.click(incompleteButton!);

    expect(mockOnToggleComplete).toHaveBeenCalledWith('task-3', false);
  });

  it('should display completed date for completed tasks', () => {
    render(
      <FollowUpTasks
        tasks={mockTasks}
        onAddTask={mockOnAddTask}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.getByText(/Completed: Jan 15, 2024/)).toBeInTheDocument();
  });

  it('should display empty state when no tasks exist', () => {
    render(
      <FollowUpTasks
        tasks={[]}
        onAddTask={mockOnAddTask}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.getByText('No follow-up tasks yet')).toBeInTheDocument();
    expect(screen.getByText('Add tasks to track your follow-ups')).toBeInTheDocument();
  });

  it('should apply strikethrough styling to completed tasks', () => {
    render(
      <FollowUpTasks
        tasks={mockTasks}
        onAddTask={mockOnAddTask}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    const completedTask = screen.getByText('Send welcome email');
    expect(completedTask).toHaveClass('line-through');
  });

  it('should display tasks without description', () => {
    const tasksWithoutDescription: FollowUpTask[] = [
      {
        id: 'task-1',
        leadId: 'lead-123',
        title: 'Simple task',
        dueDate: '2024-12-31T00:00:00Z',
        isCompleted: false,
        assignedTo: 'user-1',
        createdAt: '2024-01-17T10:00:00Z',
      },
    ];

    render(
      <FollowUpTasks
        tasks={tasksWithoutDescription}
        onAddTask={mockOnAddTask}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.getByText('Simple task')).toBeInTheDocument();
  });
});
