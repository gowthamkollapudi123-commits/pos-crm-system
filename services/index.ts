/**
 * Services Index
 * 
 * Central export point for all API service modules.
 * All services use the configured Axios client with tenant ID injection
 * and automatic token refresh.
 */

export { authService } from './auth.service';
export { productsService } from './products.service';
export { customersService } from './customers.service';
export { ordersService } from './orders.service';
export { leadsService } from './leads.service';
export { reportsService } from './reports.service';
export { settingsService } from './settings.service';
export { usersService } from './users.service';
export { dashboardService } from './dashboard.service';
export { activityLogService, logAuth, logTransaction, logInventory, logConfig } from './activity-log.service';
export type { LogActivityEntry, ActivityLogFilters } from './activity-log.service';

// Export offline manager utilities
export {
  OfflineManager,
  NetworkMonitor,
  SyncQueueManager,
  ConflictResolver,
  getOfflineManager,
  resetOfflineManager,
} from './offline.service';

export type {
  SyncResult,
  SyncApiClient,
  ExtendedSyncQueueItem,
} from './offline.service';
