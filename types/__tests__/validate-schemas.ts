/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Schema Validation Test Script
 * This script validates that all Zod schemas are working correctly
 * Run with: npx tsx types/__tests__/validate-schemas.ts
 */

import {
  emailValidator,
  phoneValidator,
  passwordValidator,
  loginFormSchema,
  createUserFormSchema,
  customerFormSchema,
  productFormSchema,
  createOrderFormSchema,
  leadFormSchema,
  addressSchema,
  businessInfoFormSchema,
  fileUploadSchema,
  paymentFormSchema,
} from '../forms';

console.log('🧪 Testing Zod Validation Schemas...\n');

let passedTests = 0;
let failedTests = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passedTests++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    failedTests++;
  }
}

// Test Email Validator
test('Email Validator - Valid email', () => {
  emailValidator.parse('user@example.com');
});

test('Email Validator - Invalid email should throw', () => {
  try {
    emailValidator.parse('invalid-email');
    throw new Error('Should have thrown validation error');
  } catch (error: any) {
    if (!error.issues) throw new Error('Should have thrown Zod validation error');
  }
});

// Test Phone Validator
test('Phone Validator - Valid E.164 phone', () => {
  phoneValidator.parse('+1234567890');
});

test('Phone Validator - Invalid phone should throw', () => {
  try {
    phoneValidator.parse('+0123456789');
    throw new Error('Should have thrown validation error');
  } catch (error: any) {
    if (!error.issues) throw new Error('Should have thrown Zod validation error');
  }
});

// Test Password Validator
test('Password Validator - Strong password', () => {
  passwordValidator.parse('Password123');
});

test('Password Validator - Weak password should throw', () => {
  try {
    passwordValidator.parse('weak');
    throw new Error('Should have thrown validation error');
  } catch (error: any) {
    if (!error.issues) throw new Error('Should have thrown Zod validation error');
  }
});

// Test Login Form Schema
test('Login Form Schema - Valid data', () => {
  loginFormSchema.parse({
    email: 'user@example.com',
    password: 'Password123',
  });
});

// Test User Form Schema
test('Create User Form Schema - Valid data', () => {
  createUserFormSchema.parse({
    email: 'newuser@example.com',
    name: 'John Doe',
    role: 'staff',
    password: 'SecurePass123',
  });
});

// Test Customer Form Schema
test('Customer Form Schema - Valid data with address', () => {
  customerFormSchema.parse({
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1234567890',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
  });
});

test('Customer Form Schema - Valid data without email', () => {
  customerFormSchema.parse({
    name: 'John Doe',
    email: '',
    phone: '+1234567890',
  });
});

// Test Product Form Schema
test('Product Form Schema - Valid data', () => {
  productFormSchema.parse({
    sku: 'PROD-001',
    name: 'Test Product',
    category: 'Electronics',
    price: 99.99,
    stockQuantity: 100,
    minStockLevel: 10,
  });
});

test('Product Form Schema - Negative stock should throw', () => {
  try {
    productFormSchema.parse({
      sku: 'PROD-001',
      name: 'Test Product',
      category: 'Electronics',
      price: 99.99,
      stockQuantity: -5,
      minStockLevel: 10,
    });
    throw new Error('Should have thrown validation error');
  } catch (error: any) {
    if (!error.issues) throw new Error('Should have thrown Zod validation error');
  }
});

// Test Order Form Schema
test('Create Order Form Schema - Valid data', () => {
  createOrderFormSchema.parse({
    items: [
      {
        productId: 'prod-123',
        quantity: 2,
        unitPrice: 50.0,
      },
    ],
    paymentMethod: 'cash',
  });
});

test('Create Order Form Schema - Empty items should throw', () => {
  try {
    createOrderFormSchema.parse({
      items: [],
      paymentMethod: 'cash',
    });
    throw new Error('Should have thrown validation error');
  } catch (error: any) {
    if (!error.issues) throw new Error('Should have thrown Zod validation error');
  }
});

// Test Lead Form Schema
test('Lead Form Schema - Valid data', () => {
  leadFormSchema.parse({
    name: 'Lead Name',
    email: 'lead@company.com',
    phone: '+1234567890',
    company: 'Acme Corp',
  });
});

// Test Address Schema
test('Address Schema - Valid complete address', () => {
  addressSchema.parse({
    street: '456 Oak Ave',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90001',
    country: 'USA',
  });
});

test('Address Schema - Incomplete address should throw', () => {
  try {
    addressSchema.parse({
      street: '456 Oak Ave',
      city: 'Los Angeles',
    });
    throw new Error('Should have thrown validation error');
  } catch (error: any) {
    if (!error.issues) throw new Error('Should have thrown Zod validation error');
  }
});

// Test Business Info Form Schema
test('Business Info Form Schema - Valid data', () => {
  businessInfoFormSchema.parse({
    name: 'My Business',
    address: '789 Business Blvd',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60601',
    country: 'USA',
    phone: '+1234567890',
    email: 'info@business.com',
    taxId: 'TAX-123456',
  });
});

// Test Payment Form Schema
test('Payment Form Schema - Valid data', () => {
  paymentFormSchema.parse({
    amount: 150.50,
    paymentMethod: 'card',
  });
});

test('Payment Form Schema - Negative amount should throw', () => {
  try {
    paymentFormSchema.parse({
      amount: -50,
      paymentMethod: 'cash',
    });
    throw new Error('Should have thrown validation error');
  } catch (error: any) {
    if (!error.issues) throw new Error('Should have thrown Zod validation error');
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`📊 Total: ${passedTests + failedTests}`);
console.log('='.repeat(50));

if (failedTests > 0) {
  process.exit(1);
}

console.log('\n✨ All validation schemas are working correctly!');
