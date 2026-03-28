/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ProductSearch Component
 * 
 * Provides product search functionality with:
 * - Real-time search with debouncing (300ms)
 * - Barcode scanning support
 * - Product grid display
 * - Offline support via IndexedDB
 * 
 * Requirements: 7.1, 7.2, 7.6, 19.11, 28.1, 28.4, 15.4
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SearchIcon, ScanIcon, XIcon, Loader2Icon, PackageIcon } from 'lucide-react';
import { productsService } from '@/services/products.service';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getAll, search as searchIndexedDB, STORES } from '@/lib/indexeddb';
import type { Product } from '@/types/entities';
import { notifyError } from '@/utils/notifications';

interface ProductSearchProps {
  onProductSelect: (product: Product) => void;
}

export function ProductSearch({ onProductSelect }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [offlineProducts, setOfflineProducts] = useState<Product[]>([]);
  const { isOnline } = useNetworkStatus();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query (300ms) - Requirement 28.4
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch products from API when online - Requirement 7.1
  const { data: onlineData, isLoading: isLoadingOnline } = useQuery({
    queryKey: ['products', 'search', debouncedQuery],
    queryFn: async () => {
      const response = await productsService.getAll({
        query: debouncedQuery,
        pageSize: 50,
      });
      return response.data;
    },
    enabled: isOnline && debouncedQuery.length > 0,
    staleTime: 1000 * 60, // 1 minute
  });

  // Load offline products from IndexedDB - Requirement 15.4
  useEffect(() => {
    const loadOfflineProducts = async () => {
      try {
        if (!isOnline || debouncedQuery.length === 0) {
          const allProducts = await getAll(STORES.PRODUCTS);
          setOfflineProducts(allProducts);
        } else if (debouncedQuery.length > 0) {
          // Search in IndexedDB for offline mode
          const results = await searchIndexedDB(STORES.PRODUCTS, 'name', debouncedQuery);
          const barcodeResults = await searchIndexedDB(STORES.PRODUCTS, 'barcode', debouncedQuery);
          const skuResults = await searchIndexedDB(STORES.PRODUCTS, 'sku', debouncedQuery);
          
          // Combine and deduplicate results
          const combined = [...results, ...barcodeResults, ...skuResults];
          const unique = Array.from(new Map(combined.map(p => [p.id, p])).values());
          setOfflineProducts(unique);
        }
      } catch (error) {
        console.error('Failed to load offline products:', error);
        notifyError('Failed to load offline products');
      }
    };

    if (!isOnline) {
      loadOfflineProducts();
    }
  }, [isOnline, debouncedQuery]);

  // Get products to display based on online/offline status
  const products = isOnline ? (onlineData || []) : offlineProducts;
  const isLoading = isOnline ? isLoadingOnline : false;

  // Handle barcode scan - Requirement 7.6
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    try {
      if (isOnline) {
        const response = await productsService.searchByBarcode(barcode);
        if (response.data) {
          onProductSelect(response.data);
        }
      } else {
        // Search in offline cache
        const results = await searchIndexedDB(STORES.PRODUCTS, 'barcode', barcode);
        if (results.length > 0) {
          onProductSelect(results[0]);
        } else {
          notifyError('Product not found in offline cache');
        }
      }
    } catch (error) {
      console.error('Barcode scan failed:', error);
      notifyError('Failed to find product by barcode');
    } finally {
      setIsScanning(false);
    }
  }, [isOnline, onProductSelect]);

  // Simulate barcode scanner input (in real app, this would use camera or hardware scanner)
  const handleScanClick = () => {
    setIsScanning(true);
    const barcode = prompt('Enter barcode:');
    if (barcode) {
      handleBarcodeScan(barcode);
    } else {
      setIsScanning(false);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    searchInputRef.current?.focus();
  };

  // Handle product click - Requirement 7.2
  const handleProductClick = (product: Product) => {
    onProductSelect(product);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="flex-shrink-0 space-y-3 mb-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name, SKU, or barcode..."
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Search products"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <XIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Barcode Scanner Button */}
        <button
          onClick={handleScanClick}
          disabled={isScanning}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Scan barcode"
        >
          {isScanning ? (
            <>
              <Loader2Icon className="h-5 w-5 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <ScanIcon className="h-5 w-5" />
              Scan Barcode
            </>
          )}
        </button>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2Icon className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading products...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <PackageIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm">
                {searchQuery ? 'No products found' : 'Start typing to search products'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => handleProductClick(product)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

function ProductCard({ product, onClick }: ProductCardProps) {
  const isLowStock = product.stockQuantity <= product.minStockLevel;
  const isOutOfStock = product.stockQuantity === 0;

  return (
    <button
      onClick={onClick}
      disabled={isOutOfStock}
      className="flex flex-col bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:border-gray-200"
      aria-label={`Add ${product.name} to cart`}
    >
      {/* Product Image */}
      <div className="w-full aspect-square bg-gray-100 rounded-md mb-2 flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <PackageIcon className="h-12 w-12 text-gray-400" />
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1">
        <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 mb-2">SKU: {product.sku}</p>
        
        {/* Price */}
        <p className="text-lg font-bold text-gray-900 mb-2">
          ₹{product.price.toFixed(2)}
        </p>

        {/* Stock Status */}
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-medium px-2 py-1 rounded ${
              isOutOfStock
                ? 'bg-red-100 text-red-800'
                : isLowStock
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {isOutOfStock
              ? 'Out of Stock'
              : isLowStock
              ? 'Low Stock'
              : 'In Stock'}
          </span>
          <span className="text-xs text-gray-600">
            Qty: {product.stockQuantity}
          </span>
        </div>
      </div>
    </button>
  );
}
