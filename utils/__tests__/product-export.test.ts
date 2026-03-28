/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Product Data Export Tests
 *
 * Tests for product CSV export: correct columns, data formatting,
 * download triggered, and error handling.
 *
 * Requirements: 25.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { arrayToCsv, downloadCsv, generateCsvFilename, formatDateForCsv } from '../csv-export';
import type { Product } from '../../types/entities';

// Minimal product fixture
const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'prod-001',
  tenantId: 'tenant-1',
  sku: 'SKU-001',
  name: 'Widget Pro',
  category: 'Electronics',
  subCategory: 'Gadgets',
  price: 499.99,
  costPrice: 250.0,
  stockQuantity: 100,
  minStockLevel: 10,
  barcode: '1234567890123',
  isActive: true,
  createdAt: '2024-02-10T09:00:00Z',
  updatedAt: '2024-06-01T08:00:00Z',
  ...overrides,
});

// Mirrors the export logic in products/page.tsx
function buildProductExportRow(product: Product) {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    category: product.category,
    subCategory: product.subCategory || '',
    price: product.price,
    costPrice: product.costPrice ?? '',
    stockQuantity: product.stockQuantity,
    minStockLevel: product.minStockLevel,
    barcode: product.barcode || '',
    isActive: product.isActive ? 'Yes' : 'No',
    createdAt: formatDateForCsv(product.createdAt),
  };
}

const PRODUCT_HEADERS = [
  'id', 'sku', 'name', 'category', 'subCategory', 'price', 'costPrice',
  'stockQuantity', 'minStockLevel', 'barcode', 'isActive', 'createdAt',
] as const;

const PRODUCT_HEADER_LABELS = {
  id: 'ID',
  sku: 'SKU',
  name: 'Name',
  category: 'Category',
  subCategory: 'Sub-Category',
  price: 'Price',
  costPrice: 'Cost Price',
  stockQuantity: 'Stock Quantity',
  minStockLevel: 'Min Stock Level',
  barcode: 'Barcode',
  isActive: 'Is Active',
  createdAt: 'Created At',
};

describe('Product CSV Export - correct columns', () => {
  it('should include all required column headers', () => {
    const exportData = [buildProductExportRow(makeProduct())];
    const csv = arrayToCsv(exportData, PRODUCT_HEADERS, PRODUCT_HEADER_LABELS);
    const headerLine = csv.split('\n')[0].replace('\uFEFF', '');

    expect(headerLine).toBe(
      'ID,SKU,Name,Category,Sub-Category,Price,Cost Price,Stock Quantity,Min Stock Level,Barcode,Is Active,Created At'
    );
  });

  it('should produce one data row per product', () => {
    const products = [makeProduct({ id: 'p1' }), makeProduct({ id: 'p2' })];
    const exportData = products.map(buildProductExportRow);
    const csv = arrayToCsv(exportData, PRODUCT_HEADERS, PRODUCT_HEADER_LABELS);
    const lines = csv.split('\n');

    // header + 2 data rows
    expect(lines).toHaveLength(3);
  });
});

describe('Product CSV Export - data formatting', () => {
  it('should format isActive as "Yes" for active products', () => {
    const row = buildProductExportRow(makeProduct({ isActive: true }));
    expect(row.isActive).toBe('Yes');
  });

  it('should format isActive as "No" for inactive products', () => {
    const row = buildProductExportRow(makeProduct({ isActive: false }));
    expect(row.isActive).toBe('No');
  });

  it('should use empty string when subCategory is missing', () => {
    const row = buildProductExportRow(makeProduct({ subCategory: undefined }));
    expect(row.subCategory).toBe('');
  });

  it('should use empty string when barcode is missing', () => {
    const row = buildProductExportRow(makeProduct({ barcode: undefined }));
    expect(row.barcode).toBe('');
  });

  it('should use empty string when costPrice is missing', () => {
    const row = buildProductExportRow(makeProduct({ costPrice: undefined }));
    expect(row.costPrice).toBe('');
  });

  it('should format createdAt as a readable date string', () => {
    const row = buildProductExportRow(makeProduct({ createdAt: '2024-05-01T00:00:00Z' }));
    expect(row.createdAt).toMatch(/2024-05-01/);
  });

  it('should include numeric price and stock values as-is', () => {
    const row = buildProductExportRow(makeProduct({ price: 1299.5, stockQuantity: 42 }));
    expect(row.price).toBe(1299.5);
    expect(row.stockQuantity).toBe(42);
  });

  it('should escape product names containing commas in CSV output', () => {
    const product = makeProduct({ name: 'Widget, Deluxe Edition' });
    const exportData = [buildProductExportRow(product)];
    const csv = arrayToCsv(exportData, PRODUCT_HEADERS, PRODUCT_HEADER_LABELS);
    const dataLine = csv.split('\n')[1];

    // Name field contains a comma so it must be quoted
    expect(dataLine).toContain('"Widget, Deluxe Edition"');
  });
});

describe('Product CSV Export - download triggered', () => {
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
      [buildProductExportRow(makeProduct())],
      PRODUCT_HEADERS,
      PRODUCT_HEADER_LABELS
    );
    downloadCsv(csv, 'products_export');

    expect(mockLink.click).toHaveBeenCalledOnce();
    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'products_export.csv');
  });

  it('should revoke the object URL after download', () => {
    downloadCsv('csv-content', 'products');

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock');
  });
});

describe('Product CSV Export - filename generation', () => {
  it('should generate a filename with products prefix and timestamp', () => {
    const filename = generateCsvFilename('products');

    expect(filename).toMatch(/^products_\d{4}-\d{2}-\d{2}_\d{6}$/);
  });
});

describe('Product CSV Export - error handling', () => {
  it('should produce an empty CSV (header only) when product list is empty', () => {
    const csv = arrayToCsv([], PRODUCT_HEADERS, PRODUCT_HEADER_LABELS);
    const lines = csv.split('\n');

    expect(lines).toHaveLength(1);
    expect(lines[0].replace('\uFEFF', '')).toBe(
      'ID,SKU,Name,Category,Sub-Category,Price,Cost Price,Stock Quantity,Min Stock Level,Barcode,Is Active,Created At'
    );
  });
});
