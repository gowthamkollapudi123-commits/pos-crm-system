/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, VirtualizedList, VirtualizedDataTable, Pagination } from './index';

/**
 * Data Display Components Examples
 * 
 * This file demonstrates how to use the data display components:
 * - Pagination
 * - DataTable (with TanStack Table)
 * - VirtualizedList (with react-window)
 * - VirtualizedDataTable (TanStack Table + react-window)
 */

// Sample data types
interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  lifetimeValue: number;
}

// Generate sample data
const generateProducts = (count: number): Product[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `prod-${i + 1}`,
    name: `Product ${i + 1}`,
    sku: `SKU-${String(i + 1).padStart(5, '0')}`,
    price: Math.random() * 1000 + 10,
    stock: Math.floor(Math.random() * 100),
    category: ['Electronics', 'Clothing', 'Food', 'Books'][Math.floor(Math.random() * 4)],
  }));
};

const generateCustomers = (count: number): Customer[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `cust-${i + 1}`,
    name: `Customer ${i + 1}`,
    email: `customer${i + 1}@example.com`,
    phone: `+1-555-${String(i + 1).padStart(4, '0')}`,
    totalOrders: Math.floor(Math.random() * 50),
    lifetimeValue: Math.random() * 10000,
  }));
};

// Example 1: Basic Pagination Component
export const PaginationExample: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalItems = 250;
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="p-6 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Pagination Example</h3>
      <p className="text-sm text-gray-600 mb-4">
        Current Page: {currentPage}, Page Size: {pageSize}
      </p>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageSizeChange={setPageSize}
        showPageSizeSelector={true}
        pageSizeOptions={[10, 25, 50, 100]}
      />
    </div>
  );
};

// Example 2: DataTable with Sorting and Filtering
export const DataTableExample: React.FC = () => {
  const products = generateProducts(50);

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'sku',
      header: 'SKU',
      size: 120,
    },
    {
      accessorKey: 'name',
      header: 'Product Name',
      size: 200,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      size: 120,
    },
    {
      accessorKey: 'price',
      header: 'Price',
      size: 100,
      cell: ({ getValue }) => `$${(getValue() as number).toFixed(2)}`,
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      size: 80,
      cell: ({ getValue }) => {
        const stock = getValue() as number;
        return (
          <span className={stock < 20 ? 'text-red-600 font-semibold' : ''}>
            {stock}
          </span>
        );
      },
    },
  ];

  return (
    <div className="p-6 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">DataTable Example</h3>
      <p className="text-sm text-gray-600 mb-4">
        Click column headers to sort. Includes pagination and responsive design.
      </p>
      <DataTable
        data={products}
        columns={columns}
        pageSize={10}
        showPagination={true}
        showPageSizeSelector={true}
        enableSorting={true}
        enableFiltering={true}
        onRowClick={(row) => console.log('Clicked row:', row)}
        emptyMessage="No products found"
      />
    </div>
  );
};

// Example 3: VirtualizedList for Large Datasets
export const VirtualizedListExample: React.FC = () => {
  const customers = generateCustomers(1000);

  const renderCustomerItem = (customer: Customer, index: number) => (
    <div className="px-4 py-3 flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-900">{customer.name}</p>
        <p className="text-sm text-gray-500">{customer.email}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">
          ${customer.lifetimeValue.toFixed(2)}
        </p>
        <p className="text-xs text-gray-500">{customer.totalOrders} orders</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">VirtualizedList Example</h3>
      <p className="text-sm text-gray-600 mb-4">
        Efficiently renders 1,000 customers using react-window. Only visible items are rendered.
      </p>
      <VirtualizedList
        data={customers}
        itemHeight={70}
        height={400}
        renderItem={renderCustomerItem}
        onItemClick={(customer) => console.log('Clicked customer:', customer)}
        emptyMessage="No customers found"
      />
    </div>
  );
};

// Example 4: VirtualizedDataTable for Large Datasets with Sorting
export const VirtualizedDataTableExample: React.FC = () => {
  const products = generateProducts(5000);

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'sku',
      header: 'SKU',
      size: 120,
    },
    {
      accessorKey: 'name',
      header: 'Product Name',
      size: 200,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      size: 120,
    },
    {
      accessorKey: 'price',
      header: 'Price',
      size: 100,
      cell: ({ getValue }) => `$${(getValue() as number).toFixed(2)}`,
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      size: 80,
      cell: ({ getValue }) => {
        const stock = getValue() as number;
        return (
          <span className={stock < 20 ? 'text-red-600 font-semibold' : ''}>
            {stock}
          </span>
        );
      },
    },
  ];

  return (
    <div className="p-6 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">VirtualizedDataTable Example</h3>
      <p className="text-sm text-gray-600 mb-4">
        Combines TanStack Table with react-window to efficiently render 5,000 products.
        Supports sorting and filtering.
      </p>
      <VirtualizedDataTable
        data={products}
        columns={columns}
        height={500}
        rowHeight={50}
        enableSorting={true}
        enableFiltering={true}
        onRowClick={(row) => console.log('Clicked row:', row)}
        emptyMessage="No products found"
      />
    </div>
  );
};

// Example 5: DataTable with Manual Pagination (for server-side pagination)
export const ServerSidePaginationExample: React.FC = () => {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Simulate server-side data fetching
  const totalItems = 500;
  const pageCount = Math.ceil(totalItems / pageSize);
  const products = generateProducts(pageSize); // In real app, fetch from API

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'sku',
      header: 'SKU',
      size: 120,
    },
    {
      accessorKey: 'name',
      header: 'Product Name',
      size: 200,
    },
    {
      accessorKey: 'price',
      header: 'Price',
      size: 100,
      cell: ({ getValue }) => `$${(getValue() as number).toFixed(2)}`,
    },
  ];

  const handlePaginationChange = (pagination: { pageIndex: number; pageSize: number }) => {
    setPageIndex(pagination.pageIndex);
    setPageSize(pagination.pageSize);
    // In real app: fetch data from API with new pagination params
    console.log('Fetch data for page:', pagination.pageIndex + 1, 'size:', pagination.pageSize);
  };

  return (
    <div className="p-6 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Server-Side Pagination Example</h3>
      <p className="text-sm text-gray-600 mb-4">
        DataTable with manual pagination for server-side data fetching.
      </p>
      <DataTable
        data={products}
        columns={columns}
        pageSize={pageSize}
        showPagination={true}
        showPageSizeSelector={true}
        manualPagination={true}
        pageCount={pageCount}
        onPaginationChange={handlePaginationChange}
      />
    </div>
  );
};

// Main demo component
export const DataDisplayDemo: React.FC = () => {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Data Display Components</h1>
        <p className="text-gray-600">
          Examples of Pagination, DataTable, VirtualizedList, and VirtualizedDataTable components
        </p>
      </div>

      <PaginationExample />
      <DataTableExample />
      <VirtualizedListExample />
      <VirtualizedDataTableExample />
      <ServerSidePaginationExample />
    </div>
  );
};

export default DataDisplayDemo;
