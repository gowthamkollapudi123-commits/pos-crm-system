# Form Validation Guide

This guide provides comprehensive documentation for all Zod validation schemas used in the POS CRM System.

## Table of Contents
1. [Core Validators](#core-validators)
2. [Authentication Forms](#authentication-forms)
3. [User Management Forms](#user-management-forms)
4. [Customer Forms](#customer-forms)
5. [Product Forms](#product-forms)
6. [Order Forms](#order-forms)
7. [Lead Forms](#lead-forms)
8. [Settings Forms](#settings-forms)
9. [File Upload Forms](#file-upload-forms)
10. [Utility Forms](#utility-forms)
11. [Usage Examples](#usage-examples)

## Core Validators

### Email Validator (RFC 5322)
```typescript
import { emailValidator } from '@/types/forms';

// Valid examples
emailValidator.parse('user@example.com');
emailValidator.parse('user.name+tag@example.co.uk');

// Invalid examples (will throw)
emailValidator.parse('invalid-email'); // ❌
emailValidator.parse('@example.com'); // ❌
```

**Requirements**: 21.8, 5.7, 8.8  
**Format**: RFC 5322 compliant email addresses  
**Validation**: Uses both Zod's built-in email validator and a comprehensive RFC 5322 regex pattern

### Phone Validator (E.164)
```typescript
import { phoneValidator } from '@/types/forms';

// Valid examples
phoneValidator.parse('+1234567890');
phoneValidator.parse('+12345678901234');
phoneValidator.parse('1234567890'); // Optional + prefix

// Invalid examples (will throw)
phoneValidator.parse('+0123456789'); // ❌ Cannot start with 0
phoneValidator.parse('abc123'); // ❌ Invalid format
phoneValidator.parse('+1-234-567-890'); // ❌ No dashes allowed
```

**Requirements**: 21.9, 8.8  
**Format**: E.164 international phone number format  
**Pattern**: `^\+?[1-9]\d{1,14}$`

### Password Validator
```typescript
import { passwordValidator } from '@/types/forms';

// Valid examples
passwordValidator.parse('Password123');
passwordValidator.parse('MyP@ssw0rd');

// Invalid examples (will throw)
passwordValidator.parse('weak'); // ❌ Too short
passwordValidator.parse('password123'); // ❌ No uppercase
passwordValidator.parse('PASSWORD123'); // ❌ No lowercase
passwordValidator.parse('PasswordABC'); // ❌ No number
```

**Requirements**: 5.7, 14.10, 21.10  
**Rules**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Address Validator
```typescript
import { addressSchema } from '@/types/forms';

const validAddress = {
  street: '123 Main St',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
  country: 'USA',
};

addressSchema.parse(validAddress);
```

**Requirements**: 8.8, 21.10  
**Fields**: All fields are required
- `street`: 1-200 characters
- `city`: 1-100 characters
- `state`: 1-100 characters
- `zipCode`: 1-20 characters
- `country`: 1-100 characters

## Authentication Forms

### Login Form
```typescript
import { loginFormSchema, type LoginFormData } from '@/types/forms';

const loginData: LoginFormData = {
  email: 'user@example.com',
  password: 'Password123',
  tenantId: 'tenant-123', // Optional
};

loginFormSchema.parse(loginData);
```

**Requirements**: 5.7, 21.2, 21.8, 21.10  
**Fields**:
- `email`: Required, RFC 5322 compliant
- `password`: Required, any string
- `tenantId`: Optional

### Password Reset
```typescript
import { resetPasswordFormSchema } from '@/types/forms';

resetPasswordFormSchema.parse({
  email: 'user@example.com',
});
```

### Password Reset Confirmation
```typescript
import { resetPasswordConfirmFormSchema } from '@/types/forms';

resetPasswordConfirmFormSchema.parse({
  token: 'reset-token-123',
  newPassword: 'NewPassword123',
  confirmPassword: 'NewPassword123',
});
```

**Validation**: Ensures `newPassword` and `confirmPassword` match

## User Management Forms

### Create User
```typescript
import { createUserFormSchema, type CreateUserFormData } from '@/types/forms';

const userData: CreateUserFormData = {
  email: 'newuser@example.com',
  name: 'John Doe',
  role: 'staff', // 'admin' | 'manager' | 'staff'
  password: 'SecurePass123',
};

createUserFormSchema.parse(userData);
```

**Requirements**: 14.10, 21.2  
**Fields**:
- `email`: Required, RFC 5322 compliant, must be unique
- `name`: Required, 2+ characters
- `role`: Required, enum: 'admin', 'manager', 'staff'
- `password`: Required, strong password (8+ chars, uppercase, lowercase, number)

### Update User
```typescript
import { updateUserFormSchema } from '@/types/forms';

updateUserFormSchema.parse({
  name: 'Jane Doe', // Optional
  role: 'manager', // Optional
  isActive: true, // Optional
});
```

## Customer Forms

### Customer Form
```typescript
import { customerFormSchema, type CustomerFormData } from '@/types/forms';

const customerData: CustomerFormData = {
  name: 'Jane Smith',
  email: 'jane@example.com', // Optional
  phone: '+1234567890',
  address: { // Optional
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
  },
  dateOfBirth: '1990-01-01', // Optional
  notes: 'VIP customer', // Optional
};

customerFormSchema.parse(customerData);
```

**Requirements**: 8.8, 21.9, 21.10  
**Fields**:
- `name`: Required, 2-200 characters
- `email`: Optional, RFC 5322 compliant (can be empty string)
- `phone`: Required, E.164 format
- `address`: Optional, complete address object
- `dateOfBirth`: Optional, ISO date string
- `notes`: Optional, max 1000 characters

## Product Forms

### Product Form
```typescript
import { productFormSchema, type ProductFormData } from '@/types/forms';

const productData: ProductFormData = {
  sku: 'PROD-001',
  name: 'Wireless Mouse',
  description: 'Ergonomic wireless mouse', // Optional
  category: 'Electronics',
  subCategory: 'Computer Accessories', // Optional
  price: 29.99,
  costPrice: 15.00, // Optional
  stockQuantity: 100,
  minStockLevel: 10,
  barcode: '1234567890123', // Optional
  imageUrl: 'https://example.com/image.jpg', // Optional
};

productFormSchema.parse(productData);
```

**Requirements**: 11.10, 21.2  
**Validation Rules**:
- `sku`: Required, unique, max 50 characters
- `name`: Required, 2-200 characters
- `price`: Required, positive number, max 999,999.99
- `stockQuantity`: Required, non-negative integer
- `minStockLevel`: Required, non-negative integer

## Order Forms

### Create Order
```typescript
import { createOrderFormSchema, type CreateOrderFormData } from '@/types/forms';

const orderData: CreateOrderFormData = {
  customerId: 'cust-123', // Optional
  items: [
    {
      productId: 'prod-456',
      variantId: 'var-789', // Optional
      quantity: 2,
      unitPrice: 29.99,
      discount: 10, // Optional, percentage
    },
  ],
  paymentMethod: 'card', // 'cash' | 'card' | 'upi' | 'net_banking'
  discountAmount: 5.00, // Optional
  notes: 'Rush order', // Optional
};

createOrderFormSchema.parse(orderData);
```

**Requirements**: 10.10, 21.2  
**Validation Rules**:
- `items`: Required, at least one item
- `quantity`: Positive integer
- `unitPrice`: Positive number
- `discount`: 0-100%
- `paymentMethod`: Enum validation

### Update Order
```typescript
import { updateOrderFormSchema } from '@/types/forms';

updateOrderFormSchema.parse({
  status: 'completed', // 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded'
  paymentStatus: 'success', // 'pending' | 'success' | 'failed' | 'refunded'
  notes: 'Delivered successfully',
});
```

## Lead Forms

### Lead Form
```typescript
import { leadFormSchema, type LeadFormData } from '@/types/forms';

const leadData: LeadFormData = {
  name: 'Potential Customer',
  email: 'lead@company.com', // Optional
  phone: '+1234567890',
  company: 'Acme Corp', // Optional
  source: 'Website', // Optional
  notes: 'Interested in enterprise plan', // Optional
  estimatedValue: 50000.00, // Optional
};

leadFormSchema.parse(leadData);
```

### Update Lead
```typescript
import { updateLeadFormSchema } from '@/types/forms';

updateLeadFormSchema.parse({
  name: 'Updated Name',
  status: 'qualified', // 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
  assignedTo: 'user-123',
});
```

### Follow-up Task
```typescript
import { followUpTaskFormSchema } from '@/types/forms';

followUpTaskFormSchema.parse({
  title: 'Call customer',
  description: 'Discuss pricing options',
  dueDate: '2024-02-01',
  assignedTo: 'user-123',
});
```

## Settings Forms

### Business Info
```typescript
import { businessInfoFormSchema } from '@/types/forms';

businessInfoFormSchema.parse({
  name: 'My Business Inc.',
  address: '789 Business Blvd',
  city: 'Chicago',
  state: 'IL',
  zipCode: '60601',
  country: 'USA',
  phone: '+1234567890',
  email: 'info@business.com',
  taxId: 'TAX-123456',
  website: 'https://business.com', // Optional
});
```

### Tenant Settings
```typescript
import { tenantSettingsFormSchema } from '@/types/forms';

tenantSettingsFormSchema.parse({
  taxRate: 8.5, // 0-100%
  currency: 'USD',
  lowStockThreshold: 10,
});
```

### Branding
```typescript
import { brandingFormSchema } from '@/types/forms';

brandingFormSchema.parse({
  logo: 'https://example.com/logo.png', // Optional
  primaryColor: '#FF5733',
  secondaryColor: '#33FF57',
});
```

**Validation**: Colors must be in hex format (#RRGGBB)

## File Upload Forms

### CSV Upload
```typescript
import { fileUploadSchema } from '@/types/forms';

const file = new File(['content'], 'data.csv', { type: 'text/csv' });

fileUploadSchema.parse({ file });
```

**Requirements**: 3.4, 3.5, 25.9  
**Validation**:
- File type: CSV only
- Maximum size: 10MB

### Image Upload
```typescript
import { imageUploadSchema } from '@/types/forms';

const image = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });

imageUploadSchema.parse({ file: image });
```

**Validation**:
- File types: JPEG, PNG, WebP
- Maximum size: 5MB

## Utility Forms

### Search Form
```typescript
import { searchFormSchema } from '@/types/forms';

searchFormSchema.parse({
  query: 'search term',
  category: 'Electronics',
  status: 'active',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  page: 1,
  pageSize: 20,
  sortBy: 'name',
  sortOrder: 'asc', // 'asc' | 'desc'
});
```

### Payment Form
```typescript
import { paymentFormSchema } from '@/types/forms';

paymentFormSchema.parse({
  amount: 150.50,
  paymentMethod: 'card',
  transactionId: 'txn-123', // Optional
  notes: 'Payment for order #456', // Optional
});
```

### Report Generation
```typescript
import { reportGenerationFormSchema } from '@/types/forms';

reportGenerationFormSchema.parse({
  reportType: 'sales', // 'sales' | 'inventory' | 'customer' | 'product' | 'payment' | 'profit_loss'
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  format: 'pdf', // 'pdf' | 'csv'
  includeCharts: true, // Optional
});
```

## Usage Examples

### With React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginFormSchema, type LoginFormData } from '@/types/forms';

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    console.log('Valid data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit">Login</button>
    </form>
  );
}
```

### Manual Validation

```typescript
import { customerFormSchema } from '@/types/forms';

function validateCustomer(data: unknown) {
  try {
    const validData = customerFormSchema.parse(data);
    console.log('Valid customer data:', validData);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
      return { success: false, errors: error.errors };
    }
    throw error;
  }
}
```

### Safe Parsing

```typescript
import { productFormSchema } from '@/types/forms';

function safeValidateProduct(data: unknown) {
  const result = productFormSchema.safeParse(data);
  
  if (result.success) {
    console.log('Valid product:', result.data);
    return result.data;
  } else {
    console.error('Validation failed:', result.error.errors);
    return null;
  }
}
```

## Error Handling

All schemas provide detailed error messages:

```typescript
import { emailValidator } from '@/types/forms';

try {
  emailValidator.parse('invalid-email');
} catch (error) {
  if (error instanceof z.ZodError) {
    error.errors.forEach((err) => {
      console.log(`Field: ${err.path.join('.')}`);
      console.log(`Message: ${err.message}`);
    });
  }
}
```

## Best Practices

1. **Always use TypeScript types**: Import both the schema and its inferred type
   ```typescript
   import { loginFormSchema, type LoginFormData } from '@/types/forms';
   ```

2. **Use with React Hook Form**: Leverage `zodResolver` for seamless integration
   ```typescript
   const form = useForm<LoginFormData>({
     resolver: zodResolver(loginFormSchema),
   });
   ```

3. **Handle errors gracefully**: Display user-friendly error messages
   ```typescript
   {errors.email && <span className="error">{errors.email.message}</span>}
   ```

4. **Validate on the client and server**: Use the same schemas on both sides
   ```typescript
   // Client-side
   const result = schema.safeParse(formData);
   
   // Server-side (API route)
   const validated = schema.parse(requestBody);
   ```

5. **Use optional validators for optional fields**: 
   ```typescript
   email: optionalEmailValidator, // Allows empty string or valid email
   ```

## Testing

Run the validation test suite:

```bash
npx tsx types/__tests__/validate-schemas.ts
```

This will verify all schemas are working correctly with comprehensive test cases.

## Requirements Coverage

All schemas satisfy the following requirements:
- ✅ 3.3: Validate all user inputs using Zod schemas
- ✅ 5.7: Validate email format and password strength on login
- ✅ 8.8: Validate email, phone, address formats
- ✅ 14.10: Validate email uniqueness and password complexity
- ✅ 21.2: Validate all form inputs using Zod schemas
- ✅ 21.8: Validate email format using RFC 5322
- ✅ 21.9: Validate phone numbers using E.164 format
- ✅ 21.10: Validate required fields before submission

## Additional Resources

- [Zod Documentation](https://zod.dev/)
- [React Hook Form with Zod](https://react-hook-form.com/get-started#SchemaValidation)
- [RFC 5322 Email Standard](https://tools.ietf.org/html/rfc5322)
- [E.164 Phone Number Format](https://en.wikipedia.org/wiki/E.164)
