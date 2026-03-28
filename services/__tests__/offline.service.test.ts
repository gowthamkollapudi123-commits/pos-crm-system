/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Offline Service Tests
 * 
 * Tests for offline manager functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  NetworkMonitor,
  SyncQueueManager,
  ConflictResolver,
  OfflineManager,
  SyncApiClient,
} from '../offline.service';

describe('NetworkMonitor', () => {
  let monitor: NetworkMonitor;

  beforeEach(() => {
    monitor = new NetworkMonitor();
  });

  afterEach(() => {
    monitor.stop();
  });

  it('should detect initial online status', () => {
    expect(monitor.isOnline()).toBe(navigator.onLine);
  });

  it('should notify listeners on status change', () => {
    const callback = vi.fn();
    monitor.subscribe(callback);
    monitor.start();

    // Initial notification
    expect(callback).toHaveBeenCalledWith(navigator.onLine);
  });

  it('should allow unsubscribe', () => {
    const callback = vi.fn();
    const unsubscribe = monitor.subscribe(callback);
    
    unsubscribe();
    monitor.start();

    // Should not be called after unsubscribe
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('ConflictResolver', () => {
  let resolver: ConflictResolver;

  beforeEach(() => {
    resolver = new ConflictResolver();
  });

  it('should resolve using last-write-wins strategy', () => {
    const local = {
      id: '1',
      name: 'Local',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    const remote = {
      id: '1',
      name: 'Remote',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const result = resolver.resolve(local, remote);
    expect(result).toBe(local); // Local is newer
  });

  it('should prefer remote when remote is newer', () => {
    const local = {
      id: '1',
      name: 'Local',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const remote = {
      id: '1',
      name: 'Remote',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    const result = resolver.resolve(local, remote);
    expect(result).toBe(remote); // Remote is newer
  });

  it('should use createdAt if updatedAt is missing', () => {
    const local = {
      id: '1',
      name: 'Local',
      createdAt: '2024-01-02T00:00:00Z',
    };

    const remote = {
      id: '1',
      name: 'Remote',
      createdAt: '2024-01-01T00:00:00Z',
    };

    const result = resolver.resolve(local, remote);
    expect(result).toBe(local);
  });
});

describe('SyncQueueManager', () => {
  let manager: SyncQueueManager;

  beforeEach(() => {
    manager = new SyncQueueManager();
  });

  it('should generate unique IDs for queue items', () => {
    const id1 = (manager as any).generateId();
    const id2 = (manager as any).generateId();
    
    expect(id1).not.toBe(id2);
  });
});

describe('OfflineManager', () => {
  let offlineManager: OfflineManager;

  beforeEach(() => {
    offlineManager = new OfflineManager();
  });

  afterEach(() => {
    offlineManager.cleanup();
  });

  it('should initialize with network monitor', () => {
    const monitor = offlineManager.getNetworkMonitor();
    expect(monitor).toBeInstanceOf(NetworkMonitor);
  });

  it('should initialize with sync queue manager', () => {
    const syncManager = offlineManager.getSyncQueueManager();
    expect(syncManager).toBeInstanceOf(SyncQueueManager);
  });

  it('should initialize with conflict resolver', () => {
    const resolver = offlineManager.getConflictResolver();
    expect(resolver).toBeInstanceOf(ConflictResolver);
  });

  it('should have auto-sync enabled by default', () => {
    expect(offlineManager.isAutoSyncEnabled()).toBe(true);
  });

  it('should allow disabling auto-sync', () => {
    offlineManager.setAutoSync(false);
    expect(offlineManager.isAutoSyncEnabled()).toBe(false);
  });
});
