/**
 * Unit tests for Form Validation Schemas
 * 
 * Tests Zod validation schemas for customer forms
 * Requirements: 8.8, 21.8, 21.9, 21.10
 */

import {
  customerFormSchema,
  emailValidator,
  phoneValidator,
  optionalEmailValidator,
  optionalPhoneValidator,
  addressSchema,
} from './forms';

describe('Customer Form Validation', () => {
  describe('emailValidator', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'test123@test-domain.com',
      ];

      validEmails.forEach((email) => {
        const result = emailValidator.safeParse(email);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
      ];

      invalidEmails.forEach((email) => {
        const result = emailValidator.safeParse(email);
        expect(result.success).toBe(false);
      });
    });

    it('should reject empty email', () => {
      const result = emailValidator.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Email is required');
      }
    });
  });

  describe('phoneValidator', () => {
    it('should accept valid E.164 phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '+12345678901',
        '+123456789012345', // Max 15 digits
        '+919876543210',
      ];

      validPhones.forEach((phone) => {
        const result = phoneValidator.safeParse(phone);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '1234567890', // Missing +
        '+0234567890', // Starts with 0
        '+12', // Too short
        '+12345678901234567', // Too long (>15 digits)
        'abc123',
        '+1 234 567 890', // Contains spaces
      ];

      invalidPhones.forEach((phone) => {
        const result = phoneValidator.safeParse(phone);
        expect(result.success).toBe(false);
      });
    });

    it('should reject empty phone number', () => {
      const result = phoneValidator.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Phone number is required');
      }
    });
  });

  describe('optionalEmailValidator', () => {
    it('should accept valid email addresses', () => {
      const result = optionalEmailValidator.safeParse('test@example.com');
      expect(result.success).toBe(true);
    });

    it('should accept empty string', () => {
      const result = optionalEmailValidator.safeParse('');
      expect(result.success).toBe(true);
    });

    it('should accept undefined', () => {
      const result = optionalEmailValidator.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = optionalEmailValidator.safeParse('invalid-email');
      expect(result.success).toBe(false);
    });
  });

  describe('optionalPhoneValidator', () => {
    it('should accept valid phone numbers', () => {
      const result = optionalPhoneValidator.safeParse('+1234567890');
      expect(result.success).toBe(true);
    });

    it('should accept empty string', () => {
      const result = optionalPhoneValidator.safeParse('');
      expect(result.success).toBe(true);
    });

    it('should accept undefined', () => {
      const result = optionalPhoneValidator.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('should reject invalid phone', () => {
      const result = optionalPhoneValidator.safeParse('123');
      expect(result.success).toBe(false);
    });
  });

  describe('addressSchema', () => {
    it('should accept valid address', () => {
      const validAddress = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'United States',
      };

      const result = addressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
    });

    it('should reject address with missing required fields', () => {
      const invalidAddress = {
        street: '123 Main St',
        city: 'New York',
        // Missing state, zipCode, country
      };

      const result = addressSchema.safeParse(invalidAddress);
      expect(result.success).toBe(false);
    });

    it('should reject address with empty required fields', () => {
      const invalidAddress = {
        street: '',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'United States',
      };

      const result = addressSchema.safeParse(invalidAddress);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Street is required');
      }
    });

    it('should reject address with fields exceeding max length', () => {
      const invalidAddress = {
        street: 'a'.repeat(201), // Max 200
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'United States',
      };

      const result = addressSchema.safeParse(invalidAddress);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be less than 200 characters');
      }
    });
  });

  describe('customerFormSchema', () => {
    it('should accept valid customer data with all fields', () => {
      const validCustomer = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'United States',
        },
        dateOfBirth: '1990-01-01',
        notes: 'VIP customer',
      };

      const result = customerFormSchema.safeParse(validCustomer);
      expect(result.success).toBe(true);
    });

    it('should accept valid customer data with only required fields', () => {
      const validCustomer = {
        name: 'John Doe',
        phone: '+1234567890',
      };

      const result = customerFormSchema.safeParse(validCustomer);
      expect(result.success).toBe(true);
    });

    it('should reject customer with missing name', () => {
      const invalidCustomer = {
        phone: '+1234567890',
      };

      const result = customerFormSchema.safeParse(invalidCustomer);
      expect(result.success).toBe(false);
    });

    it('should reject customer with missing phone', () => {
      const invalidCustomer = {
        name: 'John Doe',
      };

      const result = customerFormSchema.safeParse(invalidCustomer);
      expect(result.success).toBe(false);
    });

    it('should reject customer with name too short', () => {
      const invalidCustomer = {
        name: 'J', // Less than 2 characters
        phone: '+1234567890',
      };

      const result = customerFormSchema.safeParse(invalidCustomer);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be at least 2 characters');
      }
    });

    it('should reject customer with name too long', () => {
      const invalidCustomer = {
        name: 'a'.repeat(201), // More than 200 characters
        phone: '+1234567890',
      };

      const result = customerFormSchema.safeParse(invalidCustomer);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be less than 200 characters');
      }
    });

    it('should reject customer with invalid email format', () => {
      const invalidCustomer = {
        name: 'John Doe',
        email: 'invalid-email',
        phone: '+1234567890',
      };

      const result = customerFormSchema.safeParse(invalidCustomer);
      expect(result.success).toBe(false);
    });

    it('should reject customer with invalid phone format', () => {
      const invalidCustomer = {
        name: 'John Doe',
        phone: '123', // Invalid E.164 format
      };

      const result = customerFormSchema.safeParse(invalidCustomer);
      expect(result.success).toBe(false);
    });

    it('should reject customer with notes exceeding max length', () => {
      const invalidCustomer = {
        name: 'John Doe',
        phone: '+1234567890',
        notes: 'a'.repeat(1001), // More than 1000 characters
      };

      const result = customerFormSchema.safeParse(invalidCustomer);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be less than 1000 characters');
      }
    });

    it('should accept customer with optional empty email', () => {
      const validCustomer = {
        name: 'John Doe',
        email: '',
        phone: '+1234567890',
      };

      const result = customerFormSchema.safeParse(validCustomer);
      expect(result.success).toBe(true);
    });

    it('should accept customer with optional empty address fields', () => {
      const validCustomer = {
        name: 'John Doe',
        phone: '+1234567890',
        address: undefined,
      };

      const result = customerFormSchema.safeParse(validCustomer);
      expect(result.success).toBe(true);
    });

    it('should validate nested address fields when provided', () => {
      const invalidCustomer = {
        name: 'John Doe',
        phone: '+1234567890',
        address: {
          street: '123 Main St',
          city: '', // Empty required field
          state: 'NY',
          zipCode: '10001',
          country: 'United States',
        },
      };

      const result = customerFormSchema.safeParse(invalidCustomer);
      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle international phone numbers', () => {
      const internationalPhones = [
        '+442071234567', // UK
        '+33123456789', // France
        '+81312345678', // Japan
        '+61212345678', // Australia
        '+919876543210', // India
      ];

      internationalPhones.forEach((phone) => {
        const result = phoneValidator.safeParse(phone);
        expect(result.success).toBe(true);
      });
    });

    it('should handle special characters in email', () => {
      const specialEmails = [
        'user+tag@example.com',
        'user.name@example.com',
        'user_name@example.com',
        'user-name@example.com',
      ];

      specialEmails.forEach((email) => {
        const result = emailValidator.safeParse(email);
        expect(result.success).toBe(true);
      });
    });

    it('should handle unicode characters in name', () => {
      const unicodeNames = [
        'José García',
        '李明',
        'Müller',
        'Владимир',
      ];

      unicodeNames.forEach((name) => {
        const result = customerFormSchema.safeParse({
          name,
          phone: '+1234567890',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should trim whitespace from string fields', () => {
      const customerWithWhitespace = {
        name: '  John Doe  ',
        phone: '+1234567890',
      };

      const result = customerFormSchema.safeParse(customerWithWhitespace);
      expect(result.success).toBe(true);
    });
  });
});
