/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unit tests for receipt generation utility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateReceiptText,
  generateReceiptHTML,
  downloadReceiptText,
  printReceipt,
  createReceiptData,
  type ReceiptData,
} from '../receipt';
import type { Order, OrderItem } from '@/types/entities';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@/types/enums';

describe('Receipt Generation Utility', () => {
  const mockReceiptData: ReceiptData = {
    orderNumber: 'ORD-123456',
    transactionId: 'TXN-789012',
    date: 'Jan 1, 2024, 10:30 AM',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        product: {
          id: 'prod-1',
          tenantId: 'tenant-1',
          sku: 'SKU-001',
          name: 'Test Product 1',
          category: 'Electronics',
          price: 100,
          stockQuantity: 10,
          minStockLevel: 5,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        quantity: 2,
        unitPrice: 100,
        totalPrice: 200,
      },
      {
        id: 'item-2',
        productId: 'prod-2',
        product: {
          id: 'prod-2',
          tenantId: 'tenant-1',
          sku: 'SKU-002',
          name: 'Test Product 2',
          category: 'Accessories',
          price: 50,
          stockQuantity: 20,
          minStockLevel: 10,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        quantity: 1,
        unitPrice: 50,
        totalPrice: 50,
      },
    ],
    subtotal: 250,
    taxAmount: 45,
    discountAmount: 10,
    totalAmount: 285,
    paymentMethod: 'CARD',
    businessInfo: {
      name: 'Test Store',
      address: '123 Test St, Test City',
      phone: '+1234567890',
      taxId: 'TAX123456',
    },
    customerInfo: {
      name: 'John Doe',
      phone: '+9876543210',
    },
  };

  describe('generateReceiptText', () => {
    it('should generate receipt text with all details', () => {
      const text = generateReceiptText(mockReceiptData);

      expect(text).toContain('TEST STORE');
      expect(text).toContain('123 Test St, Test City');
      expect(text).toContain('Order #: ORD-123456');
      expect(text).toContain('Transaction ID: TXN-789012');
      expect(text).toContain('Payment: CARD');
      expect(text).toContain('Customer: John Doe');
      expect(text).toContain('Test Product 1');
      expect(text).toContain('Test Product 2');
      expect(text).toContain('₹250.00');
      expect(text).toContain('₹285.00');
      expect(text).toContain('Thank you for your business!');
    });

    it('should handle receipt without business info', () => {
      const dataWithoutBusiness = { ...mockReceiptData, businessInfo: undefined };
      const text = generateReceiptText(dataWithoutBusiness);

      expect(text).toContain('SALES RECEIPT');
      expect(text).not.toContain('TEST STORE');
    });

    it('should handle receipt without customer info', () => {
      const dataWithoutCustomer = { ...mockReceiptData, customerInfo: undefined };
      const text = generateReceiptText(dataWithoutCustomer);

      expect(text).not.toContain('Customer:');
      expect(text).toContain('Order #: ORD-123456');
    });

    it('should handle receipt without discount', () => {
      const dataWithoutDiscount = { ...mockReceiptData, discountAmount: 0 };
      const text = generateReceiptText(dataWithoutDiscount);

      expect(text).not.toContain('Discount:');
      expect(text).toContain('Subtotal:');
      expect(text).toContain('Tax (18%):');
    });

    it('should truncate long product names', () => {
      const dataWithLongName = {
        ...mockReceiptData,
        items: [
          {
            ...mockReceiptData.items[0],
            product: {
              ...mockReceiptData.items[0].product!,
              name: 'This is a very long product name that should be truncated',
            },
          },
        ],
      };
      const text = generateReceiptText(dataWithLongName);

      expect(text).toContain('...');
    });
  });

  describe('generateReceiptHTML', () => {
    it('should generate valid HTML receipt', () => {
      const html = generateReceiptHTML(mockReceiptData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('</html>');
      expect(html).toContain('Test Store');
      expect(html).toContain('ORD-123456');
      expect(html).toContain('TXN-789012');
      expect(html).toContain('Test Product 1');
      expect(html).toContain('₹285.00');
    });

    it('should include print button', () => {
      const html = generateReceiptHTML(mockReceiptData);

      expect(html).toContain('window.print()');
      expect(html).toContain('Print Receipt');
    });

    it('should include CSS styles', () => {
      const html = generateReceiptHTML(mockReceiptData);

      expect(html).toContain('<style>');
      expect(html).toContain('font-family');
      expect(html).toContain('@media print');
    });

    it('should handle receipt without business info', () => {
      const dataWithoutBusiness = { ...mockReceiptData, businessInfo: undefined };
      const html = generateReceiptHTML(dataWithoutBusiness);

      expect(html).toContain('SALES RECEIPT');
      expect(html).not.toContain('Test Store');
    });
  });

  describe('downloadReceiptText', () => {
    let createElementSpy: any;
    let appendChildSpy: any;
    let removeChildSpy: any;
    let clickSpy: any;

    beforeEach(() => {
      // Mock DOM methods
      clickSpy = vi.fn();
      const mockLink = {
        href: '',
        download: '',
        click: clickSpy,
      };

      createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

      // Mock URL methods
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create and download text file', () => {
      downloadReceiptText(mockReceiptData);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should set correct filename', () => {
      downloadReceiptText(mockReceiptData);

      const link = createElementSpy.mock.results[0].value;
      expect(link.download).toBe('receipt-ORD-123456.txt');
    });
  });

  describe('printReceipt', () => {
    let windowOpenSpy: any;
    let mockWindow: any;

    beforeEach(() => {
      mockWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
      };

      windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(mockWindow as any);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should open new window with receipt HTML', () => {
      printReceipt(mockReceiptData);

      expect(windowOpenSpy).toHaveBeenCalledWith('', '_blank', 'width=400,height=600');
      expect(mockWindow.document.write).toHaveBeenCalled();
      expect(mockWindow.document.close).toHaveBeenCalled();
    });

    it('should handle blocked popup', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      windowOpenSpy.mockReturnValue(null);

      printReceipt(mockReceiptData);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to open print window')
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('createReceiptData', () => {
    const mockOrder: Order = {
      id: 'order-1',
      tenantId: 'tenant-1',
      orderNumber: 'ORD-123456',
      customerId: 'customer-1',
      customer: {
        id: 'customer-1',
        tenantId: 'tenant-1',
        name: 'Jane Smith',
        phone: '+1122334455',
        lifetimeValue: 1000,
        totalOrders: 5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          product: {
            id: 'prod-1',
            tenantId: 'tenant-1',
            sku: 'SKU-001',
            name: 'Product A',
            category: 'Category A',
            price: 100,
            stockQuantity: 10,
            minStockLevel: 5,
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          quantity: 2,
          unitPrice: 100,
          totalPrice: 200,
        },
      ],
      subtotal: 200,
      taxAmount: 36,
      discountAmount: 0,
      totalAmount: 236,
      status: OrderStatus.COMPLETED,
      paymentMethod: PaymentMethod.CASH,
      paymentStatus: PaymentStatus.PAID,
      paymentTransactionId: 'TXN-123',
      createdBy: 'user-1',
      createdAt: '2024-01-01T10:30:00Z',
      updatedAt: '2024-01-01T10:30:00Z',
    };

    it('should create receipt data from order', () => {
      const receiptData = createReceiptData(mockOrder, 'TXN-123');

      expect(receiptData.orderNumber).toBe('ORD-123456');
      expect(receiptData.transactionId).toBe('TXN-123');
      expect(receiptData.items).toEqual(mockOrder.items);
      expect(receiptData.subtotal).toBe(200);
      expect(receiptData.taxAmount).toBe(36);
      expect(receiptData.totalAmount).toBe(236);
      expect(receiptData.paymentMethod).toBe(PaymentMethod.CASH);
    });

    it('should include customer info if available', () => {
      const receiptData = createReceiptData(mockOrder, 'TXN-123');

      expect(receiptData.customerInfo).toEqual({
        name: 'Jane Smith',
        phone: '+1122334455',
      });
    });

    it('should handle order without customer', () => {
      const orderWithoutCustomer = { ...mockOrder, customer: undefined };
      const receiptData = createReceiptData(orderWithoutCustomer, 'TXN-123');

      expect(receiptData.customerInfo).toBeUndefined();
    });

    it('should include business info if provided', () => {
      const businessInfo = {
        name: 'My Store',
        address: '456 Store Ave',
        phone: '+9998887777',
        taxId: 'TAX999',
      };

      const receiptData = createReceiptData(mockOrder, 'TXN-123', businessInfo);

      expect(receiptData.businessInfo).toEqual(businessInfo);
    });

    it('should format date correctly', () => {
      const receiptData = createReceiptData(mockOrder, 'TXN-123');

      expect(receiptData.date).toBeTruthy();
      expect(typeof receiptData.date).toBe('string');
    });
  });
});
