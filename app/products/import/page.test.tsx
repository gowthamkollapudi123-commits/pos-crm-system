/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Product Import Page Tests
 * 
 * Tests the bulk import workflow including file upload, validation, and import
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProductImportPage from './page';
import { productsService } from '@/services/products.service';
import * as csvImport from '@/utils/csv-import';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock('@/components/providers/AuthProvider', () => ({
  useAuthContext: () => ({
    user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock('@/services/products.service', () => ({
  productsService: {
    bulkImport: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('ProductImportPage', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });
  
  const renderPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ProductImportPage />
      </QueryClientProvider>
    );
  };
  
  it('should render upload step initially', () => {
    renderPage();
    
    expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop your CSV file here')).toBeInTheDocument();
    expect(screen.getByText('Download Template')).toBeInTheDocument();
  });
  
  it('should display required columns', () => {
    renderPage();
    
    expect(screen.getByText('Required Columns:')).toBeInTheDocument();
    expect(screen.getByText('sku')).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('category')).toBeInTheDocument();
    expect(screen.getByText('price')).toBeInTheDocument();
    expect(screen.getByText('stockQuantity')).toBeInTheDocument();
    expect(screen.getByText('minStockLevel')).toBeInTheDocument();
  });
  
  it('should show step indicator with correct states', () => {
    renderPage();
    
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('Validate')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
  });
  
  it('should validate file type on upload', async () => {
    const { toast } = await import('sonner');
    renderPage();
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText('Browse Files') as HTMLInputElement;
    
    // Mock validateCsvFile to return invalid
    vi.spyOn(csvImport, 'validateCsvFile').mockReturnValue({
      valid: false,
      error: 'Only CSV files are allowed',
    });
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Only CSV files are allowed');
    });
  });
  
  it('should validate file size on upload', async () => {
    const { toast } = await import('sonner');
    renderPage();
    
    const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
    const file = new File([largeContent], 'test.csv', { type: 'text/csv' });
    const input = screen.getByLabelText('Browse Files') as HTMLInputElement;
    
    // Mock validateCsvFile to return invalid
    vi.spyOn(csvImport, 'validateCsvFile').mockReturnValue({
      valid: false,
      error: 'File size must be less than 10MB',
    });
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('File size must be less than 10MB');
    });
  });
  
  it('should parse and preview CSV file', async () => {
    const { toast } = await import('sonner');
    renderPage();
    
    const csvContent = `sku,name,category,price,stockQuantity,minStockLevel
PROD-001,Product 1,Electronics,99.99,100,10
PROD-002,Product 2,Electronics,149.99,50,5`;
    
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const input = screen.getByLabelText('Browse Files') as HTMLInputElement;
    
    // Mock file reading
    vi.spyOn(csvImport, 'validateCsvFile').mockReturnValue({ valid: true });
    vi.spyOn(csvImport, 'readFileAsText').mockResolvedValue(csvContent);
    vi.spyOn(csvImport, 'parseCsvFile').mockReturnValue({
      headers: ['sku', 'name', 'category', 'price', 'stockQuantity', 'minStockLevel'],
      rows: [
        { row: 2, data: { sku: 'PROD-001', name: 'Product 1', category: 'Electronics', price: '99.99', stockQuantity: '100', minStockLevel: '10' } },
        { row: 3, data: { sku: 'PROD-002', name: 'Product 2', category: 'Electronics', price: '149.99', stockQuantity: '50', minStockLevel: '5' } },
      ],
      errors: [],
    });
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Loaded 2 rows from CSV');
      expect(screen.getByText('Preview CSV Data')).toBeInTheDocument();
    });
  });
  
  it('should detect validation errors', async () => {
    const { toast } = await import('sonner');
    renderPage();
    
    const csvContent = `sku,name,category,price,stockQuantity,minStockLevel
PROD-001,Product 1,Electronics,99.99,100,10`;
    
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const input = screen.getByLabelText('Browse Files') as HTMLInputElement;
    
    vi.spyOn(csvImport, 'validateCsvFile').mockReturnValue({ valid: true });
    vi.spyOn(csvImport, 'readFileAsText').mockResolvedValue(csvContent);
    vi.spyOn(csvImport, 'parseCsvFile').mockReturnValue({
      headers: ['sku', 'name', 'category', 'price', 'stockQuantity', 'minStockLevel'],
      rows: [
        { row: 2, data: { sku: 'PROD-001', name: 'Product 1', category: 'Electronics', price: '99.99', stockQuantity: '100', minStockLevel: '10' } },
      ],
      errors: [],
    });
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('Preview CSV Data')).toBeInTheDocument();
    });
    
    // Click validate button
    const validateButton = screen.getByText('Validate Data');
    fireEvent.click(validateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Validation Results')).toBeInTheDocument();
    });
  });
  
  it('should handle successful import', async () => {
    const { toast } = await import('sonner');
    const mockBulkImport = vi.mocked(productsService.bulkImport);
    
    mockBulkImport.mockResolvedValue({
      success: true,
      data: {
        imported: 2,
        failed: 0,
        errors: [],
      },
      timestamp: new Date().toISOString(),
    });
    
    renderPage();
    
    const csvContent = `sku,name,category,price,stockQuantity,minStockLevel
PROD-001,Product 1,Electronics,99.99,100,10
PROD-002,Product 2,Electronics,149.99,50,5`;
    
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const input = screen.getByLabelText('Browse Files') as HTMLInputElement;
    
    vi.spyOn(csvImport, 'validateCsvFile').mockReturnValue({ valid: true });
    vi.spyOn(csvImport, 'readFileAsText').mockResolvedValue(csvContent);
    vi.spyOn(csvImport, 'parseCsvFile').mockReturnValue({
      headers: ['sku', 'name', 'category', 'price', 'stockQuantity', 'minStockLevel'],
      rows: [
        { row: 2, data: { sku: 'PROD-001', name: 'Product 1', category: 'Electronics', price: '99.99', stockQuantity: '100', minStockLevel: '10' } },
        { row: 3, data: { sku: 'PROD-002', name: 'Product 2', category: 'Electronics', price: '149.99', stockQuantity: '50', minStockLevel: '5' } },
      ],
      errors: [],
    });
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('Preview CSV Data')).toBeInTheDocument();
    });
    
    // Click validate
    fireEvent.click(screen.getByText('Validate Data'));
    
    await waitFor(() => {
      expect(screen.getByText('Validation Results')).toBeInTheDocument();
    });
    
    // Click import
    const importButton = screen.getByText(/Import \d+ Products/);
    fireEvent.click(importButton);
    
    await waitFor(() => {
      expect(mockBulkImport).toHaveBeenCalled();
      expect(screen.getByText('Import Successful!')).toBeInTheDocument();
      expect(toast.success).toHaveBeenCalledWith('Successfully imported 2 products');
    });
  });
  
  it('should handle import with errors', async () => {
    const { toast } = await import('sonner');
    const mockBulkImport = vi.mocked(productsService.bulkImport);
    
    mockBulkImport.mockResolvedValue({
      success: true,
      data: {
        imported: 1,
        failed: 1,
        errors: [
          { row: 3, errors: ['SKU already exists'] },
        ],
      },
      timestamp: new Date().toISOString(),
    });
    
    renderPage();
    
    const csvContent = `sku,name,category,price,stockQuantity,minStockLevel
PROD-001,Product 1,Electronics,99.99,100,10
PROD-002,Product 2,Electronics,149.99,50,5`;
    
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const input = screen.getByLabelText('Browse Files') as HTMLInputElement;
    
    vi.spyOn(csvImport, 'validateCsvFile').mockReturnValue({ valid: true });
    vi.spyOn(csvImport, 'readFileAsText').mockResolvedValue(csvContent);
    vi.spyOn(csvImport, 'parseCsvFile').mockReturnValue({
      headers: ['sku', 'name', 'category', 'price', 'stockQuantity', 'minStockLevel'],
      rows: [
        { row: 2, data: { sku: 'PROD-001', name: 'Product 1', category: 'Electronics', price: '99.99', stockQuantity: '100', minStockLevel: '10' } },
        { row: 3, data: { sku: 'PROD-002', name: 'Product 2', category: 'Electronics', price: '149.99', stockQuantity: '50', minStockLevel: '5' } },
      ],
      errors: [],
    });
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('Preview CSV Data')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Validate Data'));
    
    await waitFor(() => {
      expect(screen.getByText('Validation Results')).toBeInTheDocument();
    });
    
    const importButton = screen.getByText(/Import \d+ Products/);
    fireEvent.click(importButton);
    
    await waitFor(() => {
      expect(screen.getByText('Import Completed with Errors')).toBeInTheDocument();
      expect(toast.warning).toHaveBeenCalledWith('Imported 1 products, 1 failed');
    });
  });
  
  it('should allow resetting the import process', async () => {
    renderPage();
    
    const csvContent = `sku,name,category,price,stockQuantity,minStockLevel
PROD-001,Product 1,Electronics,99.99,100,10`;
    
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const input = screen.getByLabelText('Browse Files') as HTMLInputElement;
    
    vi.spyOn(csvImport, 'validateCsvFile').mockReturnValue({ valid: true });
    vi.spyOn(csvImport, 'readFileAsText').mockResolvedValue(csvContent);
    vi.spyOn(csvImport, 'parseCsvFile').mockReturnValue({
      headers: ['sku', 'name', 'category', 'price', 'stockQuantity', 'minStockLevel'],
      rows: [
        { row: 2, data: { sku: 'PROD-001', name: 'Product 1', category: 'Electronics', price: '99.99', stockQuantity: '100', minStockLevel: '10' } },
      ],
      errors: [],
    });
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('Preview CSV Data')).toBeInTheDocument();
    });
    
    // Click cancel/reset
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    await waitFor(() => {
      expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
    });
  });
});
