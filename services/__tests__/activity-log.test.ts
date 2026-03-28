/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Activity Log Service Tests
 *
 * Tests for activity logging, offline queuing, and helper functions.
 * Requirements: 30.1, 30.2, 30.3, 30.4, 30.5, 30.9
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  activityLogService,
  logAuth,
  logTransaction,
  logInventory,
  logConfig,
} from '../activity-log.service';
import { ActivityType } from '@/types/enums';

// ─── Mock apiClient ────────────────────────────────────────────────────────────

vi.mock('@/lib/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import apiClient from '@/lib/axios';

const mockPost = vi.mocked(apiClient.post);
const mockGet = vi.mocked(apiClient.get);

// ─── localStorage mock ─────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// ─── navigator.onLine mock ─────────────────────────────────────────────────────

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true });
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('activityLogService.logActivity', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    setOnline(true);
  });

  it('posts to /activity-logs when online', async () => {
    mockPost.mockResolvedValueOnce({ data: { success: true } });

    await activityLogService.logActivity({
      userId: 'u1',
      userName: 'Alice',
      actionType: ActivityType.AUTH,
      action: 'login',
    });

    expect(mockPost).toHaveBeenCalledWith(
      '/activity-logs',
      expect.objectContaining({
        userId: 'u1',
        userName: 'Alice',
        actionType: ActivityType.AUTH,
        action: 'login',
      })
    );
  });

  it('queues entry in localStorage when offline', async () => {
    setOnline(false);

    await activityLogService.logActivity({
      userId: 'u2',
      userName: 'Bob',
      actionType: ActivityType.TRANSACTION,
      action: 'create_order',
      entityId: 'order_1',
    });

    expect(mockPost).not.toHaveBeenCalled();

    const queue = activityLogService.getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({
      userId: 'u2',
      userName: 'Bob',
      type: ActivityType.TRANSACTION,
      action: 'create_order',
      entityId: 'order_1',
    });
  });

  it('queues entry when API call fails', async () => {
    setOnline(true);
    mockPost.mockRejectedValueOnce(new Error('Network error'));

    await activityLogService.logActivity({
      userId: 'u3',
      userName: 'Carol',
      actionType: ActivityType.INVENTORY,
      action: 'stock_update',
    });

    const queue = activityLogService.getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].action).toBe('stock_update');
  });

  it('includes timestamp in queued entries', async () => {
    setOnline(false);

    const before = new Date().toISOString();
    await activityLogService.logActivity({
      userId: 'u4',
      userName: 'Dave',
      actionType: ActivityType.CONFIG,
      action: 'update_settings',
    });
    const after = new Date().toISOString();

    const queue = activityLogService.getQueue();
    expect(queue[0].timestamp >= before).toBe(true);
    expect(queue[0].timestamp <= after).toBe(true);
  });
});

describe('activityLogService.syncQueue', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    setOnline(true);
  });

  it('sends all queued entries and clears queue on success', async () => {
    setOnline(false);
    await activityLogService.logActivity({ userId: 'u1', userName: 'A', actionType: ActivityType.AUTH, action: 'login' });
    await activityLogService.logActivity({ userId: 'u2', userName: 'B', actionType: ActivityType.TRANSACTION, action: 'sale' });
    setOnline(true);

    mockPost.mockResolvedValue({ data: { success: true } });

    await activityLogService.syncQueue();

    expect(mockPost).toHaveBeenCalledTimes(2);
    expect(activityLogService.getQueue()).toHaveLength(0);
  });

  it('keeps failed entries in queue after sync attempt', async () => {
    setOnline(false);
    await activityLogService.logActivity({ userId: 'u1', userName: 'A', actionType: ActivityType.AUTH, action: 'login' });
    await activityLogService.logActivity({ userId: 'u2', userName: 'B', actionType: ActivityType.AUTH, action: 'logout' });
    setOnline(true);

    mockPost
      .mockResolvedValueOnce({ data: { success: true } })
      .mockRejectedValueOnce(new Error('Server error'));

    await activityLogService.syncQueue();

    expect(activityLogService.getQueue()).toHaveLength(1);
    expect(activityLogService.getQueue()[0].action).toBe('logout');
  });

  it('does nothing when queue is empty', async () => {
    await activityLogService.syncQueue();
    expect(mockPost).not.toHaveBeenCalled();
  });
});

describe('activityLogService.getAll', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls GET /activity-logs with filters', async () => {
    mockGet.mockResolvedValueOnce({
      data: { success: true, data: [], pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } },
    });

    const filters = { startDate: '2024-01-01', endDate: '2024-01-31', userId: 'u1' };
    await activityLogService.getAll(filters);

    expect(mockGet).toHaveBeenCalledWith('/activity-logs', { params: filters });
  });
});

describe('activityLogService.exportCsv', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls GET /activity-logs/export with blob response type', async () => {
    const blob = new Blob(['csv'], { type: 'text/csv' });
    mockGet.mockResolvedValueOnce({ data: blob });

    const result = await activityLogService.exportCsv({ startDate: '2024-01-01' });

    expect(mockGet).toHaveBeenCalledWith('/activity-logs/export', {
      params: { startDate: '2024-01-01' },
      responseType: 'blob',
    });
    expect(result).toBe(blob);
  });
});

describe('Helper functions', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    setOnline(true);
    mockPost.mockResolvedValue({ data: { success: true } });
  });

  it('logAuth posts with AUTH action type', async () => {
    await logAuth('u1', 'Alice', 'login');
    expect(mockPost).toHaveBeenCalledWith(
      '/activity-logs',
      expect.objectContaining({ actionType: ActivityType.AUTH, action: 'login', entityType: 'auth' })
    );
  });

  it('logTransaction posts with TRANSACTION action type and entityId', async () => {
    await logTransaction('u1', 'Alice', 'create_order', 'order_42');
    expect(mockPost).toHaveBeenCalledWith(
      '/activity-logs',
      expect.objectContaining({
        actionType: ActivityType.TRANSACTION,
        action: 'create_order',
        entityType: 'transaction',
        entityId: 'order_42',
      })
    );
  });

  it('logInventory posts with INVENTORY action type', async () => {
    await logInventory('u1', 'Alice', 'stock_update', 'prod_5');
    expect(mockPost).toHaveBeenCalledWith(
      '/activity-logs',
      expect.objectContaining({
        actionType: ActivityType.INVENTORY,
        entityType: 'product',
        entityId: 'prod_5',
      })
    );
  });

  it('logConfig posts with CONFIG action type', async () => {
    await logConfig('u1', 'Alice', 'update_tax_settings');
    expect(mockPost).toHaveBeenCalledWith(
      '/activity-logs',
      expect.objectContaining({
        actionType: ActivityType.CONFIG,
        action: 'update_tax_settings',
        entityType: 'config',
      })
    );
  });
});
