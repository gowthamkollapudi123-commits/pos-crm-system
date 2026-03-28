/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CSV Export Utilities Tests
 * 
 * Tests for CSV generation, escaping, and download functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  escapeCsvCell,
  arrayToCsv,
  downloadCsv,
  generateCsvFilename,
  formatCurrencyForCsv,
  formatDateForCsv,
} from '../csv-export';

describe('escapeCsvCell', () => {
  it('should return empty string for null or undefined', () => {
    expect(escapeCsvCell(null)).toBe('');
    expect(escapeCsvCell(undefined)).toBe('');
  });

  it('should convert numbers to strings', () => {
    expect(escapeCsvCell(123)).toBe('123');
    expect(escapeCsvCell(45.67)).toBe('45.67');
  });

  it('should not quote simple strings', () => {
    expect(escapeCsvCell('hello')).toBe('hello');
    expect(escapeCsvCell('test123')).toBe('test123');
  });

  it('should quote strings containing commas', () => {
    expect(escapeCsvCell('hello, world')).toBe('"hello, world"');
  });

  it('should quote strings containing quotes and escape internal quotes', () => {
    expect(escapeCsvCell('say "hello"')).toBe('"say ""hello"""');
  });

  it('should quote strings containing newlines', () => {
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"');
  });

  it('should sanitize formula injection attempts', () => {
    // The sanitizeCsvValue function removes leading dangerous characters
    expect(escapeCsvCell('=SUM(A1:A10)')).toBe('SUM(A1:A10)');
    expect(escapeCsvCell('+1234')).toBe('1234');
    expect(escapeCsvCell('-1234')).toBe('1234');
    expect(escapeCsvCell('@username')).toBe('username');
  });

  it('should handle complex cases with multiple special characters', () => {
    expect(escapeCsvCell('test, "value"\nnew line')).toBe('"test, ""value""\nnew line"');
  });
});

describe('arrayToCsv', () => {
  it('should convert simple array to CSV', () => {
    const data = [
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 },
    ];

    const csv = arrayToCsv(data, ['name', 'age']);
    const lines = csv.split('\n');

    expect(lines[0]).toBe('\uFEFFname,age'); // BOM + header
    expect(lines[1]).toBe('John,30');
    expect(lines[2]).toBe('Jane,25');
  });

  it('should use custom header labels', () => {
    const data = [{ firstName: 'John', lastName: 'Doe' }];

    const csv = arrayToCsv(
      data,
      ['firstName', 'lastName'],
      { firstName: 'First Name', lastName: 'Last Name' }
    );

    const lines = csv.split('\n');
    expect(lines[0]).toBe('\uFEFFFirst Name,Last Name');
  });

  it('should handle empty array', () => {
    const csv = arrayToCsv([], ['name', 'age']);
    expect(csv).toBe('\uFEFFname,age');
  });

  it('should escape special characters in data', () => {
    const data = [
      { name: 'John, Jr.', note: 'Say "hi"' },
    ];

    const csv = arrayToCsv(data, ['name', 'note']);
    const lines = csv.split('\n');

    expect(lines[1]).toBe('"John, Jr.","Say ""hi"""');
  });

  it('should handle null and undefined values', () => {
    const data = [
      { name: 'John', email: null, phone: undefined },
    ];

    const csv = arrayToCsv(data, ['name', 'email', 'phone']);
    const lines = csv.split('\n');

    expect(lines[1]).toBe('John,,');
  });

  it('should include UTF-8 BOM for Excel compatibility', () => {
    const data = [{ name: 'Test' }];
    const csv = arrayToCsv(data, ['name']);

    expect(csv.charCodeAt(0)).toBe(0xFEFF); // BOM character
  });
});

describe('downloadCsv', () => {
  let createElementSpy: any;
  let appendChildSpy: any;
  let removeChildSpy: any;
  let createObjectURLSpy: any;
  let revokeObjectURLSpy: any;

  beforeEach(() => {
    // Mock DOM elements and methods
    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {},
    };

    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create and trigger download link', () => {
    const csvContent = 'name,age\nJohn,30';
    const filename = 'test-export';

    downloadCsv(csvContent, filename);

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should set correct filename with .csv extension', () => {
    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {},
    };

    createElementSpy.mockReturnValue(mockLink);

    downloadCsv('test', 'my-file');

    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'my-file.csv');
  });

  it('should create blob with correct MIME type', () => {
    const blobSpy = vi.spyOn(global, 'Blob');

    downloadCsv('test', 'file');

    expect(blobSpy).toHaveBeenCalledWith(
      ['test'],
      { type: 'text/csv;charset=utf-8;' }
    );
  });
});

