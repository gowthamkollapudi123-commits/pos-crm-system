# Data Display Components

This document describes the data display components created for the POS CRM System, including Pagination, DataTable, VirtualizedList, and VirtualizedDataTable.

## Overview

The data display components provide efficient and accessible ways to display large datasets with features like:
- **Pagination**: Navigate through pages of data
- **Sorting**: Click column headers to sort data
- **Filtering**: Filter data by column values
- **Virtualization**: Efficiently render large lists (100+ items) using react-window
- **Responsive Design**: Tables scroll horizontally on small screens
- **Accessibility**: Full keyboard navigation and ARIA labels

## Components

### 1. Pagination

A fully accessible pagination control with page size selection.

#### Features
- First, previous, next, and last page buttons
- Page number buttons with ellipsis for large page counts
- Page size selector (items per page)
- Shows current range (e.g., "Showing 1 to 10 of 100 items")
- Keyboard accessible
- ARIA labels for screen readers

#### Props

```typescript
interface PaginationProps {
  currentPage: number;           // Current page (1-indexed)
  totalPages: number;             // Total number of pages
  onPageChange: (page: number) => void;  // Callback when page changes
  pageSize?: number;              // Items per page (default: 10)
  totalItems?: number;            // Total number of items
  onPageSizeChange?: (pageSize: number) => void;  // Callback when page size changes
  pageSizeOptions?: number[];     // Available page sizes (default: [10, 25, 50, 100])
  showPageSizeSelector?: boolean; // Show page size dropdown (default: false)
  disabled?: boolean;             // Disable all controls (default: false)
  className?: string;             // Additional CSS classes
}
```

#### Usage

```tsx
import { Pagination } from '@/components/ui';

function MyComponent() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalItems = 250;
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      pageSize={pageSize}
      totalItems={totalItems}
      onPageSizeChange={setPageSize}
      showPageSizeSelector={true}
    />
  );
}
```

### 2. DataTable

A feature-rich data table built with TanStack Table, supporting sorting, filtering, and pagination.

#### Features
- Column sorting (click headers)
- Column filtering
- Pagination with page size selection
- Row selection (optional)
- Row click handler
- Responsive horizontal scroll
- Loading and empty states
- Manual or automatic pagination/sorting/filtering
- Keyboard accessible
- ARIA labels

#### Props

```typescript
interface DataTableProps<TData> {
  data: TData[];                  // Array of data to display
  columns: ColumnDef<TData, any>[]; // TanStack Table column definitions
  pageSize?: number;              // Items per page (default: 10)
  showPagination?: boolean;       // Show pagination controls (default: true)
  showPageSizeSelector?: boolean; // Show page size dropdown (default: true)
  pageSizeOptions?: number[];     // Available page sizes (default: [10, 25, 50, 100])
  enableSorting?: boolean;        // Enable column sorting (default: true)
  enableFiltering?: boolean;      // Enable column filtering (default: true)
  enableRowSelection?: boolean;   // Enable row selection (default: false)
  onRowClick?: (row: TData) => void; // Callback when row is clicked
  className?: string;             // Additional CSS classes
  emptyMessage?: string;          // Message when no data (default: "No data available")
  loading?: boolean;              // Show loading state (default: false)
  manualPagination?: boolean;     // Use manual pagination (default: false)
  manualSorting?: boolean;        // Use manual sorting (default: false)
  manualFiltering?: boolean;      // Use manual filtering (default: false)
  pageCount?: number;             // Total pages for manual pagination
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  onSortingChange?: (sorting: SortingState) => void;
  onFilteringChange?: (filters: ColumnFiltersState) => void;
}
```

#### Usage

```tsx
import { DataTable } from '@/components/ui';
import { ColumnDef } from '@tanstack/react-table';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

function ProductList() {
  const products: Product[] = [...]; // Your data

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: 'Product Name',
      size: 200,
    },
    {
      accessorKey: 'price',
      header: 'Price',
      size: 100,
      cell: ({ getValue }) => `$${getValue().toFixed(2)}`,
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      size: 80,
    },
  ];

  return (
    <DataTable
      data={products}
      columns={columns}
      pageSize={10}
      showPagination={true}
      enableSorting={true}
      onRowClick={(product) => console.log('Clicked:', product)}
    />
  );
}
```

#### Server-Side Pagination Example

```tsx
function ProductListWithServerPagination() {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Fetch data from API
  const { data, isLoading } = useQuery({
    queryKey: ['products', pageIndex, pageSize],
    queryFn: () => fetchProducts(pageIndex, pageSize),
  });

  const handlePaginationChange = (pagination) => {
    setPageIndex(pagination.pageIndex);
    setPageSize(pagination.pageSize);
  };

  return (
    <DataTable
      data={data?.items || []}
      columns={columns}
      loading={isLoading}
      manualPagination={true}
      pageCount={data?.totalPages}
      onPaginationChange={handlePaginationChange}
    />
  );
}
```

### 3. VirtualizedList

A virtualized list component using react-window for efficiently rendering large lists (100+ items).

#### Features
- Only renders visible items (performance optimization)
- Smooth scrolling
- Configurable item height
- Custom item renderer
- Item click handler
- Loading and empty states
- Keyboard accessible

#### Props

```typescript
interface VirtualizedListProps<TData> {
  data: TData[];                  // Array of data to display
  itemHeight: number;             // Height of each item in pixels
  height: number | string;        // Total height of the list
  width?: number | string;        // Width of the list (default: '100%')
  renderItem: (item: TData, index: number) => React.ReactNode; // Item renderer
  onItemClick?: (item: TData, index: number) => void; // Callback when item is clicked
  className?: string;             // Additional CSS classes
  emptyMessage?: string;          // Message when no data (default: "No items to display")
  loading?: boolean;              // Show loading state (default: false)
  overscanCount?: number;         // Number of items to render outside viewport (default: 5)
}
```

