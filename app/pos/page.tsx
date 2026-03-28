/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * POS Billing Page
 * 
 * Point of Sale billing interface with product search and shopping cart.
 * Implements two-column layout with responsive design for mobile devices.
 * 
 * Requirements: 20.1, 20.2, 20.3
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useShoppingCart } from '@/hooks/useShoppingCart';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { ProductSearch } from '@/components/pos/ProductSearch';
import { ShoppingCart } from '@/components/pos/ShoppingCart';
import { PaymentModal, type PaymentResult } from '@/components/pos/PaymentModal';
import { ArrowLeftIcon, SearchIcon, ShoppingCartIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Product, Order, OrderItem } from '@/types/entities';
import { OrderStatus, PaymentStatus } from '@/types/enums';
import { create as createInDB, STORES } from '@/lib/indexeddb';
import { saveTransactionOffline } from '@/lib/indexeddb-helpers';
import { createReceiptData, printReceipt, downloadReceiptText } from '@/utils/receipt';
import type { SyncQueueItem } from '@/lib/indexeddb';

export default function POSBillingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { isOnline } = useNetworkStatus();
  const [activeTab, setActiveTab] = useState<'search' | 'cart'>('search');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);
  
  // Shopping cart state management
  const {
    items,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    applyDiscountCode,
    getItemCount,
  } = useShoppingCart();

  // Handle product selection - add to cart
  const handleProductSelect = (product: Product) => {
    addToCart(product, 1);
    toast.success(`${product.name} added to cart`);
    
    // On mobile, switch to cart tab after adding product
    if (window.innerWidth < 1024) {
      setActiveTab('cart');
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    // Calculate total from cart
    const taxRate = 0.18;
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const discount = 0; // TODO: Get from cart state if discount applied
    const taxableAmount = subtotal - discount;
    const tax = taxableAmount * taxRate;
    const total = taxableAmount + tax;

    setCartTotal(total);
    setIsPaymentModalOpen(true);
  };

  // Handle payment completion
  const handlePaymentComplete = async (result: PaymentResult) => {
    if (result.success && result.transactionId) {
      try {
        // Create order object from cart items
        const order: Order = {
          id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          tenantId: user?.tenantId || 'default',
          orderNumber: `ORD-${Date.now()}`,
          customerId: undefined, // Could be set if customer is selected
          customer: undefined,
          items: items.map((item): OrderItem => ({
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            productId: item.product.id,
            product: item.product,
            variantId: undefined,
            quantity: item.quantity,
            unitPrice: item.product.price,
            totalPrice: item.product.price * item.quantity,
            discount: 0,
          })),
          subtotal: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
          taxAmount: cartTotal - items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
          discountAmount: 0, // TODO: Get from cart state if discount applied
          totalAmount: cartTotal,
          status: OrderStatus.COMPLETED,
          paymentMethod: result.paymentMethod,
          paymentStatus: PaymentStatus.SUCCESS,
          paymentTransactionId: result.transactionId,
          notes: undefined,
          createdBy: user?.id || 'unknown',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // If offline, store transaction in IndexedDB and add to sync queue
        // Stock updates will be queued for sync when online
        if (!isOnline) {
          await saveTransactionOffline(order);
          
          // Queue stock updates for each item
          for (const item of items) {
            const stockUpdateItem: SyncQueueItem = {
              id: `stock-sync-${Date.now()}-${item.product.id}`,
              operation: 'update',
              storeName: STORES.PRODUCTS,
              data: {
                productId: item.product.id,
                quantity: -item.quantity,
                movementType: 'sale',
                referenceId: order.id,
                referenceType: 'transaction',
                notes: `POS transaction ${order.orderNumber}`,
              },
              timestamp: Date.now(),
              retryCount: 0,
            };
            await createInDB(STORES.SYNC_QUEUE, stockUpdateItem);
          }
          
          toast.success(
            `Payment successful! Transaction saved offline and will sync when online. Stock updates queued.`,
            { duration: 5000 }
          );
        } else {
          // If online, store in IndexedDB for local record and stock updates happen on server
          await createInDB(STORES.TRANSACTIONS, order);
          toast.success(`Payment successful! Transaction ID: ${result.transactionId}. Stock levels updated.`);
        }

        // Generate and display receipt
        const receiptData = createReceiptData(order, result.transactionId);
        
        // Show receipt options
        toast.success(
          'Transaction completed successfully!',
          {
            duration: 5000,
            action: {
              label: 'View Receipt',
              onClick: () => printReceipt(receiptData),
            },
          }
        );

        // Clear cart after successful payment
        clearCart();
        
        // Switch to search tab on mobile
        if (window.innerWidth < 1024) {
          setActiveTab('search');
        }
      } catch (error) {
        console.error('Failed to complete transaction:', error);
        toast.error('Transaction completed but failed to save locally. Please contact support.');
      }
    } else {
      toast.error(result.error || 'Payment failed. Please try again.');
    }
    
    setIsPaymentModalOpen(false);
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Navigation - Requirement 20.1: Mobile-first responsive design */}
      <nav className="bg-white shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Back to dashboard"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">POS Billing</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <OfflineIndicator />
              {items.length > 0 && (
                <div className="relative">
                  <ShoppingCartIcon className="h-5 w-5 text-gray-600" />
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {getItemCount()}
                  </span>
                </div>
              )}
              <span className="hidden sm:inline text-sm text-gray-700">
                <span className="font-medium">{user.name}</span>
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Tab Navigation - Requirement 20.3: Adapt layout for mobile viewports */}
      <div className="lg:hidden bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 px-4 text-center font-medium text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
              activeTab === 'search'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-label="Product search tab"
          >
            <SearchIcon className="h-5 w-5 inline-block mr-2" />
            Products
          </button>
          <button
            onClick={() => setActiveTab('cart')}
            className={`flex-1 py-3 px-4 text-center font-medium text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
              activeTab === 'cart'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-label="Shopping cart tab"
          >
            <ShoppingCartIcon className="h-5 w-5 inline-block mr-2" />
            Cart
          </button>
        </div>
      </div>

      {/* Main Content Area - Two Column Layout */}
      {/* Requirement 20.2: Fully functional on screen sizes from 320px to 4K */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Desktop: Two columns side by side, Mobile: Stacked with tabs */}
          <div className="h-full flex flex-col lg:flex-row gap-4 lg:gap-6">
            
            {/* Left Column: Product Search Area */}
            {/* Requirement 20.3: Stack form fields vertically on mobile */}
            <div 
              className={`
                flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden
                ${activeTab === 'search' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'}
              `}
              role="region"
              aria-label="Product search area"
            >
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Product Search
                </h2>
                <p className="text-sm text-gray-600">
                  Search and select products to add to cart
                </p>
              </div>
              
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                {/* Product Search Component - Task 8.2 */}
                <ProductSearch onProductSelect={handleProductSelect} />
              </div>
            </div>

            {/* Right Column: Shopping Cart Area */}
            <div 
              className={`
                w-full lg:w-96 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden
                ${activeTab === 'cart' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'}
              `}
              role="region"
              aria-label="Shopping cart area"
            >
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Shopping Cart
                </h2>
                <p className="text-sm text-gray-600">
                  Review items and complete checkout
                </p>
              </div>
              
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                {/* Shopping Cart Component - Task 8.3 */}
                <ShoppingCart
                  items={items}
                  onUpdateQuantity={updateQuantity}
                  onRemoveItem={removeItem}
                  onApplyDiscount={applyDiscountCode}
                  taxRate={0.18}
                  onCheckout={handleCheckout}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={cartTotal}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
}
