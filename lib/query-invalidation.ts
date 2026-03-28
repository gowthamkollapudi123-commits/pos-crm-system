import { QueryClient } from '@tanstack/react-query';

/**
 * Query key prefixes for different data domains
 * Use these to organize and invalidate related queries
 */
export const QueryKeys = {
  // Authentication
  auth: ['auth'] as const,
  currentUser: ['auth', 'me'] as const,
  
  // Products
  products: ['products'] as const,
  product: (id: string) => ['products', id] as const,
  productSearch: (query: string) => ['products', 'search', query] as const,
  
  // Customers
  customers: ['customers'] as const,
  customer: (id: string) => ['customers', id] as const,
  customerHistory: (id: string) => ['customers', id, 'history'] as const,
  
  // Orders
  orders: ['orders'] as const,
  order: (id: string) => ['orders', id] as const,
  
  // Transactions
  transactions: ['transactions'] as const,
  transaction: (id: string) => ['transactions', id] as const,
  recentTransactions: ['transactions', 'recent'] as const,
  
  // Leads
  leads: ['leads'] as const,
  lead: (id: string) => ['leads', id] as const,
  leadActivity: (id: string) => ['leads', id, 'activity'] as const,
  
  // Dashboard
  dashboard: ['dashboard'] as const,
  dashboardMetrics: ['dashboard', 'metrics'] as const,
  dashboardCharts: ['dashboard', 'charts'] as const,
  
  // Reports
  reports: ['reports'] as const,
  salesReport: (params: Record<string, unknown>) => ['reports', 'sales', params] as const,
  inventoryReport: ['reports', 'inventory'] as const,
  
  // Settings
  settings: ['settings'] as const,
  tenantSettings: ['settings', 'tenant'] as const,
  
  // Users
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
} as const;

/**
 * Query invalidation strategies
 * These functions encapsulate common invalidation patterns
 */
export class QueryInvalidation {
  constructor(private queryClient: QueryClient) {}

  /**
   * Invalidate all product-related queries
   * Use after creating, updating, or deleting products
   */
  async invalidateProducts() {
    await this.queryClient.invalidateQueries({
      queryKey: QueryKeys.products,
    });
  }

  /**
   * Invalidate a specific product
   * Use after updating a single product
   */
  async invalidateProduct(id: string) {
    await this.queryClient.invalidateQueries({
      queryKey: QueryKeys.product(id),
    });
  }

  /**
   * Invalidate all customer-related queries
   * Use after creating, updating, or deleting customers
   */
  async invalidateCustomers() {
    await this.queryClient.invalidateQueries({
      queryKey: QueryKeys.customers,
    });
  }

  /**
   * Invalidate a specific customer and their history
   * Use after updating a customer or their transactions
   */
  async invalidateCustomer(id: string) {
    await Promise.all([
      this.queryClient.invalidateQueries({
        queryKey: QueryKeys.customer(id),
      }),
      this.queryClient.invalidateQueries({
        queryKey: QueryKeys.customerHistory(id),
      }),
    ]);
  }

  /**
   * Invalidate all order-related queries
   * Use after creating, updating, or deleting orders
   */
  async invalidateOrders() {
    await this.queryClient.invalidateQueries({
      queryKey: QueryKeys.orders,
    });
  }

  /**
   * Invalidate all transaction-related queries
   * Use after completing a transaction
   */
  async invalidateTransactions() {
    await this.queryClient.invalidateQueries({
      queryKey: QueryKeys.transactions,
    });
  }

  /**
   * Invalidate dashboard data
   * Use after any transaction or inventory change
   */
  async invalidateDashboard() {
    await this.queryClient.invalidateQueries({
      queryKey: QueryKeys.dashboard,
    });
  }

  /**
   * Invalidate all lead-related queries
   * Use after creating, updating, or deleting leads
   */
  async invalidateLeads() {
    await this.queryClient.invalidateQueries({
      queryKey: QueryKeys.leads,
    });
  }

  /**
   * Invalidate settings
   * Use after updating tenant or system settings
   */
  async invalidateSettings() {
    await this.queryClient.invalidateQueries({
      queryKey: QueryKeys.settings,
    });
  }

  /**
   * Invalidate all user-related queries
   * Use after creating, updating, or deleting users
   */
  async invalidateUsers() {
    await this.queryClient.invalidateQueries({
      queryKey: QueryKeys.users,
    });
  }

  /**
   * Invalidate all queries after tenant switch
   * Clears all cached data when switching tenants
   */
  async invalidateAllOnTenantSwitch() {
    await this.queryClient.invalidateQueries();
  }

  /**
   * Invalidate multiple related queries after a transaction
   * Use after completing a POS transaction
   */
  async invalidateAfterTransaction(customerId?: string) {
    await Promise.all([
      this.invalidateTransactions(),
      this.invalidateProducts(), // Stock levels changed
      this.invalidateDashboard(), // Metrics changed
      customerId ? this.invalidateCustomer(customerId) : Promise.resolve(),
    ]);
  }

  /**
   * Invalidate multiple related queries after inventory change
   * Use after updating product stock
   */
  async invalidateAfterInventoryChange() {
    await Promise.all([
      this.invalidateProducts(),
      this.invalidateDashboard(),
    ]);
  }
}

/**
 * Create a QueryInvalidation instance
 * Use this to access invalidation methods
 */
export function createQueryInvalidation(queryClient: QueryClient): QueryInvalidation {
  return new QueryInvalidation(queryClient);
}