describe('generateCsvFilename', () => {
  it('should generate filename with timestamp', () => {
    const filename = generateCsvFilename('sales_report');

    expect(filename).toMatch(/^sales_report_\d{4}-\d{2}-\d{2}_\d{6}$/);
  });

  it('should include date range in filename', () => {
    const filename = generateCsvFilename('sales_report', {
      start: '2024-01-01',
      end: '2024-01-31',
    });

    expect(filename).toMatch(/^sales_report_2024-01-01_to_2024-01-31_\d{4}-\d{2}-\d{2}_\d{6}$/);
  });

  it('should handle different prefixes', () => {
    const filename = generateCsvFilename('orders_export');

    expect(filename).toContain('orders_export_');
  });
});

describe('formatCurrencyForCsv', () => {
  it('should format currency with default INR', () => {
    expect(formatCurrencyForCsv(1234.56)).toBe('INR 1234.56');
  });

  it('should format currency with custom currency code', () => {
    expect(formatCurrencyForCsv(1234.56, 'USD')).toBe('USD 1234.56');
  });

  it('should format to 2 decimal places', () => {
    expect(formatCurrencyForCsv(100)).toBe('INR 100.00');
    expect(formatCurrencyForCsv(99.9)).toBe('INR 99.90');
  });

  it('should handle zero', () => {
    expect(formatCurrencyForCsv(0)).toBe('INR 0.00');
  });

  it('should handle negative values', () => {
    expect(formatCurrencyForCsv(-50.25)).toBe('INR -50.25');
  });
});

describe('formatDateForCsv', () => {
  it('should format date with default format', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const formatted = formatDateForCsv(date);

    expect(formatted).toMatch(/2024-01-15 \d{2}:\d{2}:\d{2}/);
  });

  it('should format date string', () => {
    const formatted = formatDateForCsv('2024-01-15T10:30:00Z');

    expect(formatted).toMatch(/2024-01-15 \d{2}:\d{2}:\d{2}/);
  });

  it('should use custom format string', () => {
    const date = new Date('2024-01-15');
    const formatted = formatDateForCsv(date, 'yyyy-MM-dd');

    expect(formatted).toBe('2024-01-15');
  });

  it('should handle invalid dates gracefully', () => {
    const formatted = formatDateForCsv('invalid-date');

    expect(formatted).toBe('invalid-date');
  });

  it('should format with different patterns', () => {
    const date = new Date('2024-01-15T10:30:00Z');

    expect(formatDateForCsv(date, 'MMM dd, yyyy')).toMatch(/Jan 15, 2024/);
    expect(formatDateForCsv(date, 'dd/MM/yyyy')).toMatch(/15\/01\/2024/);
  });
});

describe('Integration: Full CSV Export Flow', () => {
  it('should generate complete CSV with proper formatting', () => {
    const orders = [
      {
        orderNumber: 'ORD-001',
        customer: 'John Doe',
        amount: 1234.56,
        date: '2024-01-15T10:30:00Z',
      },
      {
        orderNumber: 'ORD-002',
        customer: 'Jane Smith, Inc.',
        amount: 5678.90,
        date: '2024-01-16T14:45:00Z',
      },
    ];

    const exportData = orders.map(order => ({
      orderNumber: order.orderNumber,
      customer: order.customer,
      amount: formatCurrencyForCsv(order.amount),
      date: formatDateForCsv(order.date, 'yyyy-MM-dd'),
    }));

    const csv = arrayToCsv(
      exportData,
      ['orderNumber', 'customer', 'amount', 'date'],
      {
        orderNumber: 'Order Number',
        customer: 'Customer',
        amount: 'Amount',
        date: 'Date',
      }
    );

    const lines = csv.split('\n');

    expect(lines[0]).toBe('\uFEFFOrder Number,Customer,Amount,Date');
    expect(lines[1]).toBe('ORD-001,John Doe,INR 1234.56,2024-01-15');
    expect(lines[2]).toBe('ORD-002,"Jane Smith, Inc.",INR 5678.90,2024-01-16');
  });

  it('should handle special characters and formula injection', () => {
    const data = [
      {
        name: '=SUM(A1:A10)',
        note: 'Test, "value"\nNew line',
      },
    ];

    const csv = arrayToCsv(data, ['name', 'note']);
    
    // The CSV should have the formula character removed and special chars escaped
    // Note: newlines inside quoted fields are preserved in CSV format
    expect(csv).toContain('SUM(A1:A10)');
    expect(csv).toContain('"Test, ""value""');
    expect(csv).toContain('New line"');
  });
});
