// Form validation schema types
// These types represent the shape of form data before submission

import { z } from 'zod';

// ============================================================================
// Custom Validators
// ============================================================================

/**
 * Email validator - RFC 5322 compliant
 * Validates email format according to RFC 5322 standard
 * Requirements: 21.8
 */
export const emailValidator = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .regex(
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    'Email must be RFC 5322 compliant'
  );

/**
 * Phone number validator - E.164 format
 * Validates phone numbers in international E.164 format
 * Requirements: 21.9
 */
export const phoneValidator = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^\+[1-9]\d{6,14}$/, 'Phone number must be in E.164 format (e.g., +1234567890)');

/**
 * Password strength validator
 * Requires minimum 8 characters with at least one uppercase, one lowercase, and one number
 * Requirements: 5.7, 14.10, 21.10
 */
export const passwordValidator = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

/**
 * Optional email validator - allows empty string or valid email
 */
export const optionalEmailValidator = z
  .string()
  .email('Invalid email format')
  .optional()
  .or(z.literal(''));

/**
 * Optional phone validator - allows empty string or valid phone
 */
export const optionalPhoneValidator = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, 'Phone number must be in E.164 format')
  .optional()
  .or(z.literal(''));

// ============================================================================
// Authentication Forms
// ============================================================================

export const loginFormSchema = z.object({
  email: emailValidator,
  password: z.string().min(1, 'Password is required'),
  tenantId: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

export const resetPasswordFormSchema = z.object({
  email: emailValidator,
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;

export const resetPasswordConfirmFormSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    newPassword: passwordValidator,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type ResetPasswordConfirmFormData = z.infer<typeof resetPasswordConfirmFormSchema>;

// ============================================================================
// User Management Forms
// ============================================================================

export const createUserFormSchema = z.object({
  email: emailValidator,
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['admin', 'manager', 'staff'], {
    message: 'Role must be admin, manager, or staff',
  }),
  password: passwordValidator,
});

export type CreateUserFormData = z.infer<typeof createUserFormSchema>;

export const updateUserFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  role: z
    .enum(['admin', 'manager', 'staff'], {
      message: 'Role must be admin, manager, or staff',
    })
    .optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserFormData = z.infer<typeof updateUserFormSchema>;

// ============================================================================
// Product Forms
// ============================================================================

/**
 * Product variant validation schema
 * Requirements: 11.11
 */
export const productVariantSchema = z.object({
  name: z.string().min(1, 'Variant name is required').max(100, 'Variant name must be less than 100 characters'),
  value: z.string().min(1, 'Variant value is required').max(100, 'Variant value must be less than 100 characters'),
});

export type ProductVariantFormData = z.infer<typeof productVariantSchema>;

/**
 * Product form validation schema
 * Validates SKU format (alphanumeric with hyphens), price format, stock quantity
 * Requirements: 11.2, 11.10, 11.11
 */
export const productFormSchema = z.object({
  sku: z.string()
    .min(1, 'SKU is required')
    .max(50, 'SKU must be less than 50 characters')
    .regex(/^[a-zA-Z0-9-]+$/, 'SKU must contain only letters, numbers, and hyphens'),
  name: z.string().min(2, 'Product name must be at least 2 characters').max(200, 'Product name must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional().or(z.literal('')),
  category: z.string().min(1, 'Category is required'),
  subCategory: z.string().optional().or(z.literal('')),
  price: z.number()
    .positive('Price must be positive')
    .max(999999.99, 'Price is too large')
    .refine((val) => {
      const decimalPlaces = (val.toString().split('.')[1] || '').length;
      return decimalPlaces <= 2;
    }, 'Price must have at most 2 decimal places'),
  costPrice: z.number()
    .positive('Cost price must be positive')
    .max(999999.99, 'Cost price is too large')
    .optional()
    .or(z.nan().transform(() => undefined)),
  stockQuantity: z.number().int('Stock quantity must be a whole number').min(0, 'Stock quantity cannot be negative'),
  minStockLevel: z.number().int('Minimum stock level must be a whole number').min(0, 'Minimum stock level cannot be negative'),
  barcode: z.string().max(50, 'Barcode must be less than 50 characters').optional().or(z.literal('')),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  variants: z.array(productVariantSchema).optional(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;

// ============================================================================
// Customer Forms
// ============================================================================

/**
 * Address validation schema
 * Requirements: 8.8, 21.10
 */
export const addressSchema = z.object({
  street: z.string().min(5, 'Street is required').max(200, 'Street must be less than 200 characters'),
  city: z.string().min(1, 'City is required').max(100, 'City must be less than 100 characters'),
  state: z.string().min(1, 'State is required').max(100, 'State must be less than 100 characters'),
  zipCode: z.string().min(1, 'ZIP code is required').max(20, 'ZIP code must be less than 20 characters'),
  country: z.string().min(1, 'Country is required').max(100, 'Country must be less than 100 characters'),
});

export type AddressFormData = z.infer<typeof addressSchema>;

export const customerFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200, 'Name must be less than 200 characters'),
  email: optionalEmailValidator,
  phone: phoneValidator,
  address: addressSchema.optional(),
  dateOfBirth: z.string().optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

export type CustomerFormData = z.infer<typeof customerFormSchema>;

// ============================================================================
// Order Forms
// ============================================================================

export const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  variantId: z.string().optional(),
  quantity: z.number().int('Quantity must be a whole number').positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  discount: z.number().min(0, 'Discount cannot be negative').max(100, 'Discount cannot exceed 100%').optional(),
});

export type OrderItemFormData = z.infer<typeof orderItemSchema>;

export const createOrderFormSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  paymentMethod: z.enum(['cash', 'card', 'upi', 'net_banking'], {
    message: 'Payment method must be cash, card, upi, or net_banking',
  }),
  discountAmount: z.number().min(0, 'Discount cannot be negative').optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

export type CreateOrderFormData = z.infer<typeof createOrderFormSchema>;

export const updateOrderFormSchema = z.object({
  status: z
    .enum(['pending', 'processing', 'completed', 'cancelled', 'refunded'], {
      message: 'Invalid order status',
    })
    .optional(),
  paymentStatus: z
    .enum(['pending', 'success', 'failed', 'refunded'], {
      message: 'Invalid payment status',
    })
    .optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

export type UpdateOrderFormData = z.infer<typeof updateOrderFormSchema>;

// ============================================================================
// Lead Forms
// ============================================================================

export const leadFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200, 'Name must be less than 200 characters'),
  email: optionalEmailValidator,
  phone: phoneValidator,
  company: z.string().max(200, 'Company name must be less than 200 characters').optional(),
  source: z.string().max(100, 'Source must be less than 100 characters').optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  estimatedValue: z.number().positive('Estimated value must be positive').max(999999999.99, 'Estimated value is too large').optional().or(z.nan().transform(() => undefined)),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;

export const updateLeadFormSchema = leadFormSchema.extend({
  status: z
    .enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'], {
      message: 'Invalid lead status',
    })
    .optional(),
  assignedTo: z.string().optional(),
  estimatedValue: z.number().positive('Estimated value must be positive').max(999999999.99, 'Estimated value is too large').optional().or(z.nan().transform(() => undefined)),
});

export type UpdateLeadFormData = z.infer<typeof updateLeadFormSchema>;

export const followUpTaskFormSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  assignedTo: z.string().min(1, 'Assignee is required'),
});

export type FollowUpTaskFormData = z.infer<typeof followUpTaskFormSchema>;

// ============================================================================
// Settings Forms
// ============================================================================

export const businessInfoFormSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters').max(200, 'Business name must be less than 200 characters'),
  address: z.string().min(1, 'Address is required').max(200, 'Address must be less than 200 characters'),
  city: z.string().min(1, 'City is required').max(100, 'City must be less than 100 characters'),
  state: z.string().min(1, 'State is required').max(100, 'State must be less than 100 characters'),
  zipCode: z.string().min(1, 'ZIP code is required').max(20, 'ZIP code must be less than 20 characters'),
  country: z.string().min(1, 'Country is required').max(100, 'Country must be less than 100 characters'),
  phone: phoneValidator,
  email: emailValidator,
  taxId: z.string().min(1, 'Tax ID is required').max(50, 'Tax ID must be less than 50 characters'),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
});