#### Usage

```tsx
import { VirtualizedList } from '@/components/ui';

interface Customer {
  id: string;
  name: string;
  email: string;
}

function CustomerList() {
  const customers: Customer[] = [...]; // Large array (1000+ items)

  const renderCustomer = (customer: Customer, index: number) => (
    <div className="px-4 py-3">
      <p className="font-medium">{customer.name}</p>
      <p className="text-sm text-gray-500">{customer.email}</p>
    </div>
  );

  return (
    <VirtualizedList
      data={customers}
      itemHeight={70}
      height={600}
      renderItem={renderCustomer}
      onItemClick={(customer) => console.log('Clicked:', customer)}
    />
  );
}
```

### 4. VirtualizedDataTable

Combines TanStack Table with react-window for efficiently rendering large datasets (1000+ rows) with sorting and filtering.

#### Features
- Virtualized rendering (only visible rows rendered)
- Column sorting
- Column filtering
- Responsive horizontal scroll
- Loading and empty states
- Row click handler
- Keyboard accessible
- ARIA labels

#### Props

```typescript
interface VirtualizedDataTableProps<TData> {
  data: TData[];                  // Array of data to display
  columns: ColumnDef<TData, any>[]; // TanStack Table column definitions
  height?: number;                // Height of the table in pixels (default: 600)
  rowHeight?: number;             // Height of each row in pixels (default: 50)
  enableSorting?: boolean;        // Enable column sorting (default: true)
  enableFiltering?: boolean;      // Enable column filtering (default: true)
  onRowClick?: (row: TData) => void; // Callback when row is clicked
  className?: string;             // Additional CSS classes
  emptyMessage?: string;          // Message when no data (default: "No data available")
  loading?: boolean;              // Show loading state (default: false)
  overscanCount?: number;         // Number of rows to render outside viewport (default: 10)
}
```

#### Usage

```tsx
import { VirtualizedDataTable } from '@/components/ui';
import { ColumnDef } from '@tanstack/react-table';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

function LargeProductList() {
  const products: Product[] = [...]; // Large array (5000+ items)

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: 'Product Name',
      size: 200,
    },
    {
      accessorKey: 'price',
      header: 'Price',
      size: 100,
      cell: ({ getValue }) => `$${getValue().toFixed(2)}`,
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      size: 80,
    },
  ];

  return (
    <VirtualizedDataTable
      data={products}
      columns={columns}
      height={600}
      rowHeight={50}
      enableSorting={true}
      onRowClick={(product) => console.log('Clicked:', product)}
    />
  );
}
```

## When to Use Each Component

### Use Pagination
- When you need standalone pagination controls
- For custom layouts where you manage the data display separately

### Use DataTable
- For datasets with < 100 rows
- When you need full pagination with page size selection
- When you need both client-side and server-side pagination
- For standard table layouts with sorting and filtering

### Use VirtualizedList
- For lists with 100+ items
- When you need custom item rendering (not a table)
- For mobile-friendly list views
- When performance is critical

### Use VirtualizedDataTable
- For datasets with 1000+ rows
- When you need table layout with sorting/filtering
- When performance is critical
- For inventory lists, transaction logs, etc.

## Accessibility Features

All components include:
- ✅ Keyboard navigation (Tab, Enter, Space, Arrow keys)
- ✅ ARIA labels and roles
- ✅ Focus indicators
- ✅ Screen reader announcements
- ✅ Semantic HTML structure

## Performance Considerations

### DataTable
- Use `manualPagination` for server-side pagination with large datasets
- Limit client-side data to < 1000 rows for best performance
- Use `React.memo` for custom cell renderers

### VirtualizedList & VirtualizedDataTable
- Only renders visible items (huge performance gain)
- Use for lists with 100+ items
- Set appropriate `overscanCount` (default: 5-10)
- Keep `itemHeight`/`rowHeight` consistent for smooth scrolling

## Responsive Design

All components are mobile-responsive:
- Tables scroll horizontally on small screens
- Pagination controls stack vertically on mobile
- Touch-friendly click targets (44px minimum)
- Optimized for screens from 320px to 4K

## Requirements Satisfied

This implementation satisfies the following requirements:

- **18.11**: Custom Pagination controls ✅
- **18.12**: TanStack Table for all data tables ✅
- **19.5**: react-window for lists exceeding 100 items ✅
- **20.7**: Responsive tables with horizontal scroll ✅
- **8.9**: TanStack Table for customer list with pagination ✅
- **8.10**: react-window for virtualized rendering of large customer lists ✅
- **10.10**: TanStack Table for orders list with sorting and pagination ✅
- **26.1-26.8**: Accessibility compliance (ARIA, keyboard navigation, focus indicators) ✅

## Examples

See `data-display-examples.tsx` for complete working examples of all components.

## Testing

To test the components:

1. Import the demo component:
   ```tsx
   import { DataDisplayDemo } from '@/components/ui/data-display-examples';
   ```

2. Add to a page:
   ```tsx
   export default function TestPage() {
     return <DataDisplayDemo />;
   }
   ```

3. Test features:
   - Click column headers to sort
   - Use pagination controls
   - Change page size
   - Test keyboard navigation (Tab, Enter, Space)
   - Test on mobile devices
   - Test with screen readers

## Notes

- All components use TypeScript for type safety
- Components follow shadcn/ui design patterns
- Tailwind CSS is used for styling
- Components are fully accessible (WCAG 2.1 AA)
- Performance optimized for large datasets
