/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  flexRender,
  Row,
} from '@tanstack/react-table';
import { List, RowComponentProps, useListRef } from 'react-window';

export interface VirtualizedDataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  height?: number;
  rowHeight?: number;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  onRowClick?: (row: TData) => void;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
  overscanCount?: number;
}

export function VirtualizedDataTable<TData>({
  data,
  columns,
  height = 600,
  rowHeight = 50,
  enableSorting = true,
  enableFiltering = true,
  onRowClick,
  className = '',
  emptyMessage = 'No data available',
  loading = false,
  overscanCount = 10,
}: VirtualizedDataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const listRef = useListRef(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    enableSorting,
    enableFilters: enableFiltering,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const rows = table.getRowModel().rows;

  // Calculate table width
  const [tableWidth, setTableWidth] = React.useState(0);

  React.useEffect(() => {
    if (tableContainerRef.current) {
      setTableWidth(tableContainerRef.current.offsetWidth);
    }

    const handleResize = () => {
      if (tableContainerRef.current) {
        setTableWidth(tableContainerRef.current.offsetWidth);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll to top when sorting or filtering changes
  React.useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToRow({ index: 0 });
    }
  }, [sorting, columnFilters, listRef]);

  // Row renderer for react-window
  const VirtualRow = ({ index, style, ariaAttributes }: RowComponentProps) => {
    const row = rows[index] as Row<TData>;

    return (
      <div
        style={style}
        className={`flex border-b border-gray-100 hover:bg-gray-50 transition-colors ${
          onRowClick ? 'cursor-pointer' : ''
        }`}
        onClick={() => onRowClick?.(row.original)}
        onKeyDown={(e) => {
          if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onRowClick(row.original);
          }
        }}
        tabIndex={onRowClick ? 0 : undefined}
        {...ariaAttributes}
      >
        {row.getVisibleCells().map((cell) => (
          <div
            key={cell.id}
            className="px-4 py-3 text-sm text-gray-900 flex items-center"
            style={{
              width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined,
              flex: cell.column.getSize() === 150 ? 1 : undefined,
            }}
            role="cell"
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center border border-gray-200 rounded-lg ${className}`}
        style={{ height: `${height}px` }}
      >
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`} ref={tableContainerRef}>
      {/* Responsive table wrapper with horizontal scroll */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        {/* Table header */}
        <div className="bg-gray-50 border-b border-gray-200">
          {table.getHeaderGroups().map((headerGroup) => (
            <div key={headerGroup.id} className="flex" role="row">
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sortDirection = header.column.getIsSorted();

                return (
                  <div
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
                    style={{
                      width: header.getSize() !== 150 ? header.getSize() : undefined,
                      flex: header.getSize() === 150 ? 1 : undefined,
                    }}
                    role="columnheader"
                    aria-sort={
                      sortDirection === 'asc'
                        ? 'ascending'
                        : sortDirection === 'desc'
                        ? 'descending'
                        : 'none'
                    }
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-2 ${
                          canSort ? 'cursor-pointer select-none hover:text-gray-900' : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                        onKeyDown={(e) => {
                          if (canSort && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            header.column.getToggleSortingHandler()?.(e as unknown as Event);
                          }
                        }}
                        role={canSort ? 'button' : undefined}
                        tabIndex={canSort ? 0 : undefined}
                        aria-label={
                          canSort
                            ? `Sort by ${header.column.columnDef.header as string}`
                            : undefined
                        }
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="text-gray-400" aria-hidden="true">
                            {sortDirection === 'asc' ? '↑' : sortDirection === 'desc' ? '↓' : '↕'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Virtualized table body */}
        {rows.length === 0 ? (
          <div
            className="flex items-center justify-center"
            style={{ height: `${height}px` }}
          >
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          <List
            listRef={listRef}
            defaultHeight={height}
            rowCount={rows.length}
            rowHeight={rowHeight}
            rowComponent={VirtualRow}
            rowProps={{}}
            overscanCount={overscanCount}
            style={{ width: tableWidth || '100%' }}
          />
        )}
      </div>

      {/* Row count info */}
      <div className="mt-2 text-sm text-gray-600">
        Showing {rows.length} of {data.length} rows
        {rows.length !== data.length && ' (filtered)'}
      </div>
    </div>
  );
}

export default VirtualizedDataTable;
