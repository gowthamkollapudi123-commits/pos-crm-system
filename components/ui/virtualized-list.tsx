/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useRef, useEffect } from 'react';
import { List, RowComponentProps, useListRef } from 'react-window';

export interface VirtualizedListProps<TData> {
  data: TData[];
  itemHeight: number;
  height: number | string;
  width?: number | string;
  renderItem: (item: TData, index: number) => React.ReactNode;
  onItemClick?: (item: TData, index: number) => void;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
  overscanCount?: number;
}

export function VirtualizedList<TData>({
  data,
  itemHeight,
  height,
  width = '100%',
  renderItem,
  onItemClick,
  className = '',
  emptyMessage = 'No items to display',
  loading = false,
  overscanCount = 5,
}: VirtualizedListProps<TData>) {
  const listRef = useListRef(null);

  // Convert height to number if it's a string with 'px'
  const getNumericHeight = (h: number | string): number => {
    if (typeof h === 'number') return h;
    if (typeof h === 'string' && h.endsWith('px')) {
      return parseInt(h.replace('px', ''), 10);
    }
    return 400; // Default fallback
  };

  const numericHeight = getNumericHeight(height);

  // Row renderer for react-window
  const RowComponent = ({ index, style, ariaAttributes }: RowComponentProps) => {
    const item = data[index];

    return (
      <div
        style={style}
        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
          onItemClick ? 'cursor-pointer' : ''
        }`}
        onClick={() => onItemClick?.(item, index)}
        onKeyDown={(e) => {
          if (onItemClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onItemClick(item, index);
          }
        }}
        tabIndex={onItemClick ? 0 : undefined}
        {...ariaAttributes}
      >
        {renderItem(item, index)}
      </div>
    );
  };

  // Scroll to top when data changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToRow({ index: 0 });
    }
  }, [data, listRef]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className} role="list" aria-label="Virtualized list">
      <List
        listRef={listRef}
        defaultHeight={numericHeight}
        rowCount={data.length}
        rowHeight={itemHeight}
        rowComponent={RowComponent}
        rowProps={{}}
        overscanCount={overscanCount}
        className="border border-gray-200 rounded-lg"
        style={{ height: numericHeight, width }}
      />
    </div>
  );
}

export default VirtualizedList;
