/**
 * Activity Log Service
 *
 * Handles all activity logging API calls.
 * When offline, queues log entries in localStorage (key: activity_log_queue)
 * and syncs them when back online.
 *
 * Requirements: 30.1, 30.2, 30.3, 30.4, 30.5, 30.9
 */

import apiClient from '@/lib/axios';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { ActivityLog } from '@/types/entities';
import { ActivityType } from '@/types/enums';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LogActivityEntry {
  userId: string;
  userName: string;
  actionType: ActivityType;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityLogFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  actionType?: string;
  page?: number;
  pageSize?: number;
}

const QUEUE_KEY = 'activity_log_queue';

// ─── Queue helpers ─────────────────────────────────────────────────────────────

function readQueue(): ActivityLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as ActivityLog[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: ActivityLog[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function buildEntry(entry: LogActivityEntry): ActivityLog {
  return {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    tenantId: '',
    userId: entry.userId,
    userName: entry.userName,
    type: entry.actionType,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    metadata: entry.metadata,
    timestamp: new Date().toISOString(),
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const activityLogService = {
  /**
   * Log an activity entry.
   * When offline, queues the entry in localStorage for later sync.
   * Requirements: 30.1–30.5, 30.9
   */
  logActivity: async (entry: LogActivityEntry): Promise<void> => {
    const isOnline =
      typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (!isOnline) {
      const queue = readQueue();
      queue.push(buildEntry(entry));
      writeQueue(queue);
      return;
    }

    try {
      await apiClient.post<ApiResponse<ActivityLog>>('/activity-logs', {
        ...entry,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // If the request fails (e.g. network dropped mid-request), queue it
      const queue = readQueue();
      queue.push(buildEntry(entry));
      writeQueue(queue);
    }
  },

  /**
   * Fetch activity logs with optional filters.
   * Requirements: 30.6, 30.7
   */
  getAll: async (
    params?: ActivityLogFilters
  ): Promise<PaginatedResponse<ActivityLog>> => {
    const response = await apiClient.get<PaginatedResponse<ActivityLog>>(
      '/activity-logs',
      { params }
    );
    return response.data;
  },

  /**
   * Export activity logs as CSV (server-side).
   * Requirements: 30.8
   */
  exportCsv: async (params?: ActivityLogFilters): Promise<Blob> => {
    const response = await apiClient.get<Blob>('/activity-logs/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Sync queued offline log entries to the server.
   * Requirements: 30.9
   */
  syncQueue: async (): Promise<void> => {
    const queue = readQueue();
    if (queue.length === 0) return;

    const failed: ActivityLog[] = [];

    for (const entry of queue) {
      try {
        await apiClient.post<ApiResponse<ActivityLog>>('/activity-logs', entry);
      } catch {
        failed.push(entry);
      }
    }

    writeQueue(failed);
  },

  /**
   * Return the current offline queue (for testing / display).
   */
  getQueue: (): ActivityLog[] => readQueue(),

  /**
   * Clear the offline queue.
   */
  clearQueue: (): void => writeQueue([]),
};

// ─── Helper functions ─────────────────────────────────────────────────────────

/**
 * Log an authentication event (login, logout, password reset, etc.)
 * Requirement: 30.1
 */
export async function logAuth(
  userId: string,
  userName: string,
  action: string
): Promise<void> {
  return activityLogService.logActivity({
    userId,
    userName,
    actionType: ActivityType.AUTH,
    action,
    entityType: 'auth',
  });
}

/**
 * Log a transaction event (create, update, cancel, etc.)
 * Requirement: 30.2
 */
export async function logTransaction(
  userId: string,
  userName: string,
  action: string,
  entityId?: string
): Promise<void> {
  return activityLogService.logActivity({
    userId,
    userName,
    actionType: ActivityType.TRANSACTION,
    action,
    entityType: 'transaction',
    entityId,
  });
}

/**
 * Log an inventory change event (stock update, product create/edit/delete, etc.)
 * Requirement: 30.3
 */
export async function logInventory(
  userId: string,
  userName: string,
  action: string,
  entityId?: string
): Promise<void> {
  return activityLogService.logActivity({
    userId,
    userName,
    actionType: ActivityType.INVENTORY,
    action,
    entityType: 'product',
    entityId,
  });
}

/**
 * Log a configuration change event (settings update, branding, etc.)
 * Requirement: 30.4
 */
export async function logConfig(
  userId: string,
  userName: string,
  action: string
): Promise<void> {
  return activityLogService.logActivity({
    userId,
    userName,
    actionType: ActivityType.CONFIG,
    action,
    entityType: 'config',
  });
}
