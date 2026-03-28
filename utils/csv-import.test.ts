/**
 * CSV Import Utilities Tests
 * 
 * Tests CSV parsing, validation, and file handling
 */

import { describe, it, expect } from 'vitest';
import {
  parseCsvFile,
  validateCsvStructure,
  validateCsvFile,
} from './csv-import';

describe('CSV Import Utilities', () => {
  describe('parseCsvFile', () => {
    it('should parse basic CSV with comma delimiter', () => {
      const csv = `sku,name,price
PROD-001,Product 1,99.99
PROD-002,Product 2,149.99`;
      
      const result = parseCsvFile(csv);
      
      expect(result.headers).toEqual(['sku', 'name', 'price']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].data).toEqual({
        sku: 'PROD-001',
        name: 'Product 1',
        price: '99.99',
      });
      expect(result.errors).toHaveLength(0);
    });
    
    it('should parse CSV with semicolon delimiter', () => {
      const csv = `sku;name;price
PROD-001;Product 1;99.99
PROD-002;Product 2;149.99`;
      
      const result = parseCsvFile(csv);
      
      expect(result.headers).toEqual(['sku', 'name', 'price']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].data.sku).toBe('PROD-001');
    });
    
    it('should handle UTF-8 BOM', () => {
      const csv = '\uFEFFsku,name,price\nPROD-001,Product 1,99.99';
      
      const result = parseCsvFile(csv);
      
      expect(result.headers[0]).toBe('sku');
      expect(result.rows).toHaveLength(1);
    });
    
    it('should handle quoted values with commas', () => {
      const csv = `sku,name,description
PROD-001,"Product 1","A product, with comma"`;
      
      const result = parseCsvFile(csv);
      
      expect(result.rows[0].data.description).toBe('A product, with comma');
    });
    
    it('should handle escaped quotes', () => {
      const csv = `sku,name,description
PROD-001,"Product 1","A ""quoted"" value"`;
      
      const result = parseCsvFile(csv);
      
      expect(result.rows[0].data.description).toBe('A "quoted" value');
    });
    
    it('should handle empty lines', () => {
      const csv = `sku,name,price
PROD-001,Product 1,99.99

PROD-002,Product 2,149.99`;
      
      const result = parseCsvFile(csv);
      
      expect(result.rows).toHaveLength(2);
    });
    
    it('should return error for empty CSV', () => {
      const csv = '';
      
      const result = parseCsvFile(csv);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('empty');
    });
    
    it('should return error for missing required columns', () => {
      const csv = `sku,name
PROD-001,Product 1`;
      
      const result = parseCsvFile(csv, ['sku', 'name', 'price']);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Missing required columns');
    });
    
    it('should return error for rows with incorrect column count', () => {
      const csv = `sku,name,price
PROD-001,Product 1,99.99
PROD-002,Product 2`;
      
      const result = parseCsvFile(csv);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].row).toBe(3);
    });
    
    it('should include row numbers in parsed data', () => {
      const csv = `sku,name,price
PROD-001,Product 1,99.99
PROD-002,Product 2,149.99`;
      
      const result = parseCsvFile(csv);
      
      expect(result.rows[0].row).toBe(2);
      expect(result.rows[1].row).toBe(3);
    });
    
    it('should handle Windows line endings (CRLF)', () => {
      const csv = "sku,name,price\r\nPROD-001,Product 1,99.99\r\nPROD-002,Product 2,149.99";
      
      const result = parseCsvFile(csv);
      
      expect(result.rows).toHaveLength(2);
    });
    
    it('should trim whitespace from headers and values', () => {
      const csv = ` sku , name , price 
 PROD-001 , Product 1 , 99.99 `;
      
      const result = parseCsvFile(csv);
      
      expect(result.headers).toEqual(['sku', 'name', 'price']);
      expect(result.rows[0].data.sku).toBe('PROD-001');
    });
  });
  
  describe('validateCsvStructure', () => {
    it('should validate CSV with all required columns', () => {
      const headers = ['sku', 'name', 'category', 'price', 'stockQuantity', 'minStockLevel'];
      const required = ['sku', 'name', 'price'];
      
      const result = validateCsvStructure(headers, required);
      
      expect(result.valid).toBe(true);
      expect(result.missingColumns).toHaveLength(0);
    });
    
    it('should detect missing required columns', () => {
      const headers = ['sku', 'name'];
      const required = ['sku', 'name', 'price'];
      
      const result = validateCsvStructure(headers, required);
      
      expect(result.valid).toBe(false);
      expect(result.missingColumns).toEqual(['price']);
    });
    
    it('should be case-insensitive', () => {
      const headers = ['SKU', 'Name', 'PRICE'];
      const required = ['sku', 'name', 'price'];
      
      const result = validateCsvStructure(headers, required);
      
      expect(result.valid).toBe(true);
    });
    
    it('should handle extra columns', () => {
      const headers = ['sku', 'name', 'price', 'description', 'barcode'];
      const required = ['sku', 'name', 'price'];
      
      const result = validateCsvStructure(headers, required);
      
      expect(result.valid).toBe(true);
    });
  });
  
  describe('validateCsvFile', () => {
    it('should validate CSV file with correct type and size', () => {
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      
      const result = validateCsvFile(file, 10);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
    
    it('should reject non-CSV files', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      const result = validateCsvFile(file, 10);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('CSV files');
    });
    
    it('should reject files exceeding size limit', () => {
      const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
      const file = new File([largeContent], 'test.csv', { type: 'text/csv' });
      
      const result = validateCsvFile(file, 10);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10MB');
    });
    
    it('should accept CSV file with .csv extension even without correct MIME type', () => {
      const file = new File(['test'], 'test.csv', { type: '' });
      
      const result = validateCsvFile(file, 10);
      
      expect(result.valid).toBe(true);
    });
    
    it('should accept application/vnd.ms-excel MIME type', () => {
      const file = new File(['test'], 'test.csv', { type: 'application/vnd.ms-excel' });
      
      const result = validateCsvFile(file, 10);
      
      expect(result.valid).toBe(true);
    });
  });
});