export type BusinessInfoFormData = z.infer<typeof businessInfoFormSchema>;

export const tenantSettingsFormSchema = z.object({
  taxRate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%'),
  currency: z.string().min(1, 'Currency is required').max(10, 'Currency code must be less than 10 characters'),
  lowStockThreshold: z.number().int('Low stock threshold must be a whole number').min(0, 'Threshold cannot be negative'),
});

export type TenantSettingsFormData = z.infer<typeof tenantSettingsFormSchema>;

export const brandingFormSchema = z.object({
  logo: z.string().url('Invalid logo URL').optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (use hex color like #FF5733)'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (use hex color like #FF5733)'),
});

export type BrandingFormData = z.infer<typeof brandingFormSchema>;

// ============================================================================
// File Upload Forms
// ============================================================================

/**
 * File upload validation schema
 * Validates file type and size for CSV imports
 * Requirements: 3.4, 3.5, 25.9
 */
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
    .refine(
      (file) => ['text/csv', 'application/vnd.ms-excel', 'application/csv'].includes(file.type),
      'Only CSV files are allowed'
    ),
});

export type FileUploadFormData = z.infer<typeof fileUploadSchema>;

/**
 * Image upload validation schema
 * Validates image file type and size
 */
export const imageUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'Image size must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
      'Only JPEG, PNG, and WebP images are allowed'
    ),
});

