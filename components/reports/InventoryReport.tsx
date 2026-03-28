/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Inventory Report Component
 * 
 * Comprehensive inventory report showing current stock levels, low stock items,
 * inventory value, and stock distribution by category.
 * 
 * Requirements: 12.2
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { productsService } from '@/services/products.service';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { 
  PackageIcon, 
  DollarSignIcon, 
  AlertTriangleIcon,
  XCircleIcon,
} from 'lucide-react';
import { MetricCard, MetricCardGrid } from '@/components/dashboard';
import { arrayToCsv, downloadCsv, generateCsvFilename, formatCurrencyForCsv } from '@/utils/csv-export';
import { ReportExportBar } from './ReportExportBar';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import type { Product } from '@/types/entities';

interface InventoryReportProps {
  startDate: string;
  endDate: string;
}

// Color palette for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

// Stock status type
type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export function InventoryReport({ startDate, endDate }: InventoryReportProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Fetch all products - Requirement 12.2
  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ['inventory-report', 'products'],
    queryFn: async () => {
      const response = await productsService.getAll({
        page: 1,
        pageSize: 1000, // Get all products for report
        sortBy: 'name',
        sortOrder: 'asc' as const,
      });
      return response;
    },
  });

  // Calculate inventory metrics
  const inventoryMetrics = useMemo(() => {
    if (!productsData?.data) {
      return {
        totalProducts: 0,
        totalInventoryValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        inStockCount: 0,
      };
    }

    const products = productsData.data;
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let inStockCount = 0;

    products.forEach(product => {
      // Calculate inventory value
      totalValue += product.price * product.stockQuantity;

      // Count stock status
      if (product.stockQuantity === 0) {
        outOfStockCount++;
      } else if (product.stockQuantity < product.minStockLevel) {
        lowStockCount++;
      } else {
        inStockCount++;
      }
    });

    return {
      totalProducts: products.length,
      totalInventoryValue: totalValue,
      lowStockCount,
      outOfStockCount,
      inStockCount,
    };
  }, [productsData?.data]);

  // Get stock status for a product
  const getStockStatus = (product: Product): StockStatus => {
    if (product.stockQuantity === 0) return 'out_of_stock';
    if (product.stockQuantity < product.minStockLevel) return 'low_stock';
    return 'in_stock';
  };

  // Get low stock items - Requirement 12.2
  const lowStockItems = useMemo(() => {
    if (!productsData?.data) return [];
    return productsData.data
      .filter(product => {
        const status = getStockStatus(product);
        return status === 'low_stock' || status === 'out_of_stock';
      })
      .sort((a, b) => a.stockQuantity - b.stockQuantity);
  }, [productsData?.data]);

  // Calculate inventory by category
  const inventoryByCategory = useMemo(() => {
    if (!productsData?.data) return [];

    const categoryMap = new Map<string, { category: string; value: number; quantity: number; products: number }>();

    productsData.data.forEach(product => {
      const category = product.category || 'Uncategorized';
      const existing = categoryMap.get(category) || { category, value: 0, quantity: 0, products: 0 };
      
      existing.value += product.price * product.stockQuantity;
      existing.quantity += product.stockQuantity;
      existing.products += 1;
      
      categoryMap.set(category, existing);
    });

    return Array.from(categoryMap.values()).sort((a, b) => b.value - a.value);
  }, [productsData?.data]);

  // Calculate stock status distribution
  const stockStatusDistribution = useMemo(() => {
    return [
      { status: 'In Stock', count: inventoryMetrics.inStockCount, color: '#10b981' },
      { status: 'Low Stock', count: inventoryMetrics.lowStockCount, color: '#f59e0b' },
      { status: 'Out of Stock', count: inventoryMetrics.outOfStockCount, color: '#ef4444' },
    ].filter(item => item.count > 0);
  }, [inventoryMetrics]);

  // Handle CSV export
  const handleExportCsv = () => {
    if (!productsData?.data) {
      toast.error('No data available to export');
      return;
    }

    setIsExporting(true);

    try {
      // Prepare summary data
      const summaryData = [
        { metric: 'Total Products', value: inventoryMetrics.totalProducts.toString() },
        { metric: 'Total Inventory Value', value: formatCurrencyForCsv(inventoryMetrics.totalInventoryValue) },
        { metric: 'In Stock Products', value: inventoryMetrics.inStockCount.toString() },
        { metric: 'Low Stock Products', value: inventoryMetrics.lowStockCount.toString() },
        { metric: 'Out of Stock Products', value: inventoryMetrics.outOfStockCount.toString() },
        { metric: 'Report Date', value: format(new Date(), 'MMM dd, yyyy HH:mm') },
      ];

      // Prepare inventory by category data
      const categoryData = inventoryByCategory.map(item => ({
        category: item.category,
        products: item.products.toString(),
        quantity: item.quantity.toString(),
        value: formatCurrencyForCsv(item.value),
      }));

      // Prepare low stock items data
      const lowStockData = lowStockItems.map(product => ({
        sku: product.sku,
        name: product.name,
        category: product.category || 'Uncategorized',
        currentStock: product.stockQuantity.toString(),
        minStock: product.minStockLevel.toString(),
        status: getStockStatus(product) === 'out_of_stock' ? 'Out of Stock' : 'Low Stock',
        unitPrice: formatCurrencyForCsv(product.price),
        totalValue: formatCurrencyForCsv(product.price * product.stockQuantity),
      }));

      // Prepare all products data
      const allProductsData = productsData.data.map(product => ({
        sku: product.sku,
        name: product.name,
        category: product.category || 'Uncategorized',
        stockQuantity: product.stockQuantity.toString(),
        minStockLevel: product.minStockLevel.toString(),
        unitPrice: formatCurrencyForCsv(product.price),
        totalValue: formatCurrencyForCsv(product.price * product.stockQuantity),
        status: getStockStatus(product) === 'out_of_stock' ? 'Out of Stock' : 
                getStockStatus(product) === 'low_stock' ? 'Low Stock' : 'In Stock',
      }));

      // Generate CSV sections
      const summaryCsv = arrayToCsv(
        summaryData,
        ['metric', 'value'],
        { metric: 'Metric', value: 'Value' }
      );

      const categoryCsv = arrayToCsv(
        categoryData,
        ['category', 'products', 'quantity', 'value'],
        { category: 'Category', products: 'Products', quantity: 'Total Quantity', value: 'Total Value' }
      );

      const lowStockCsv = arrayToCsv(
        lowStockData,
        ['sku', 'name', 'category', 'currentStock', 'minStock', 'status', 'unitPrice', 'totalValue'],
        { 
          sku: 'SKU', 
          name: 'Product Name', 
          category: 'Category', 
          currentStock: 'Current Stock', 
          minStock: 'Min Stock', 
          status: 'Status',
          unitPrice: 'Unit Price',
          totalValue: 'Total Value'
        }
      );

      const allProductsCsv = arrayToCsv(
        allProductsData,
        ['sku', 'name', 'category', 'stockQuantity', 'minStockLevel', 'unitPrice', 'totalValue', 'status'],
        { 
          sku: 'SKU', 
          name: 'Product Name', 
          category: 'Category', 
          stockQuantity: 'Stock Quantity', 
          minStockLevel: 'Min Stock Level',
          unitPrice: 'Unit Price',
          totalValue: 'Total Value',
          status: 'Status'
        }
      );

      // Combine all sections
      const fullCsv = [
        'Inventory Report',
        '',
        'Summary Metrics',
        summaryCsv.replace('\uFEFF', ''),
        '',
        'Inventory by Category',
        categoryCsv.replace('\uFEFF', ''),
        '',
        'Low Stock & Out of Stock Items',
        lowStockCsv.replace('\uFEFF', ''),
        '',
        'All Products',
        allProductsCsv.replace('\uFEFF', ''),
      ].join('\n');

      const csvWithBom = '\uFEFF' + fullCsv;
      const filename = generateCsvFilename('inventory_report');
      downloadCsv(csvWithBom, filename);

      toast.success('Inventory report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export inventory report');
    } finally {
      setIsExporting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory report...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">
          Failed to load inventory report data. Please try again.
        </p>
      </div>
    );
  }

  if (!productsData?.data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Report</h2>
          <p className="mt-1 text-sm text-gray-600">
            Current stock levels as of {format(new Date(), 'MMM dd, yyyy HH:mm')}
          </p>
        </div>
        <ReportExportBar
          reportTitle="Inventory Report"
          onExportCsv={handleExportCsv}
          isExportingCsv={isExporting}
        />
      </div>

      {/* Key Metrics - Requirement 12.2 */}
      <MetricCardGrid>
        <MetricCard
          title="Total Products"
          value={inventoryMetrics.totalProducts}
          format="number"
          subtitle="Active products in catalog"
          icon={<PackageIcon className="h-5 w-5" />}
          bgColor="bg-blue-50"
          textColor="text-blue-700"
        />
        <MetricCard
          title="Total Inventory Value"
          value={inventoryMetrics.totalInventoryValue}
          format="currency"
          currency="INR"
          subtitle="Current stock value"
          icon={<DollarSignIcon className="h-5 w-5" />}
          bgColor="bg-green-50"
          textColor="text-green-700"
        />
        <MetricCard
          title="Low Stock Items"
          value={inventoryMetrics.lowStockCount}
          format="number"
          subtitle="Below minimum threshold"
          icon={<AlertTriangleIcon className="h-5 w-5" />}
          bgColor="bg-yellow-50"
          textColor="text-yellow-700"
        />
        <MetricCard
          title="Out of Stock Items"
          value={inventoryMetrics.outOfStockCount}
          format="number"
          subtitle="Requires restocking"
          icon={<XCircleIcon className="h-5 w-5" />}
          bgColor="bg-red-50"
          textColor="text-red-700"
        />
      </MetricCardGrid>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory by Category Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Inventory Value by Category
          </h3>
          {inventoryByCategory.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={inventoryByCategory}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="category"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    label={{ value: 'Value (₹)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                    formatter={(value, name) => {
                      if (name === 'value' && typeof value === 'number') {
                        return [`₹${value.toLocaleString('en-IN')}`, 'Value'];
                      }
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80">
              <p className="text-sm text-gray-500">No category data available</p>
            </div>
          )}
        </div>

        {/* Stock Status Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Stock Status Distribution
          </h3>
          {stockStatusDistribution.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockStatusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name ?? ''}: ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="status"
                  >
                    {stockStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`${value} products`, 'Count']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80">
              <p className="text-sm text-gray-500">No stock status data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Data Tables Section */}
      <div className="grid grid-cols-1 gap-6">
        {/* Category Breakdown Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Inventory by Category
          </h3>
          {inventoryByCategory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Products
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventoryByCategory.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.category}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {item.products}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {item.quantity.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        ₹{item.value.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No category data available
            </p>
          )}
        </div>

        {/* Low Stock Items Table - Requirement 12.2 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5 text-yellow-600" />
            Low Stock & Out of Stock Items
          </h3>
          {lowStockItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Min Stock
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lowStockItems.map((product) => {
                    const status = getStockStatus(product);
                    const isOutOfStock = status === 'out_of_stock';
                    
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                          {product.sku}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {product.category || 'Uncategorized'}
                        </td>
                        <td className={`px-4 py-3 text-sm text-right font-medium ${
                          isOutOfStock ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {product.stockQuantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 text-right">
                          {product.minStockLevel}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isOutOfStock ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
                <PackageIcon className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-900 font-medium">All products are well stocked!</p>
              <p className="text-sm text-gray-500 mt-1">
                No items are below minimum stock levels
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {inventoryMetrics.totalProducts === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            <PackageIcon className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No inventory data available
          </h3>
          <p className="text-sm text-gray-500">
            Add products to your catalog to see inventory reports.
          </p>
        </div>
      )}
    </div>
  );
}
