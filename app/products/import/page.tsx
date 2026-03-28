/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Product Bulk Import Page
 * 
 * Multi-step wizard for importing products from CSV:
 * 1. File upload with drag-and-drop
 * 2. CSV preview and validation
 * 3. Import confirmation
 * 4. Results (success summary or error report)
 * 
 * Requirements: 11.8, 11.9, 25.4, 25.5, 25.6, 25.7, 25.9
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { productsService } from '@/services/products.service';
import { parseCsvFile, readFileAsText, validateCsvFile, type ParsedCsvRow } from '@/utils/csv-import';
import { productFormSchema } from '@/types/forms';
import type { CreateProductRequest, BulkImportProductsResponse } from '@/types/api';
import { toast } from 'sonner';
import { 
  UploadIcon, 
  FileTextIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  AlertTriangleIcon,
  DownloadIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  Loader2Icon
} from 'lucide-react';
import { arrayToCsv, downloadCsv } from '@/utils/csv-export';

type ImportStep = 'upload' | 'preview' | 'validate' | 'results';

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export default function ProductImportPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthContext();
  
  // Step management
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // CSV data state
  const [csvData, setCsvData] = useState<ParsedCsvRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validProducts, setValidProducts] = useState<CreateProductRequest[]>([]);
  
  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportProductsResponse | null>(null);
  
  // Required CSV columns
  const requiredColumns = ['sku', 'name', 'category', 'price', 'stockQuantity', 'minStockLevel'];
  
  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file
    const validation = validateCsvFile(file, 10);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    
    setSelectedFile(file);
    
    try {
      // Read and parse CSV
      const content = await readFileAsText(file);
      const parseResult = parseCsvFile(content, requiredColumns);
      
      if (parseResult.errors.length > 0) {
        toast.error(parseResult.errors[0].message);
        return;
      }
      
      setCsvHeaders(parseResult.headers);
      setCsvData(parseResult.rows);
      setCurrentStep('preview');
      toast.success(`Loaded ${parseResult.rows.length} rows from CSV`);
    } catch (error) {
      toast.error('Failed to read CSV file');
      console.error(error);
    }
  }, []);
  
  /**
   * Handle drag and drop
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);
  
  /**
   * Validate CSV data against product schema
   */
  const validateCsvData = useCallback(() => {
    const errors: ValidationError[] = [];
    const valid: CreateProductRequest[] = [];
    const skuSet = new Set<string>();
    
    for (const parsedRow of csvData) {
      const { row, data } = parsedRow;
      
      // Map CSV data to product object
      const product: any = {
        sku: data.sku || data.SKU,
        name: data.name || data.Name,
        description: data.description || data.Description || undefined,
        category: data.category || data.Category,
        subCategory: data.subCategory || data.SubCategory || undefined,
        price: parseFloat(data.price || data.Price),
        costPrice: data.costPrice || data.CostPrice ? parseFloat(data.costPrice || data.CostPrice) : undefined,
        stockQuantity: parseInt(data.stockQuantity || data.StockQuantity || '0', 10),
        minStockLevel: parseInt(data.minStockLevel || data.MinStockLevel || '0', 10),
        barcode: data.barcode || data.Barcode || undefined,
        imageUrl: data.imageUrl || data.ImageUrl || undefined,
      };
      
      // Validate using Zod schema
      const result = productFormSchema.safeParse(product);
      
      if (!result.success) {
        // Collect validation errors
        result.error.issues.forEach(err => {
          errors.push({
            row,
            field: err.path.join('.'),
            message: err.message,
          });
        });
      } else {
        // Check SKU uniqueness within batch
        if (skuSet.has(product.sku)) {
          errors.push({
            row,
            field: 'sku',
            message: 'Duplicate SKU in import batch',
          });
        } else {
          skuSet.add(product.sku);
          valid.push(result.data);
        }
      }
    }
    
    setValidationErrors(errors);
    setValidProducts(valid);
    setCurrentStep('validate');
    
    if (errors.length === 0) {
      toast.success(`All ${valid.length} products validated successfully`);
    } else {
      toast.error(`Found ${errors.length} validation errors`);
    }
  }, [csvData]);
  
  /**
   * Perform bulk import
   */
  const handleImport = useCallback(async () => {
    if (validProducts.length === 0) {
      toast.error('No valid products to import');
      return;
    }
    
    setIsImporting(true);
    
    try {
      const response = await productsService.bulkImport({
        products: validProducts,
      });
      
      setImportResult(response.data);
      setCurrentStep('results');
      
      if (response.data.failed === 0) {
        toast.success(`Successfully imported ${response.data.imported} products`);
      } else {
        toast.warning(`Imported ${response.data.imported} products, ${response.data.failed} failed`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to import products');
      console.error(error);
    } finally {
      setIsImporting(false);
    }
  }, [validProducts]);
  
  /**
   * Download error report as CSV
   */
  const downloadErrorReport = useCallback(() => {
    if (validationErrors.length === 0) return;
    
    const errorData = validationErrors.map(err => ({
      row: err.row,
      field: err.field,
      error: err.message,
    }));
    
    const csv = arrayToCsv(
      errorData,
      ['row', 'field', 'error'],
      { row: 'Row', field: 'Field', error: 'Error' }
    );
    
    downloadCsv(csv, 'import-errors');
    toast.success('Error report downloaded');
  }, [validationErrors]);
  
  /**
   * Download CSV template
   */
  const downloadTemplate = useCallback(() => {
    const templateData = [
      {
        sku: 'PROD-001',
        name: 'Sample Product',
        description: 'Product description',
        category: 'Electronics',
        subCategory: 'Phones',
        price: '999.99',
        costPrice: '750.00',
        stockQuantity: '100',
        minStockLevel: '10',
        barcode: '1234567890123',
        imageUrl: 'https://example.com/image.jpg',
      },
    ];
    
    const csv = arrayToCsv(
      templateData,
      ['sku', 'name', 'description', 'category', 'subCategory', 'price', 'costPrice', 'stockQuantity', 'minStockLevel', 'barcode', 'imageUrl']
    );
    
    downloadCsv(csv, 'product-import-template');
    toast.success('Template downloaded');
  }, []);
  
  /**
   * Reset import process
   */
  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setValidationErrors([]);
    setValidProducts([]);
    setImportResult(null);
    setCurrentStep('upload');
  }, []);
  
  if (!isAuthenticated || !user) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/products')}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Products
              </button>
              <h1 className="text-xl font-bold text-gray-900">Import Products</h1>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { key: 'upload', label: 'Upload' },
              { key: 'preview', label: 'Preview' },
              { key: 'validate', label: 'Validate' },
              { key: 'results', label: 'Results' },
            ].map((step, index) => {
              const isActive = currentStep === step.key;
              const isCompleted = ['upload', 'preview', 'validate', 'results'].indexOf(currentStep) > index;
              
              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isActive ? 'border-blue-600 bg-blue-600 text-white' :
                      isCompleted ? 'border-green-600 bg-green-600 text-white' :
                      'border-gray-300 bg-white text-gray-500'
                    }`}>
                      {isCompleted ? <CheckCircleIcon className="h-5 w-5" /> : index + 1}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {index < 3 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Step Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* Step 1: Upload */}
          {currentStep === 'upload' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload CSV File</h2>
                <p className="text-gray-600">
                  Upload a CSV file containing product data. Maximum file size: 10MB.
                </p>
              </div>
              
              {/* Download Template Button */}
              <div className="flex justify-end">
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Download Template
                </button>
              </div>
              
              {/* Drag and Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <UploadIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drag and drop your CSV file here
                </p>
                <p className="text-sm text-gray-600 mb-4">or</p>
                <label className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
                  <input
                    type="file"
                    accept=".csv,text/csv,application/vnd.ms-excel"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="sr-only"
                  />
                  Browse Files
                </label>
              </div>
              
              {/* Required Columns Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Required Columns:</h3>
                <div className="flex flex-wrap gap-2">
                  {requiredColumns.map(col => (
                    <span key={col} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {col}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Optional columns: description, subCategory, costPrice, barcode, imageUrl
                </p>
              </div>
            </div>
          )}
          
          {/* Step 2: Preview */}
          {currentStep === 'preview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Preview CSV Data</h2>
                <p className="text-gray-600">
                  Review the first few rows of your CSV file before validation.
                </p>
              </div>
              
              {/* File Info */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <FileTextIcon className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile?.name}</p>
                    <p className="text-sm text-gray-600">
                      {csvData.length} rows • {csvHeaders.length} columns
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              
              {/* Preview Table */}
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Row
                      </th>
                      {csvHeaders.map(header => (
                        <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {csvData.slice(0, 5).map(({ row, data }) => (
                      <tr key={row}>
                        <td className="px-4 py-3 text-sm text-gray-500">{row}</td>
                        {csvHeaders.map(header => (
                          <td key={header} className="px-4 py-3 text-sm text-gray-900">
                            {data[header] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {csvData.length > 5 && (
                <p className="text-sm text-gray-600 text-center">
                  Showing first 5 of {csvData.length} rows
                </p>
              )}
              
              {/* Actions */}
              <div className="flex justify-between">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={validateCsvData}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Validate Data
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </button>
              </div>
            </div>
          )}
          
          {/* Step 3: Validate */}
          {currentStep === 'validate' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Validation Results</h2>
                <p className="text-gray-600">
                  {validationErrors.length === 0
                    ? 'All products passed validation and are ready to import.'
                    : 'Some products have validation errors. Fix the errors and try again.'}
                </p>
              </div>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Total Rows</p>
                      <p className="text-2xl font-bold text-blue-600">{csvData.length}</p>
                    </div>
                    <FileTextIcon className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-900">Valid Products</p>
                      <p className="text-2xl font-bold text-green-600">{validProducts.length}</p>
                    </div>
                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-900">Errors</p>
                      <p className="text-2xl font-bold text-red-600">{validationErrors.length}</p>
                    </div>
                    <XCircleIcon className="h-8 w-8 text-red-600" />
                  </div>
                </div>
              </div>
              
              {/* Error List */}
              {validationErrors.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Validation Errors</h3>
                    <button
                      onClick={downloadErrorReport}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      Download Report
                    </button>
                  </div>
                  
                  <div className="border border-red-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-red-200">
                      <thead className="bg-red-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-red-900 uppercase">Row</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-red-900 uppercase">Field</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-red-900 uppercase">Error</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-red-100">
                        {validationErrors.map((error, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900">{error.row}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-mono">{error.field}</td>
                            <td className="px-4 py-3 text-sm text-red-600">{error.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep('preview')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ArrowLeftIcon className="h-4 w-4 inline mr-2" />
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={validProducts.length === 0 || isImporting}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? (
                    <>
                      <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      Import {validProducts.length} Products
                      <ArrowRightIcon className="h-4 w-4 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* Step 4: Results */}
          {currentStep === 'results' && importResult && (
            <div className="space-y-6">
              <div className="text-center">
                {importResult.failed === 0 ? (
                  <>
                    <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Successful!</h2>
                    <p className="text-gray-600">
                      All products have been imported successfully.
                    </p>
                  </>
                ) : (
                  <>
                    <AlertTriangleIcon className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Completed with Errors</h2>
                    <p className="text-gray-600">
                      Some products could not be imported due to errors.
                    </p>
                  </>
                )}
              </div>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-900">Successfully Imported</p>
                      <p className="text-3xl font-bold text-green-600">{importResult.imported}</p>
                    </div>
                    <CheckCircleIcon className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-900">Failed</p>
                      <p className="text-3xl font-bold text-red-600">{importResult.failed}</p>
                    </div>
                    <XCircleIcon className="h-12 w-12 text-red-600" />
                  </div>
                </div>
              </div>
              
              {/* Error Details */}
              {importResult.errors.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Import Errors</h3>
                  <div className="border border-red-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-red-200">
                      <thead className="bg-red-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-red-900 uppercase">Row</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-red-900 uppercase">Errors</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-red-100">
                        {importResult.errors.map((error, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900">{error.row}</td>
                            <td className="px-4 py-3 text-sm text-red-600">
                              <ul className="list-disc list-inside">
                                {error.errors.map((err, i) => (
                                  <li key={i}>{err}</li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleReset}
                  className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Import More Products
                </button>
                <button
                  onClick={() => router.push('/products')}
                  className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  View Products
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
