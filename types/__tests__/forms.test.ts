/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file for Zod validation schemas
import { describe, it, expect } from 'vitest';
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
} from '../forms';

describe('Email Validator', () => {
  it('should accept valid RFC 5322 compliant emails', () => {
    const validEmails = [
      'user@example.com',
      'user.name@example.com',
      'user+tag@example.co.uk',
      'user_name@example-domain.com',
    ];

    validEmails.forEach((email) => {
      expect(() => emailValidator.parse(email)).not.toThrow();
    });
  });

  it('should reject invalid emails', () => {
    const invalidEmails = [
      '',
      'invalid',
      '@example.com',
      'user@',
      'user @example.com',
    ];

    invalidEmails.forEach((email) => {
      expect(() => emailValidator.parse(email)).toThrow();
    });
  });
});

describe('Phone Validator', () => {
  it('should accept valid E.164 format phone numbers', () => {
    const validPhones = [
      '+1234567890',
      '+12345678901234',
    ];

    validPhones.forEach((phone) => {
      expect(() => phoneValidator.parse(phone)).not.toThrow();
    });
  });

  it('should reject invalid phone numbers', () => {
    const invalidPhones = [
      '',
      '+0123456789', // starts with 0
      '+1234567890123456', // too long (>15 digits total)
      'abc123',
      '+1-234-567-890', // contains dashes
    ];

    invalidPhones.forEach((phone) => {
      expect(() => phoneValidator.parse(phone)).toThrow();
    });
  });
});

describe('Password Validator', () => {
  it('should accept strong passwords', () => {
    const validPasswords = [
      'Password1',
      'MyP@ssw0rd',
      'Abcdefgh1',
    ];

    validPasswords.forEach((password) => {
      expect(() => passwordValidator.parse(password)).not.toThrow();
    });
  });

  it('should reject weak passwords', () => {
    const invalidPasswords = [
      'short1A', // too short
      'password1', // no uppercase
      'PASSWORD1', // no lowercase
      'PasswordABC', // no number
      'Pass1', // too short
    ];

    invalidPasswords.forEach((password) => {
      expect(() => passwordValidator.parse(password)).toThrow();
    });
  });
});

describe('Login Form Schema', () => {
  it('should validate correct login data', () => {
    const validData = {
      email: 'user@example.com',
      password: 'Password123',
    };

    expect(() => loginFormSchema.parse(validData)).not.toThrow();
  });

  it('should reject invalid login data', () => {
    const invalidData = {
      email: 'invalid-email',
      password: '',
    };

    expect(() => loginFormSchema.parse(invalidData)).toThrow();
  });
});

describe('Customer Form Schema', () => {
  it('should validate correct customer data with address', () => {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      },
    };

    expect(() => customerFormSchema.parse(validData)).not.toThrow();
  });

  it('should accept customer without email', () => {
    const validData = {
      name: 'John Doe',
      email: '',
      phone: '+1234567890',
    };

    expect(() => customerFormSchema.parse(validData)).not.toThrow();
  });
});

describe('Product Form Schema', () => {
  it('should validate correct product data', () => {
    const validData = {
      sku: 'PROD-001',
      name: 'Test Product',
      category: 'Electronics',
      price: 99.99,
      stockQuantity: 100,
      minStockLevel: 10,
    };

    expect(() => productFormSchema.parse(validData)).not.toThrow();
  });

  it('should reject negative stock quantity', () => {
    const invalidData = {
      sku: 'PROD-001',
      name: 'Test Product',
      category: 'Electronics',
      price: 99.99,
      stockQuantity: -5,
      minStockLevel: 10,
    };

    expect(() => productFormSchema.parse(invalidData)).toThrow();
  });
});

describe('Order Form Schema', () => {
  it('should validate correct order data', () => {
    const validData = {
      items: [
        {
          productId: 'prod-123',
          quantity: 2,
          unitPrice: 50.0,
        },
      ],
      paymentMethod: 'cash' as const,
    };

    expect(() => createOrderFormSchema.parse(validData)).not.toThrow();
  });

  it('should reject order without items', () => {
    const invalidData = {
      items: [],
      paymentMethod: 'cash',
    };

    expect(() => createOrderFormSchema.parse(invalidData)).toThrow();
  });
});

describe('Lead Form Schema', () => {
  it('should validate correct lead data', () => {
    const validData = {
      name: 'Jane Smith',
      email: 'jane@company.com',
      phone: '+1234567890',
      company: 'Acme Corp',
    };

    expect(() => leadFormSchema.parse(validData)).not.toThrow();
  });
});

describe('Address Schema', () => {
  it('should validate complete address', () => {
    const validAddress = {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    };

    expect(() => addressSchema.parse(validAddress)).not.toThrow();
  });

  it('should reject incomplete address', () => {
    const invalidAddress = {
      street: '123 Main St',
      city: 'New York',
      // missing state, zipCode, country
    };

    expect(() => addressSchema.parse(invalidAddress)).toThrow();
  });
});
