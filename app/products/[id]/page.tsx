/**
 * Product Detail Page
 * 
 * Displays complete product information including variants and stock status.
 * Provides Edit and Delete buttons with transaction history check.
 * Shows visual indicators for stock levels.
 * 
 * Requirements: 11.3, 11.4, 11.11
 */

'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { productsService } from '@/services/products.service';
import { Product } from '@/types/entities';
import { ArrowLeftIcon, EditIcon, TrashIcon, PackageIcon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch product data
  const { data: productData, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const response = await productsService.getById(productId);
      return response.data;
    },
    enabled: !!productId,
  });

  // Fetch transaction count
  const { data: transactionData } = useQuery({
    queryKey: ['product-transactions', productId],
    queryFn: async () => {
      const response = await productsService.checkProductTransactions(productId);
      return response.data;
    },
    enabled: !!productId,
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await productsService.delete(productId);
    },
    onSuccess: () => {
      // Invalidate products query to refresh list
      queryClient.invalidateQueries({ queryKey: ['products'] });

      toast.success('Product deleted successfully');
      router.push('/products');
    },
    onError: (error: any) => {
      console.error('Failed to delete product:', error);
      toast.error(error.response?.data?.message || 'Failed to delete product');
    },
  });

  const handleDelete = async () => {
    // Check if product has transactions
    if (transactionData && transactionData.count > 0) {
      toast.error(
        `Cannot delete product with transaction history. This product has ${transactionData.count} transaction(s).`
      );
      setShowDeleteConfirm(false);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync();
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Determine stock status
  const getStockStatus = (product: Product): 'out_of_stock' | 'low_stock' | 'in_stock' => {
    if (product.stockQuantity === 0) return 'out_of_stock';
    if (product.stockQuantity < product.minStockLevel) return 'low_stock';
    return 'in_stock';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">Failed to load product</p>
          <button
            onClick={() => router.push('/products')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus(productData);
  const isLowStock = stockStatus === 'low_stock';
  const isOutOfStock = stockStatus === 'out_of_stock';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/products')}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Back to products"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{productData.name}</h1>
                <p className="mt-1 text-sm text-gray-600">SKU: {productData.sku}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/products/${productId}/inventory-history`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PackageIcon className="h-4 w-4 mr-2" />
                Inventory History
              </button>
              <button
                onClick={() => router.push(`/products/${productId}/edit`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <EditIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Details Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <p className="mt-1 text-sm text-gray-900">{productData.category}</p>
                </div>

                {productData.subCategory && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Subcategory</p>
                    <p className="mt-1 text-sm text-gray-900">{productData.subCategory}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-500">Price</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    ₹{productData.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                {productData.costPrice && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Cost Price</p>
                    <p className="mt-1 text-sm text-gray-900">
                      ₹{productData.costPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}

                {productData.barcode && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Barcode</p>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{productData.barcode}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(productData.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Last Updated</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(productData.updatedAt), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              {productData.description && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="mt-2 text-sm text-gray-900">{productData.description}</p>
                </div>
              )}
            </div>

            {/* Variants Card */}
            {productData.variants && productData.variants.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Variants</h2>
                
                <div className="space-y-3">
                  {productData.variants.map((variant, index) => (
                    <div key={variant.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{variant.name}</p>
                        <p className="text-sm text-gray-600">SKU: {variant.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ₹{variant.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-gray-600">Stock: {variant.stockQuantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction History */}
            {transactionData && transactionData.count > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <PackageIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-900">Transaction History</h3>
                    <p className="mt-1 text-sm text-blue-700">
                      This product has {transactionData.count} transaction(s) and cannot be deleted.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stock Status Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock Status</h2>
              
              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center justify-center">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    isOutOfStock ? 'bg-red-100 text-red-800' :
                    isLowStock ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {isOutOfStock ? (
                      <>
                        <AlertTriangleIcon className="h-4 w-4 mr-2" />
                        Out of Stock
                      </>
                    ) : isLowStock ? (
                      <>
                        <AlertTriangleIcon className="h-4 w-4 mr-2" />
                        Low Stock
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        In Stock
                      </>
                    )}
                  </div>
                </div>

                {/* Stock Quantity */}
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{productData.stockQuantity}</p>
                  <p className="text-sm text-gray-500">Units Available</p>
                </div>

                {/* Min Stock Level */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Minimum Level</span>
                    <span className="text-sm font-medium text-gray-900">{productData.minStockLevel}</span>
                  </div>
                </div>

                {/* Stock Alert */}
                {isLowStock && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-start">
                      <AlertTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="ml-2">
                        <p className="text-sm text-yellow-800">
                          Stock is below minimum level. Consider restocking soon.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {isOutOfStock && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-start">
                      <AlertTriangleIcon className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="ml-2">
                        <p className="text-sm text-red-800">
                          Product is out of stock. Restock immediately.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Product Image */}
            {productData.imageUrl && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Image</h2>
                <img
                  src={productData.imageUrl}
                  alt={productData.name}
                  className="w-full h-auto rounded-md"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Product</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this product? This action cannot be undone.
              {transactionData && transactionData.count > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  Warning: This product has {transactionData.count} transaction(s) and cannot be deleted.
                </span>
              )}
            </p>
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || (transactionData && transactionData.count > 0)}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
