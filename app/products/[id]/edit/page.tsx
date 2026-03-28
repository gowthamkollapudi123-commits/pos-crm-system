/**
 * Product Edit Page
 * 
 * Form for editing existing product records with validation.
 * Pre-populates form with existing product data.
 * Validates SKU uniqueness, price format, and stock quantity.
 * Supports product categories, subcategories, and variants.
 * 
 * Requirements: 11.3, 11.7, 11.10, 11.11
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { productsService } from '@/services/products.service';
import { productFormSchema, type ProductFormData } from '@/types/forms';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Product } from '@/types/entities';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from 'lucide-react';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skuCheckLoading, setSkuCheckLoading] = useState(false);

  // Fetch product data
  const { data: productData, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const response = await productsService.getById(productId);
      return response.data;
    },
    enabled: !!productId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
    watch,
    setError,
    clearErrors,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
  });

  // Field array for variants
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  const skuValue = watch('sku');

  // Populate form with product data
  useEffect(() => {
    if (productData) {
      reset({
        sku: productData.sku,
        name: productData.name,
        description: productData.description || '',
        category: productData.category,
        subCategory: productData.subCategory || '',
        price: productData.price,
        costPrice: productData.costPrice,
        stockQuantity: productData.stockQuantity,
        minStockLevel: productData.minStockLevel,
        barcode: productData.barcode || '',
        imageUrl: productData.imageUrl || '',
        variants: productData.variants?.map(v => ({ name: v.name, value: v.attributes.value || '' })) || [],
      });
    }
  }, [productData, reset]);

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await productsService.update(productId, data);
      return response.data;
    },
    onSuccess: async (product: Product) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });

      toast.success('Product updated successfully');
      router.push(`/products/${productId}`);
    },
    onError: (error: any) => {
      console.error('Failed to update product:', error);
      toast.error(error.response?.data?.message || 'Failed to update product');
    },
  });

  // Check SKU uniqueness (excluding current product)
  const checkSkuUniqueness = async (sku: string) => {
    if (!sku || sku.length < 1 || sku === productData?.sku) return;
    
    setSkuCheckLoading(true);
    try {
      const response = await productsService.checkSkuUniqueness(sku, productId);
      if (!response.data.isUnique) {
        setError('sku', {
          type: 'manual',
          message: 'SKU already exists. Please use a unique SKU.',
        });
      } else {
        clearErrors('sku');
      }
    } catch (error) {
      console.error('Failed to check SKU uniqueness:', error);
    } finally {
      setSkuCheckLoading(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);

    try {
      // Clean up empty optional fields
      if (!data.description) data.description = undefined;
      if (!data.subCategory) data.subCategory = undefined;
      if (!data.costPrice) data.costPrice = undefined;
      if (!data.barcode) data.barcode = undefined;
      if (!data.imageUrl) data.imageUrl = undefined;
      if (!data.variants || data.variants.length === 0) data.variants = undefined;

      await updateMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/products/${productId}`)}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Back to product details"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
              <p className="mt-1 text-sm text-gray-600">
                Update product information and inventory details
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              {/* SKU */}
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                  SKU <span className="text-red-500">*</span>
                </label>
                <input
                  id="sku"
                  type="text"
                  {...register('sku')}
                  onBlur={(e) => checkSkuUniqueness(e.target.value)}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                    errors.sku
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="PROD-001"
                  aria-invalid={errors.sku ? 'true' : 'false'}
                  aria-describedby={errors.sku ? 'sku-error' : undefined}
                />
                {errors.sku && (
                  <p id="sku-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.sku.message}
                  </p>
                )}
                {skuCheckLoading && (
                  <p className="mt-1 text-xs text-gray-500">Checking SKU availability...</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Use alphanumeric characters and hyphens only
                </p>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name')}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                    errors.name
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Premium Coffee Beans"
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  {...register('description')}
                  rows={3}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                    errors.description
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Product description..."
                  aria-invalid={errors.description ? 'true' : 'false'}
                  aria-describedby={errors.description ? 'description-error' : undefined}
                />
                {errors.description && (
                  <p id="description-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Category and Subcategory */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="category"
                    type="text"
                    {...register('category')}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                      errors.category
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Beverages"
                    aria-invalid={errors.category ? 'true' : 'false'}
                    aria-describedby={errors.category ? 'category-error' : undefined}
                  />
                  {errors.category && (
                    <p id="category-error" className="mt-1 text-sm text-red-600" role="alert">
                      {errors.category.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="subCategory" className="block text-sm font-medium text-gray-700 mb-1">
                    Subcategory
                  </label>
                  <input
                    id="subCategory"
                    type="text"
                    {...register('subCategory')}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                      errors.subCategory
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Coffee"
                    aria-invalid={errors.subCategory ? 'true' : 'false'}
                    aria-describedby={errors.subCategory ? 'subCategory-error' : undefined}
                  />
                  {errors.subCategory && (
                    <p id="subCategory-error" className="mt-1 text-sm text-red-600" role="alert">
                      {errors.subCategory.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Barcode */}
              <div>
                <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-1">
                  Barcode
                </label>
                <input
                  id="barcode"
                  type="text"
                  {...register('barcode')}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                    errors.barcode
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="1234567890123"
                  aria-invalid={errors.barcode ? 'true' : 'false'}
                  aria-describedby={errors.barcode ? 'barcode-error' : undefined}
                />
                {errors.barcode && (
                  <p id="barcode-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.barcode.message}
                  </p>
                )}
              </div>

              {/* Image URL */}
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  id="imageUrl"
                  type="url"
                  {...register('imageUrl')}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                    errors.imageUrl
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="https://example.com/image.jpg"
                  aria-invalid={errors.imageUrl ? 'true' : 'false'}
                  aria-describedby={errors.imageUrl ? 'imageUrl-error' : undefined}
                />
                {errors.imageUrl && (
                  <p id="imageUrl-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.imageUrl.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register('price', { valueAsNumber: true })}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                    errors.price
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="99.99"
                  aria-invalid={errors.price ? 'true' : 'false'}
                  aria-describedby={errors.price ? 'price-error' : undefined}
                />
                {errors.price && (
                  <p id="price-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.price.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Maximum 2 decimal places
                </p>
              </div>

              {/* Cost Price */}
              <div>
                <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Price (₹)
                </label>
                <input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  {...register('costPrice', { valueAsNumber: true })}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                    errors.costPrice
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="49.99"
                  aria-invalid={errors.costPrice ? 'true' : 'false'}
                  aria-describedby={errors.costPrice ? 'costPrice-error' : undefined}
                />
                {errors.costPrice && (
                  <p id="costPrice-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.costPrice.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Inventory Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stock Quantity */}
              <div>
                <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  id="stockQuantity"
                  type="number"
                  {...register('stockQuantity', { valueAsNumber: true })}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                    errors.stockQuantity
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="100"
                  aria-invalid={errors.stockQuantity ? 'true' : 'false'}
                  aria-describedby={errors.stockQuantity ? 'stockQuantity-error' : undefined}
                />
                {errors.stockQuantity && (
                  <p id="stockQuantity-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.stockQuantity.message}
                  </p>
                )}
              </div>

              {/* Min Stock Level */}
              <div>
                <label htmlFor="minStockLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Stock Level <span className="text-red-500">*</span>
                </label>
                <input
                  id="minStockLevel"
                  type="number"
                  {...register('minStockLevel', { valueAsNumber: true })}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                    errors.minStockLevel
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="10"
                  aria-invalid={errors.minStockLevel ? 'true' : 'false'}
                  aria-describedby={errors.minStockLevel ? 'minStockLevel-error' : undefined}
                />
                {errors.minStockLevel && (
                  <p id="minStockLevel-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.minStockLevel.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Variants Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Product Variants</h2>
                <p className="text-sm text-gray-600">Add variants like size, color, etc. (optional)</p>
              </div>
              <button
                type="button"
                onClick={() => append({ name: '', value: '' })}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Variant
              </button>
            </div>

            {fields.length > 0 && (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <input
                        {...register(`variants.${index}.name` as const)}
                        placeholder="Variant name (e.g., Size)"
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                          errors.variants?.[index]?.name
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                      />
                      {errors.variants?.[index]?.name && (
                        <p className="mt-1 text-sm text-red-600" role="alert">
                          {errors.variants[index]?.name?.message}
                        </p>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        {...register(`variants.${index}.value` as const)}
                        placeholder="Variant value (e.g., Large)"
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                          errors.variants?.[index]?.value
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                      />
                      {errors.variants?.[index]?.value && (
                        <p className="mt-1 text-sm text-red-600" role="alert">
                          {errors.variants[index]?.value?.message}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      aria-label="Remove variant"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {fields.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No variants added. Click &quot;Add Variant&quot; to create product variations.
              </p>
            )}
          </div>

          {/* Offline Warning */}
          {!isOnline && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                You are currently offline. Changes will be saved when you reconnect to the internet.
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push(`/products/${productId}`)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || skuCheckLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
