/**
 * Low Stock Widget
 * 
 * Dashboard widget displaying low stock products.
 * Shows product details with stock levels and visual indicators.
 * 
 * Requirements: 11.6, 29.1
 */

'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangleIcon, PackageIcon, ArrowRightIcon } from 'lucide-react';
import { useLowStockProducts } from '@/hooks/useLowStockProducts';

export function LowStockWidget() {
  const router = useRouter();
  const { data, isLoading } = useLowStockProducts();

  const lowStockProducts = data?.products || [];
  const count = data?.count || 0;

  const handleProductClick = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  const handleViewAll = () => {
    router.push('/products?filter=low-stock');
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6" role="region" aria-label="Low Stock Alerts">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Low Stock Alerts
        </h3>
        <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6" role="region" aria-label="Low Stock Alerts">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Low Stock Alerts
        </h3>
        {count > 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            {count} {count === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {/* Content */}
      {count === 0 ? (
        <div className="text-center py-8">
          <PackageIcon className="h-12 w-12 mx-auto text-green-500 mb-3" />
          <p className="text-sm text-gray-600">All products well stocked</p>
          <p className="text-xs text-gray-500 mt-1">No low stock alerts</p>
        </div>
      ) : (
        <>
          {/* Product List */}
          <div className="space-y-3 mb-4">
            {lowStockProducts.slice(0, 5).map((product) => {
              // Determine severity based on stock percentage
              const severity = product.stockPercentage <= 25 ? 'critical' : 
                              product.stockPercentage <= 50 ? 'warning' : 'low';
              
              const bgColor = severity === 'critical' ? 'bg-red-50 border-red-200 hover:bg-red-100' :
                             severity === 'warning' ? 'bg-orange-50 border-orange-200 hover:bg-orange-100' :
                             'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
              
              const iconColor = severity === 'critical' ? 'text-red-600' :
                               severity === 'warning' ? 'text-orange-600' :
                               'text-yellow-600';

              return (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  className={`w-full text-left p-3 rounded-lg border ${bgColor} focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors`}
                  aria-label={`View details for ${product.name}`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangleIcon className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            SKU: {product.sku}
                          </p>
                        </div>
                        <ArrowRightIcon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">Stock Level</span>
                            <span className={`font-medium ${iconColor}`}>
                              {product.stockQuantity} / {product.minStockLevel}
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                severity === 'critical' ? 'bg-red-600' :
                                severity === 'warning' ? 'bg-orange-600' :
                                'bg-yellow-600'
                              }`}
                              style={{ width: `${Math.min(product.stockPercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* View All Link */}
          {count > 5 && (
            <div className="pt-3 border-t border-gray-200">
              <button
                onClick={handleViewAll}
                className="w-full text-sm font-medium text-orange-600 hover:text-orange-700 focus:outline-none focus:underline"
              >
                View all {count} low stock items
              </button>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleViewAll}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
            >
              Manage Inventory
            </button>
          </div>
        </>
      )}
    </div>
  );
}
