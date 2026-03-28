/**
 * useLowStockProducts Hook
 * 
 * Custom hook to fetch and manage low stock products.
 * Queries products where stockQuantity < minStockLevel.
 * Auto-refetches every 5 minutes to keep data fresh.
 * 
 * Requirements: 11.6, 29.1
 */

import { useQuery } from '@tanstack/react-query';
import { productsService } from '@/services/products.service';
import type { Product } from '@/types/entities';

export interface LowStockProduct extends Product {
  stockPercentage: number; // Percentage of stock remaining relative to minStockLevel
}

/**
 * Hook to fetch low stock products
 * 
 * @returns Query result with low stock products, count, loading and error states
 */
export function useLowStockProducts() {
  return useQuery({
    queryKey: ['products', 'low-stock'],
    queryFn: async () => {
      const response = await productsService.getLowStock();
      
      // Calculate stock percentage for each product
      const productsWithPercentage: LowStockProduct[] = response.data.map((product) => {
        const stockPercentage = product.minStockLevel > 0
          ? Math.round((product.stockQuantity / product.minStockLevel) * 100)
          : 0;
        
        return {
          ...product,
          stockPercentage,
        };
      });
      
      // Sort by stock percentage (most critical first)
      productsWithPercentage.sort((a, b) => a.stockPercentage - b.stockPercentage);
      
      return {
        products: productsWithPercentage,
        count: productsWithPercentage.length,
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });
}
