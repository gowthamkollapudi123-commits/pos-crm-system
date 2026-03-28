/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Customer Data Export Tests
 *
 * Tests for customer CSV export: correct columns, data formatting,
 * download triggered, and error handling.
 *
 * Requirements: 25.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { arrayToCsv, downloadCsv, generateCsvFilename, formatDateForCsv } from '../csv-export';
import type { Customer } from '../../types/entities';

// Minimal customer fixture
const makeCustomer = (overrides: Partial<Customer> = {}): Customer => ({
  id: 'cust-001',
  tenantId: 'tenant-1',
  name: 'Alice Smith',
  email: 'alice@example.com',
  phone: '+919876543210',
  address: {
    street: '123 Main St',
    city: 'Mumbai',
    state: 'MH',
    zipCode: '400001',
    country: 'India',
  },
  segment: 'VIP',
  lifetimeValue: 15000,
  totalOrders: 12,
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-06-01T08:00:00Z',
  ...overrides,
});

// Mirrors the export logic in customers/page.tsx
function buildCustomerExportRow(customer: Customer) {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email || '',
    phone: customer.phone,
    city: customer.address?.city || '',
    state: customer.address?.state || '',
    country: customer.address?.country || '',
    segment: customer.segment || '',
    lifetimeValue: customer.lifetimeValue,
    totalOrders: customer.totalOrders,
    createdAt: formatDateForCsv(customer.createdAt),
  };
}

const CUSTOMER_HEADERS = [
  'id', 'name', 'email', 'phone', 'city', 'state', 'country', 'segment', 'lifetimeValue', 'totalOrders', 'createdAt',
] as const;

const CUSTOMER_HEADER_LABELS = {
  id: 'ID',
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  city: 'City',
  state: 'State',
  country: 'Country',
  segment: 'Segment',
  lifetimeValue: 'Lifetime Value',
  totalOrders: 'Total Orders',
  createdAt: 'Created At',
};

describe('Customer CSV Export - correct columns', () => {
  it('should include all required column headers', () => {
    const exportData = [buildCustomerExportRow(makeCustomer())];
    const csv = arrayToCsv(exportData, CUSTOMER_HEADERS, CUSTOMER_HEADER_LABELS);
    const headerLine = csv.split('\n')[0].replace('\uFEFF', '');

    expect(headerLine).toBe('ID,Name,Email,Phone,City,State,Country,Segment,Lifetime Value,Total Orders,Created At');
  });

  it('should produce one data row per customer', () => {
    const customers = [makeCustomer({ id: 'c1' }), makeCustomer({ id: 'c2' })];
    const exportData = customers.map(buildCustomerExportRow);
    const csv = arrayToCsv(exportData, CUSTOMER_HEADERS, CUSTOMER_HEADER_LABELS);
    const lines = csv.split('\n');

    // header + 2 data rows
    expect(lines).toHaveLength(3);
  });
});

describe('Customer CSV Export - data formatting', () => {
  it('should extract city from address', () => {
    const row = buildCustomerExportRow(makeCustomer());
    expect(row.city).toBe('Mumbai');
  });

  it('should extract state from address', () => {
    const row = buildCustomerExportRow(makeCustomer());
    expect(row.state).toBe('MH');
  });

  it('should extract country from address', () => {
    const row = buildCustomerExportRow(makeCustomer());
    expect(row.country).toBe('India');
  });

  it('should use empty strings for city/state/country when address is missing', () => {
    const customer = makeCustomer({ address: undefined });
    const row = buildCustomerExportRow(customer);

    expect(row.city).toBe('');
    expect(row.state).toBe('');
    expect(row.country).toBe('');
  });

  it('should use empty string when email is missing', () => {
    const customer = makeCustomer({ email: undefined });
    const row = buildCustomerExportRow(customer);

    expect(row.email).toBe('');
  });

  it('should format createdAt as a readable date string', () => {
    const customer = makeCustomer({ createdAt: '2024-03-20T12:00:00Z' });
    const row = buildCustomerExportRow(customer);

    expect(row.createdAt).toMatch(/2024-03-20/);
  });

  it('should include numeric lifetimeValue and totalOrders as-is', () => {
    const customer = makeCustomer({ lifetimeValue: 9999.99, totalOrders: 7 });
    const row = buildCustomerExportRow(customer);

    expect(row.lifetimeValue).toBe(9999.99);
    expect(row.totalOrders).toBe(7);
  });
});

describe('Customer CSV Export - download triggered', () => {
  let mockLink: any;
  let createElementSpy: any;
  let appendChildSpy: any;
  let removeChildSpy: any;
  let createObjectURLSpy: any;
  let revokeObjectURLSpy: any;

  beforeEach(() => {
    mockLink = { setAttribute: vi.fn(), click: vi.fn(), style: {} };
    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockReturnValue(mockLink);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockReturnValue(mockLink);
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should trigger a download when downloadCsv is called', () => {
    const csv = arrayToCsv(
      [buildCustomerExportRow(makeCustomer())],
      CUSTOMER_HEADERS,
      CUSTOMER_HEADER_LABELS
    );
    downloadCsv(csv, 'customers_export');

    expect(mockLink.click).toHaveBeenCalledOnce();
    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'customers_export.csv');
  });

  it('should revoke the object URL after download', () => {
    downloadCsv('csv-content', 'customers');

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock');
  });
});

describe('Customer CSV Export - filename generation', () => {
  it('should generate a filename with customers prefix and timestamp', () => {
    const filename = generateCsvFilename('customers');

    expect(filename).toMatch(/^customers_\d{4}-\d{2}-\d{2}_\d{6}$/);
  });
});

describe('Customer CSV Export - error handling', () => {
  it('should produce an empty CSV (header only) when customer list is empty', () => {
    const csv = arrayToCsv([], CUSTOMER_HEADERS, CUSTOMER_HEADER_LABELS);
    const lines = csv.split('\n');

    expect(lines).toHaveLength(1);
    expect(lines[0].replace('\uFEFF', '')).toBe(
      'ID,Name,Email,Phone,City,State,Country,Segment,Lifetime Value,Total Orders,Created At'
    );
  });
});
