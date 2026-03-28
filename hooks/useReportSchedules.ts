/**
 * useReportSchedules Hook
 *
 * Manages report schedule configuration stored in localStorage.
 * Provides CRUD operations and calculates nextRunAt based on frequency/time.
 *
 * Requirements: 12.10
 */

import { useState, useCallback } from 'react';
import { ReportSchedule } from '@/types/entities';
import { addDays, addMonths, getDay, set } from 'date-fns';

const STORAGE_KEY = 'report_schedules';

function loadSchedules(): ReportSchedule[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReportSchedule[]) : [];
  } catch {
    return [];
  }
}

function saveSchedules(schedules: ReportSchedule[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
}

/**
 * Calculates the next run time for a schedule based on frequency and time.
 */
export function calculateNextRunAt(
  frequency: ReportSchedule['frequency'],
  time: string,
  dayOfWeek?: number,
  dayOfMonth?: number
): string {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();

  let next: Date;

  if (frequency === 'daily') {
    next = set(now, { hours, minutes, seconds: 0, milliseconds: 0 });
    if (next <= now) {
      next = addDays(next, 1);
    }
  } else if (frequency === 'weekly') {
    const targetDay = dayOfWeek ?? 1; // default Monday
    const currentDay = getDay(now);
    const daysUntil = (targetDay - currentDay + 7) % 7;
    next = set(addDays(now, daysUntil), { hours, minutes, seconds: 0, milliseconds: 0 });
    if (next <= now) {
      next = addDays(next, 7);
    }
  } else {
    // monthly
    const targetDate = dayOfMonth ?? 1;
    next = set(now, { date: targetDate, hours, minutes, seconds: 0, milliseconds: 0 });
    if (next <= now) {
      next = addMonths(next, 1);
      next = set(next, { date: targetDate, hours, minutes, seconds: 0, milliseconds: 0 });
    }
  }

  return next.toISOString();
}

export function useReportSchedules() {
  const [schedules, setSchedules] = useState<ReportSchedule[]>(() => loadSchedules());

  const addSchedule = useCallback(
    (input: Omit<ReportSchedule, 'id' | 'createdAt' | 'nextRunAt' | 'isActive'>) => {
      const newSchedule: ReportSchedule = {
        ...input,
        id: `schedule_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        isActive: true,
        createdAt: new Date().toISOString(),
        nextRunAt: calculateNextRunAt(input.frequency, input.time, input.dayOfWeek, input.dayOfMonth),
      };
      setSchedules((prev) => {
        const updated = [...prev, newSchedule];
        saveSchedules(updated);
        return updated;
      });
      return newSchedule;
    },
    []
  );

  const updateSchedule = useCallback(
    (id: string, changes: Partial<Omit<ReportSchedule, 'id' | 'createdAt'>>) => {
      setSchedules((prev) => {
        const updated = prev.map((s) => {
          if (s.id !== id) return s;
          const merged = { ...s, ...changes };
          if (changes.frequency || changes.time || changes.dayOfWeek !== undefined || changes.dayOfMonth !== undefined) {
            merged.nextRunAt = calculateNextRunAt(
              merged.frequency,
              merged.time,
              merged.dayOfWeek,
              merged.dayOfMonth
            );
          }
          return merged;
        });
        saveSchedules(updated);
        return updated;
      });
    },
    []
  );

  const deleteSchedule = useCallback(
    (id: string) => {
      setSchedules((prev) => {
        const updated = prev.filter((s) => s.id !== id);
        saveSchedules(updated);
        return updated;
      });
    },
    []
  );

  const toggleSchedule = useCallback(
    (id: string) => {
      setSchedules((prev) => {
        const updated = prev.map((s) =>
          s.id === id ? { ...s, isActive: !s.isActive } : s
        );
        saveSchedules(updated);
        return updated;
      });
    },
    []
  );

  return { schedules, addSchedule, updateSchedule, deleteSchedule, toggleSchedule };
}
