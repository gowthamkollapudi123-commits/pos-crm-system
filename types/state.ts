/* eslint-disable @typescript-eslint/no-explicit-any */
// State management type definitions for Zustand stores

import { User, Tenant, Product, Customer, Order } from './entities';
import { SyncStatus, NotificationType } from './enums';

// UI State
export interface UIState {
  // Modal states
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;
  
  // Sidebar state
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // Loading states
  isLoading: boolean;
  loadingMessage?: string;
  
  // Actions
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
  toggleSidebar: () => void;
  collapseSidebar: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLoading: (isLoading: boolean, message?: string) => void;
}

// Tenant State
export interface TenantState {
  // Current tenant
  currentTenant: Tenant | null;
  tenantId: string | null;
  
  // Branding
  branding: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  
  // Actions
  setTenant: (tenant: Tenant) => void;
  updateBranding: (branding: Partial<TenantState['branding']>) => void;
  clearTenant: () => void;
  switchTenant: (tenantId: string) => void;
}

// Auth State
export interface AuthState {
  // User data
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Session
  sessionExpiresAt: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (expiresAt: string) => void;
  clearAuth: () => void;
  checkSession: () => Promise<boolean>;
}

// Offline State
export interface OfflineState {
  // Network status
  isOnline: boolean;
  
  // Sync status
  syncStatus: SyncStatus;
  pendingTransactionsCount: number;
  lastSyncAt: string | null;
  
  // Sync queue
  syncQueue: SyncQueueItem[];
  
  // Actions
  setOnlineStatus: (isOnline: boolean) => void;
  setSyncStatus: (status: SyncStatus) => void;
  addToSyncQueue: (item: SyncQueueItem) => void;
  removeFromSyncQueue: (id: string) => void;
  clearSyncQueue: () => void;
  updateLastSync: () => void;
  triggerSync: () => Promise<void>;
}

export interface SyncQueueItem {
  id: string;
  type: 'order' | 'customer' | 'product' | 'lead' | 'activity';
  action: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: string;
  retryCount: number;
  lastError?: string;
}

// Cart State (for POS billing)
export interface CartState {
  // Cart items
  items: CartItem[];
  
  // Customer
  customerId?: string;
  
  // Calculations
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  
  // Discount
  discountCode?: string;
  
  // Actions
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  applyDiscount: (code: string, amount: number) => void;
  removeDiscount: () => void;
  setCustomer: (customerId: string) => void;
  clearCart: () => void;
  calculateTotals: () => void;
}

export interface CartItem {
  productId: string;
  product: Product;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  totalPrice: number;
}

// Notification State
export interface NotificationState {
  // Notifications
  notifications: Notification[];
  maxNotifications: number;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  autoDismiss: boolean;
  dismissAfter?: number; // milliseconds
}

// Filter State (for lists and tables)
export interface FilterState {
  // Active filters
  filters: Record<string, FilterValue>;
  
  // Search
  searchQuery: string;
  
  // Pagination
  page: number;
  pageSize: number;
  
  // Sorting
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  
  // Actions
  setFilter: (key: string, value: FilterValue) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  setSearchQuery: (query: string) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  resetPagination: () => void;
}

export type FilterValue = string | number | boolean | string[] | number[] | DateRange;

export interface DateRange {
  startDate: string;
  endDate: string;
}

// IndexedDB Cache State
export interface CacheState {
  // Cache status
  isInitialized: boolean;
  lastUpdated: Record<string, string>; // entity type -> timestamp
  
  // Cache sizes
  cacheSizes: {
    products: number;
    customers: number;
    transactions: number;
  };
  
  // Actions
  setInitialized: (initialized: boolean) => void;
  updateCacheTimestamp: (entityType: string) => void;
  updateCacheSize: (entityType: keyof CacheState['cacheSizes'], size: number) => void;
  clearCache: () => Promise<void>;
}

// Combined Store Type (if using a single store)
export interface AppState extends UIState, TenantState, AuthState, OfflineState {
  // Combined state from all slices
}

// Store selector types
export type UISelector<T> = (state: UIState) => T;
export type TenantSelector<T> = (state: TenantState) => T;
export type AuthSelector<T> = (state: AuthState) => T;
export type OfflineSelector<T> = (state: OfflineState) => T;
export type CartSelector<T> = (state: CartState) => T;
export type NotificationSelector<T> = (state: NotificationState) => T;
export type FilterSelector<T> = (state: FilterState) => T;
export type CacheSelector<T> = (state: CacheState) => T;
