// Core entity type definitions
import { Role, OrderStatus, LeadStatus, PaymentMethod, PaymentStatus } from './enums';

// User and Authentication
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  user: User;
  expiresAt: string;
}

// Tenant
export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  businessInfo: BusinessInfo;
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  taxId: string;
  website?: string;
}

export interface TenantSettings {
  taxRate: number;
  currency: string;
  lowStockThreshold: number;
}

// Product and Inventory
export interface Product {
  id: string;
  tenantId: string;
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
  variants?: ProductVariant[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  attributes: Record<string, string>; // e.g., { size: 'L', color: 'Red' }
}

export interface InventoryMovement {
  id: string;
  productId: string;
  variantId?: string;
  tenantId: string;
  movementType: 'sale' | 'purchase' | 'adjustment' | 'return' | 'transfer';
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceType: 'order' | 'transaction' | 'manual';
  referenceId: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

// Customer
export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone: string;
  address?: Address;
  dateOfBirth?: string;
  notes?: string;
  segment?: string;
  lifetimeValue: number;
  totalOrders: number;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Order and Transaction
export interface Order {
  id: string;
  tenantId: string;
  orderNumber: string;
  customerId?: string;
  customer?: Customer;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentTransactionId?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  product?: Product;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
}

export interface Transaction {
  id: string;
  tenantId: string;
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// Lead and CRM
export interface Lead {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone: string;
  company?: string;
  status: LeadStatus;
  source?: string;
  notes?: string;
  estimatedValue?: number;
  assignedTo?: string;
  activities: LeadActivity[];
  followUpTasks: FollowUpTask[];
  createdAt: string;
  updatedAt: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: string;
  description: string;
  userId: string;
  createdAt: string;
}

export interface FollowUpTask {
  id: string;
  leadId: string;
  title: string;
  description?: string;
  dueDate: string;
  isCompleted: boolean;
  assignedTo: string;
  createdAt: string;
  completedAt?: string;
}

// Business Settings (stored in localStorage)
export interface BusinessSettings {
  businessName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  taxId: string;
  website?: string;
}

// Tax Settings (stored in localStorage)
export interface AdditionalTaxRate {
  name: string;
  rate: number;
}

export interface TaxSettings {
  defaultTaxRate: number;
  taxName: string;
  taxCalculationMethod: 'inclusive' | 'exclusive';
  enableTax: boolean;
  additionalRates: AdditionalTaxRate[];
}

// Receipt Template Settings (stored in localStorage)
export interface ReceiptTemplateSettings {
  headerText: string;
  footerText: string;
  showLogo: boolean;
  showBusinessAddress: boolean;
  showTaxBreakdown: boolean;
  showOrderNumber: boolean;
  receiptTitle: string;
  paperSize: '58mm' | '80mm' | 'A4';
}

// Payment Gateway Settings (stored in localStorage)
export type PaymentGatewayMode = 'test' | 'live';
export type PaymentGatewayCurrency = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface PaymentGatewaySettings {
  mode: PaymentGatewayMode;
  testKeyId: string;
  testKeySecret: string;
  liveKeyId: string;
  liveKeySecret: string;
  currency: PaymentGatewayCurrency;
  enableRazorpay: boolean;
}

// Notification Settings (stored in localStorage)
export interface NotificationSettings {
  lowStockAlerts: boolean;
  failedSyncNotifications: boolean;
  transactionCompletion: boolean;
  overdueFollowUpTasks: boolean;
  emailNotifications: boolean;
  browserNotifications: boolean;
  notificationEmail: string;
}

// Inventory Settings (stored in localStorage)
export interface InventorySettings {
  lowStockThreshold: number;
  autoReorder: boolean;
  autoReorderQuantity?: number;
  trackInventoryMovements: boolean;
  allowNegativeStock: boolean;
}

// Branding Settings (stored in localStorage)
export interface BrandingSettings {
  logo?: string; // base64 data URL
  primaryColor: string;
  secondaryColor: string;
}

// Activity Log
export interface ActivityLog {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  type: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// Report Schedule
export interface ReportSchedule {
  id: string;
  reportType: 'sales' | 'inventory' | 'customer' | 'product-performance' | 'payment-method' | 'profit-loss';
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:mm format
  email: string;
  isActive: boolean;
  createdAt: string;
  lastRunAt?: string;
  nextRunAt: string;
}
