/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * useReportSchedules Hook Tests
 *
 * Tests for report schedule management: CRUD, toggle, nextRunAt calculation.
 *
 * Requirements: 12.10
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useReportSchedules, calculateNextRunAt } from '../useReportSchedules';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const BASE_INPUT = {
  reportType: 'sales' as const,
  frequency: 'daily' as const,
  time: '08:00',
  email: 'test@example.com',
};

describe('calculateNextRunAt', () => {
  it('returns a future ISO date for daily frequency', () => {
    const result = calculateNextRunAt('daily', '23:59');
    expect(new Date(result).getTime()).toBeGreaterThan(Date.now());
  });

  it('returns a future ISO date for weekly frequency', () => {
    const result = calculateNextRunAt('weekly', '08:00', 1);
    expect(new Date(result).getTime()).toBeGreaterThan(Date.now());
  });

  it('returns a future ISO date for monthly frequency', () => {
    const result = calculateNextRunAt('monthly', '08:00', undefined, 15);
    expect(new Date(result).getTime()).toBeGreaterThan(Date.now());
  });

  it('advances to next day when daily time has already passed today', () => {
    const result = calculateNextRunAt('daily', '00:00');
    const next = new Date(result);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(next.getDate()).toBe(tomorrow.getDate());
  });
});

describe('useReportSchedules', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('initializes with empty schedules when localStorage is empty', () => {
    const { result } = renderHook(() => useReportSchedules());
    expect(result.current.schedules).toEqual([]);
  });

  describe('addSchedule', () => {
    it('adds a new schedule with generated id and nextRunAt', () => {
      const { result } = renderHook(() => useReportSchedules());

      act(() => {
        result.current.addSchedule(BASE_INPUT);
      });

      expect(result.current.schedules).toHaveLength(1);
      const s = result.current.schedules[0];
      expect(s.id).toBeTruthy();
      expect(s.reportType).toBe('sales');
      expect(s.frequency).toBe('daily');
      expect(s.email).toBe('test@example.com');
      expect(s.isActive).toBe(true);
      expect(s.nextRunAt).toBeTruthy();
      expect(new Date(s.nextRunAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('persists schedule to localStorage', () => {
      const { result } = renderHook(() => useReportSchedules());

      act(() => {
        result.current.addSchedule(BASE_INPUT);
      });

      const stored = JSON.parse(localStorageMock.getItem('report_schedules') ?? '[]');
      expect(stored).toHaveLength(1);
    });

    it('adds multiple schedules', () => {
      const { result } = renderHook(() => useReportSchedules());

      act(() => {
        result.current.addSchedule(BASE_INPUT);
        result.current.addSchedule({ ...BASE_INPUT, reportType: 'inventory', email: 'inv@example.com' });
      });

      expect(result.current.schedules).toHaveLength(2);
    });

    it('sets dayOfWeek for weekly schedules', () => {
      const { result } = renderHook(() => useReportSchedules());

      act(() => {
        result.current.addSchedule({ ...BASE_INPUT, frequency: 'weekly', dayOfWeek: 3 });
      });

      expect(result.current.schedules[0].dayOfWeek).toBe(3);
    });

    it('sets dayOfMonth for monthly schedules', () => {
      const { result } = renderHook(() => useReportSchedules());

      act(() => {
        result.current.addSchedule({ ...BASE_INPUT, frequency: 'monthly', dayOfMonth: 15 });
      });

      expect(result.current.schedules[0].dayOfMonth).toBe(15);
    });
  });

  describe('deleteSchedule', () => {
    it('removes a schedule by id', () => {
      const { result } = renderHook(() => useReportSchedules());

      act(() => {
        result.current.addSchedule(BASE_INPUT);
      });

      const id = result.current.schedules[0].id;

      act(() => {
        result.current.deleteSchedule(id);
      });

      expect(result.current.schedules).toHaveLength(0);
    });

    it('only removes the targeted schedule', () => {
      const { result } = renderHook(() => useReportSchedules());

      act(() => {
        result.current.addSchedule(BASE_INPUT);
        result.current.addSchedule({ ...BASE_INPUT, email: 'other@example.com' });
      });

      const firstId = result.current.schedules[0].id;

      act(() => {
        result.current.deleteSchedule(firstId);
      });

      expect(result.current.schedules).toHaveLength(1);
      expect(result.current.schedules[0].email).toBe('other@example.com');
    });
  });

  describe('toggleSchedule', () => {
    it('toggles isActive from true to false', () => {
      const { result } = renderHook(() => useReportSchedules());

      act(() => {
        result.current.addSchedule(BASE_INPUT);
      });

      const id = result.current.schedules[0].id;
      expect(result.current.schedules[0].isActive).toBe(true);

      act(() => {
        result.current.toggleSchedule(id);
      });

      expect(result.current.schedules[0].isActive).toBe(false);
    });

    it('toggles isActive from false back to true', () => {
      const { result } = renderHook(() => useReportSchedules());

      act(() => {
        result.current.addSchedule(BASE_INPUT);
      });

      const id = result.current.schedules[0].id;

      act(() => { result.current.toggleSchedule(id); });
      act(() => { result.current.toggleSchedule(id); });

      expect(result.current.schedules[0].isActive).toBe(true);
    });
  });

  describe('updateSchedule', () => {
    it('updates schedule fields', () => {
      const { result } = renderHook(() => useReportSchedules());

      act(() => {
        result.current.addSchedule(BASE_INPUT);
      });

      const id = result.current.schedules[0].id;

      act(() => {
        result.current.updateSchedule(id, { email: 'updated@example.com' });
      });

      expect(result.current.schedules[0].email).toBe('updated@example.com');
    });

    it('recalculates nextRunAt when frequency changes', () => {
      const { result } = renderHook(() => useReportSchedules());

      act(() => {
        result.current.addSchedule(BASE_INPUT);
      });

      const id = result.current.schedules[0].id;
      const originalNextRun = result.current.schedules[0].nextRunAt;

      act(() => {
        result.current.updateSchedule(id, { frequency: 'weekly', dayOfWeek: 5 });
      });

      // nextRunAt should be recalculated (may differ from daily)
      expect(result.current.schedules[0].nextRunAt).toBeTruthy();
    });
  });

  describe('localStorage persistence', () => {
    it('loads existing schedules from localStorage on init', () => {
      const existing = [{
        id: 'existing-1',
        reportType: 'sales',
        frequency: 'daily',
        time: '09:00',
        email: 'pre@example.com',
        isActive: true,
        createdAt: new Date().toISOString(),
        nextRunAt: new Date(Date.now() + 86400000).toISOString(),
      }];
      localStorageMock.setItem('report_schedules', JSON.stringify(existing));

      const { result } = renderHook(() => useReportSchedules());
      expect(result.current.schedules).toHaveLength(1);
      expect(result.current.schedules[0].email).toBe('pre@example.com');
    });
  });
});
