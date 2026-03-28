/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Products List Page
 * 
 * Displays product list with search, filters, sorting, and pagination.
 * Uses TanStack Table for data grid functionality.
 * Highlights low stock items with visual indicators.
 * Responsive layout: cards on mobile, table on desktop.
 * 
 * Requirements: 11.1, 11.6, 28.1
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useAuth } from '@/hooks';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { productsService } from '@/services/products.service';
import { Product } from '@/types/entities';
import { DataTable } from '@/components/ui/data-table';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { SearchIcon, FunnelIcon as FilterIcon, PlusIcon, PackageIcon, AlertTriangleIcon, UploadIcon, DownloadIcon } from 'lucide-react';
import { format } from 'date-fns';
import { arrayToCsv, downloadCsv, generateCsvFilename, formatDateForCsv } from '@/utils/csv-export';
import { toast } from 'sonner';

export default function ProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { logout } = useAuth();
  const { isOnline } = useNetworkStatus();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isExporting, setIsExporting] = useState(false);

  // Debounce search input (300ms) - Requirement 28.1
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch products with search and filters
  const { data: productsData, isLoading: productsLoading, error } = useQuery({
    queryKey: ['products', debouncedSearch, page, pageSize],
    queryFn: async () => {
      const params: any = {
        query: debouncedSearch || undefined,
        page,
        pageSize,
        sortBy: 'name',
        sortOrder: 'asc' as const,
      };

      const response = await productsService.getAll(params);
      return response;
    },
    enabled: isAuthenticated,
  });

  // Get unique categories from products
  const categories = useMemo(() => {
    if (!productsData?.data) return [];
    const uniqueCategories = Array.from(
      new Set(productsData.data.map(p => p.category).filter(Boolean))
    );
    return uniqueCategories.sort();
  }, [productsData?.data]);

  // Determine stock status
  const getStockStatus = (product: Product): 'out_of_stock' | 'low_stock' | 'in_stock' => {
    if (product.stockQuantity === 0) return 'out_of_stock';
    if (product.stockQuantity < product.minStockLevel) return 'low_stock';
    return 'in_stock';
  };

  // Filter products by stock status and category on client side
  const filteredProducts = useMemo(() => {
    if (!productsData?.data) return [];
    
    let filtered = productsData.data;

    // Apply stock status filter
    if (stockStatusFilter) {
      filtered = filtered.filter(product => {
        const status = getStockStatus(product);
        return status === stockStatusFilter;
      });
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    return filtered;
  }, [productsData?.data, stockStatusFilter, categoryFilter]);

  // Define table columns
  const columns = useMemo<ColumnDef<Product>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Product Name',
      cell: ({ row }) => {
        const isLowStock = getStockStatus(row.original) === 'low_stock';
        const isOutOfStock = getStockStatus(row.original) === 'out_of_stock';
        
        return (
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              isOutOfStock ? 'bg-red-100' : isLowStock ? 'bg-yellow-100' : 'bg-blue-100'
            }`}>
              <PackageIcon className={`h-4 w-4 ${
                isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <div className="font-medium">{row.original.name}</div>
              {(isLowStock || isOutOfStock) && (
                <div className="flex items-center gap-1 text-xs text-yellow-600">
                  <AlertTriangleIcon className="h-3 w-3" />
                  {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                </div>
              )}
            </div>
          </div>
        );
      },
      size: 250,
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.sku}</span>,
      size: 120,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => row.original.category || '-',
      size: 150,
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => `₹${row.original.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      size: 120,
    },
    {
      accessorKey: 'stockQuantity',
      header: 'Stock',
      cell: ({ row }) => {
        const status = getStockStatus(row.original);
        const isLowStock = status === 'low_stock';
        const isOutOfStock = status === 'out_of_stock';
        
        return (
          <div className="flex items-center gap-2">
            <span className={`font-medium ${
              isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-gray-900'
            }`}>
              {row.original.stockQuantity}
            </span>
            {isLowStock && (
              <span className="text-xs text-gray-500">
                (min: {row.original.minStockLevel})
              </span>
            )}
          </div>
        );
      },
      size: 130,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = getStockStatus(row.original);
        const statusConfig = {
          in_stock: { label: 'In Stock', color: 'bg-green-100 text-green-800' },
          low_stock: { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' },
          out_of_stock: { label: 'Out of Stock', color: 'bg-red-100 text-red-800' },
        };
        const config = statusConfig[status];
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
        );
      },
      size: 130,
    },
  ], []);

  // Handle CSV export - Requirement 25.2
  const handleExportCsv = useCallback(async () => {
    setIsExporting(true);
    try {
      // Fetch all products without pagination limit
      const response = await productsService.getAll({ pageSize: 10000, page: 1 });
      const allProducts = response.data;

      if (!allProducts || allProducts.length === 0) {
        toast.error('No products available to export');
        return;
      }

      const exportData = allProducts.map(product => ({
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
      }));

      const csv = arrayToCsv(
        exportData,
        ['id', 'sku', 'name', 'category', 'subCategory', 'price', 'costPrice', 'stockQuantity', 'minStockLevel', 'barcode', 'isActive', 'createdAt'],
        {
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
        }
      );

      const filename = generateCsvFilename('products');
      downloadCsv(csv, filename);
      toast.success(`Exported ${exportData.length} products successfully`);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export products');
    } finally {
      setIsExporting(false);
    }
  }, []);

  // Handle row click
  const handleRowClick = useCallback((product: Product) => {
    router.push(`/products/${product.id}`);
  }, [router]);

  // Handle add product
  const handleAddProduct = useCallback(() => {
    router.push('/products/new');
  }, [router]);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setStockStatusFilter('');
    setCategoryFilter('');
  }, []);

  // Check if any filters are active
  const hasActiveFilters = searchQuery || stockStatusFilter || categoryFilter;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-bold text-gray-900">Products</h1>
            </div>
            <div className="flex items-center space-x-4">
              <OfflineIndicator />
              <span className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{user.name}</span>
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header with Actions */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your product catalog and inventory levels
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportCsv}
                  disabled={isExporting}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <DownloadIcon className="h-5 w-5 mr-2" />
                      Export CSV
                    </>
                  )}
                </button>
                <button
                  onClick={() => router.push('/products/import')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <UploadIcon className="h-5 w-5 mr-2" />
                  Import Products
                </button>
                <button
                  onClick={handleAddProduct}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Product
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input - Requirement 28.1 */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, SKU, or category..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    aria-label="Search products"
                  />
                </div>
              </div>

              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  hasActiveFilters
                    ? 'border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
                aria-label="Toggle filters"
                aria-expanded={showFilters}
              >
                <FilterIcon className="h-5 w-5 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                    Active
                  </span>
                )}
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Stock Status Filter */}
                  <div>
                    <label htmlFor="stock-status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Status
                    </label>
                    <select
                      id="stock-status-filter"
                      value={stockStatusFilter}
                      onChange={(e) => setStockStatusFilter(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All</option>
                      <option value="in_stock">In Stock</option>
                      <option value="low_stock">Low Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      id="category-filter"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Clear Filters Button */}
                  <div className="flex items-end">
                    <button
                      onClick={handleClearFilters}
                      disabled={!hasActiveFilters}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                Failed to load products. {!isOnline && 'You are currently offline.'}
              </p>
            </div>
          )}

          {/* Product Count */}
          {productsData && (
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredProducts.length} of {productsData.pagination.totalItems} products
              {hasActiveFilters && ' (filtered)'}
            </div>
          )}

          {/* Desktop View: Table */}
          <div className="hidden md:block">
            <DataTable
              data={filteredProducts}
              columns={columns}
              pageSize={pageSize}
              onRowClick={handleRowClick}
              loading={productsLoading}
              emptyMessage="No products found. Try adjusting your search or filters."
              showPagination={true}
              showPageSizeSelector={true}
              pageSizeOptions={[10, 25, 50, 100]}
              manualPagination={false}
            />
          </div>

          {/* Mobile View: Cards */}
          <div className="md:hidden space-y-4">
            {productsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading products...</p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No products found. Try adjusting your search or filters.</p>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const status = getStockStatus(product);
                const isLowStock = status === 'low_stock';
                const isOutOfStock = status === 'out_of_stock';
                
                return (
                  <div
                    key={product.id}
                    onClick={() => handleRowClick(product)}
                    className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow ${
                      isLowStock ? 'border-l-4 border-yellow-500' : isOutOfStock ? 'border-l-4 border-red-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          isOutOfStock ? 'bg-red-100' : isLowStock ? 'bg-yellow-100' : 'bg-blue-100'
                        }`}>
                          <PackageIcon className={`h-6 w-6 ${
                            isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-500 font-mono">{product.sku}</p>
                        </div>
                      </div>
                      {(isLowStock || isOutOfStock) && (
                        <AlertTriangleIcon className={`h-5 w-5 ${
                          isOutOfStock ? 'text-red-600' : 'text-yellow-600'
                        }`} />
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Category:</span>
                        <span className="text-gray-900">{product.category || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Price:</span>
                        <span className="text-gray-900 font-medium">
                          ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Stock:</span>
                        <span className={`font-medium ${
                          isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-gray-900'
                        }`}>
                          {product.stockQuantity}
                          {isLowStock && ` (min: ${product.minStockLevel})`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Status:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isOutOfStock ? 'bg-red-100 text-red-800' : 
                          isLowStock ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'
                        }`}>
                          {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
