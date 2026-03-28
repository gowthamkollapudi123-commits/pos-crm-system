/* eslint-disable @typescript-eslint/no-explicit-any */
// API request and response type definitions
import {
  User,
  Tenant,
  Product,
  Customer,
  Order,
  Lead,
  ActivityLog,
  InventoryMovement,
} from './entities';

// Generic API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  timestamp: string;
}

// Authentication API types
export interface LoginRequest {
  email: string;
  password: string;
  tenantId?: string;
}

export interface LoginResponse {
  user: User;
  expiresAt: string;
}

export interface RefreshResponse {
  expiresAt: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirmRequest {
  token: string;
  newPassword: string;
}

// User API types
export interface CreateUserRequest {
  email: string;
  name: string;
  role: string;
  password: string;
}

export interface UpdateUserRequest {
  name?: string;
  role?: string;
  isActive?: boolean;
}

// Product API types
export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  category: string;
  subCategory?: string;
  price: number;
  costPrice?: number;
  stockQuantity: number;
  minStockLevel: number;
  barcode?: string;
  imageUrl?: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  category?: string;
  subCategory?: string;
  price?: number;
  costPrice?: number;
  stockQuantity?: number;
  minStockLevel?: number;
  barcode?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface BulkImportProductsRequest {
  products: CreateProductRequest[];
}

export interface BulkImportProductsResponse {
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    errors: string[];
  }>;
}

export interface UpdateStockRequest {
  quantity: number;
  movementType: 'sale' | 'purchase' | 'adjustment' | 'return' | 'transfer';
  referenceId: string;
  referenceType: 'order' | 'transaction' | 'manual';
  variantId?: string;
  notes?: string;
}

// Customer API types
export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  dateOfBirth?: string;
  notes?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  dateOfBirth?: string;
  notes?: string;
  segment?: string;
}

// Order API types
export interface CreateOrderRequest {
  customerId?: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }>;
  paymentMethod: string;
  discountAmount?: number;
  notes?: string;
}

export interface UpdateOrderRequest {
  status?: string;
  paymentStatus?: string;
  notes?: string;
}

// Lead API types
export interface CreateLeadRequest {
  name: string;
  email?: string;
  phone: string;
  company?: string;
  source?: string;
  notes?: string;
  estimatedValue?: number;
}

export interface UpdateLeadRequest {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: string;
  source?: string;
  notes?: string;
  estimatedValue?: number;
  assignedTo?: string;
}

export interface ConvertLeadToCustomerRequest {
  leadId: string;
}

export interface AddLeadActivityRequest {
  type: string;
  description: string;
}

export interface CreateFollowUpTaskRequest {
  title: string;
  description?: string;
  dueDate: string;
  assignedTo: string;
}

// Settings API types
export interface UpdateBusinessInfoRequest {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  website?: string;
}

export interface UpdateTenantSettingsRequest {
  taxRate?: number;
  currency?: string;
  lowStockThreshold?: number;
}

export interface UpdateBrandingRequest {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

// Report API types
export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
  customerId?: string;
  productId?: string;
}

export interface SalesReportResponse {
  totalSales: number;
  totalTransactions: number;
  averageOrderValue: number;
  salesByDay: Array<{
    date: string;
    sales: number;
    transactions: number;
  }>;
  salesByCategory: Array<{
    category: string;
    sales: number;
    percentage: number;
  }>;
  salesByPaymentMethod: Array<{
    method: string;
    sales: number;
    percentage: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
}

export interface InventoryReportResponse {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  productsByCategory: Array<{
    category: string;
    count: number;
    value: number;
  }>;
  lowStockProducts: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    minStockLevel: number;
  }>;
}

export interface CustomerReportResponse {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  customersBySegment: Array<{
    segment: string;
    count: number;
  }>;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    lifetimeValue: number;
    totalOrders: number;
  }>;
}

// Dashboard API types
export interface DashboardMetrics {
  sales: {
    today: number;
    week: number;
    month: number;
  };
  transactions: {
    today: number;
    week: number;
    month: number;
  };
  inventory: {
    totalValue: number;
    lowStockCount: number;
  };
  customers: {
    total: number;
    newThisMonth: number;
  };
  recentTransactions: Order[];
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  salesTrend: Array<{
    date: string;
    sales: number;
  }>;
}

// Search and Filter types
export interface SearchParams {
  query?: string;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Export types
export interface ExportRequest {
  format: 'csv' | 'pdf';
  filters?: ReportFilters;
}

export interface ExportResponse {
  url: string;
  expiresAt: string;
}