export type ImageUploadFormData = z.infer<typeof imageUploadSchema>;

// ============================================================================
// Search and Filter Forms
// ============================================================================

export const searchFormSchema = z.object({
  query: z.string().max(200, 'Search query must be less than 200 characters').optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int('Page must be a whole number').positive('Page must be positive').optional(),
  pageSize: z.number().int('Page size must be a whole number').positive('Page size must be positive').max(100, 'Page size cannot exceed 100').optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc'], {
    message: 'Sort order must be asc or desc',
  }).optional(),
});

export type SearchFormData = z.infer<typeof searchFormSchema>;

// ============================================================================
// Discount and Promotion Forms
// ============================================================================

export const discountCodeFormSchema = z.object({
  code: z.string().min(1, 'Discount code is required').max(50, 'Discount code must be less than 50 characters'),
});

export type DiscountCodeFormData = z.infer<typeof discountCodeFormSchema>;

// ============================================================================
// Payment Forms
// ============================================================================

/**
 * Payment processing form schema
 * Requirements: 23.1-23.9
 */
export const paymentFormSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(999999999.99, 'Amount is too large'),
  paymentMethod: z.enum(['cash', 'card', 'upi', 'net_banking'], {
    message: 'Payment method must be cash, card, upi, or net_banking',
  }),
  transactionId: z.string().optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

export type PaymentFormData = z.infer<typeof paymentFormSchema>;

// ============================================================================
// Report Generation Forms
// ============================================================================

export const reportGenerationFormSchema = z.object({
  reportType: z.enum(['sales', 'inventory', 'customer', 'product', 'payment', 'profit_loss'], {
    message: 'Invalid report type',
  }),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  format: z.enum(['pdf', 'csv'], {
    message: 'Format must be pdf or csv',
  }),
  includeCharts: z.boolean().optional(),
});

export type ReportGenerationFormData = z.infer<typeof reportGenerationFormSchema>;
