/**
 * Receipt Generation Utility
 * 
 * Generates receipts for completed transactions with transaction details.
 * Supports both display and download formats.
 * 
 * Requirements: 7.5, 7.11
 */

import type { Order, OrderItem } from '@/types/entities';
import { format } from 'date-fns';

export interface ReceiptData {
  orderNumber: string;
  transactionId: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  businessInfo?: {
    name: string;
    address: string;
    phone: string;
    taxId: string;
  };
  customerInfo?: {
    name: string;
    phone?: string;
  };
}

/**
 * Generate receipt text content
 */
export function generateReceiptText(data: ReceiptData): string {
  const lines: string[] = [];
  const width = 48; // Character width for receipt

  // Helper to center text
  const center = (text: string) => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  };

  // Helper to create line
  const line = () => '='.repeat(width);
  const dottedLine = () => '-'.repeat(width);

  // Header
  lines.push(line());
  if (data.businessInfo) {
    lines.push(center(data.businessInfo.name.toUpperCase()));
    lines.push(center(data.businessInfo.address));
    lines.push(center(`Phone: ${data.businessInfo.phone}`));
    lines.push(center(`Tax ID: ${data.businessInfo.taxId}`));
  } else {
    lines.push(center('SALES RECEIPT'));
  }
  lines.push(line());
  lines.push('');

  // Transaction details
  lines.push(`Order #: ${data.orderNumber}`);
  lines.push(`Transaction ID: ${data.transactionId}`);
  lines.push(`Date: ${data.date}`);
  lines.push(`Payment: ${data.paymentMethod}`);
  
  if (data.customerInfo) {
    lines.push(`Customer: ${data.customerInfo.name}`);
    if (data.customerInfo.phone) {
      lines.push(`Phone: ${data.customerInfo.phone}`);
    }
  }
  
  lines.push('');
  lines.push(dottedLine());
  lines.push('');

  // Items header
  lines.push('Item                        Qty    Price   Total');
  lines.push(dottedLine());

  // Items
  data.items.forEach((item) => {
    const product = item.product;
    const name = product?.name || 'Unknown Product';
    const truncatedName = name.length > 24 ? name.substring(0, 21) + '...' : name;
    const qty = item.quantity.toString().padStart(3);
    const price = `₹${item.unitPrice.toFixed(2)}`.padStart(8);
    const total = `₹${item.totalPrice.toFixed(2)}`.padStart(8);
    
    lines.push(`${truncatedName.padEnd(24)} ${qty} ${price} ${total}`);
  });

  lines.push('');
  lines.push(dottedLine());
  lines.push('');

  // Totals
  const subtotalStr = `₹${data.subtotal.toFixed(2)}`;
  lines.push(`Subtotal:`.padEnd(width - subtotalStr.length) + subtotalStr);

  if (data.discountAmount > 0) {
    const discountStr = `-₹${data.discountAmount.toFixed(2)}`;
    lines.push(`Discount:`.padEnd(width - discountStr.length) + discountStr);
  }

  const taxStr = `₹${data.taxAmount.toFixed(2)}`;
  lines.push(`Tax (18%):`.padEnd(width - taxStr.length) + taxStr);

  lines.push(dottedLine());

  const totalStr = `₹${data.totalAmount.toFixed(2)}`;
  lines.push(`TOTAL:`.padEnd(width - totalStr.length) + totalStr);

  lines.push('');
  lines.push(line());
  lines.push(center('Thank you for your business!'));
  lines.push(center('Please visit again'));
  lines.push(line());

  return lines.join('\n');
}

/**
 * Generate receipt HTML content for display
 */
export function generateReceiptHTML(data: ReceiptData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt - ${data.orderNumber}</title>
  <style>
    body {
      font-family: 'Courier New', monospace;
      max-width: 400px;
      margin: 20px auto;
      padding: 20px;
      background: white;
    }
    .receipt {
      border: 2px solid #000;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 18px;
    }
    .header p {
      margin: 5px 0;
      font-size: 12px;
    }
    .info {
      margin-bottom: 20px;
      font-size: 12px;
    }
    .info p {
      margin: 3px 0;
    }
    .items {
      margin-bottom: 20px;
    }
    .items table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .items th {
      border-bottom: 1px dashed #000;
      padding: 5px 0;
      text-align: left;
    }
    .items td {
      padding: 5px 0;
    }
    .items .qty {
      text-align: center;
      width: 40px;
    }
    .items .price {
      text-align: right;
      width: 80px;
    }
    .totals {
      border-top: 1px dashed #000;
      padding-top: 10px;
      font-size: 12px;
    }
    .totals .row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
    }
    .totals .total {
      border-top: 2px solid #000;
      margin-top: 10px;
      padding-top: 10px;
      font-weight: bold;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      border-top: 2px solid #000;
      padding-top: 10px;
      font-size: 12px;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      ${data.businessInfo ? `
        <h1>${data.businessInfo.name}</h1>
        <p>${data.businessInfo.address}</p>
        <p>Phone: ${data.businessInfo.phone}</p>
        <p>Tax ID: ${data.businessInfo.taxId}</p>
      ` : `
        <h1>SALES RECEIPT</h1>
      `}
    </div>

    <div class="info">
      <p><strong>Order #:</strong> ${data.orderNumber}</p>
      <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
      <p><strong>Date:</strong> ${data.date}</p>
      <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
      ${data.customerInfo ? `
        <p><strong>Customer:</strong> ${data.customerInfo.name}</p>
        ${data.customerInfo.phone ? `<p><strong>Phone:</strong> ${data.customerInfo.phone}</p>` : ''}
      ` : ''}
    </div>

    <div class="items">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="qty">Qty</th>
            <th class="price">Price</th>
            <th class="price">Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td>${item.product?.name || 'Unknown Product'}</td>
              <td class="qty">${item.quantity}</td>
              <td class="price">₹${item.unitPrice.toFixed(2)}</td>
              <td class="price">₹${item.totalPrice.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="totals">
      <div class="row">
        <span>Subtotal:</span>
        <span>₹${data.subtotal.toFixed(2)}</span>
      </div>
      ${data.discountAmount > 0 ? `
        <div class="row">
          <span>Discount:</span>
          <span>-₹${data.discountAmount.toFixed(2)}</span>
        </div>
      ` : ''}
      <div class="row">
        <span>Tax (18%):</span>
        <span>₹${data.taxAmount.toFixed(2)}</span>
      </div>
      <div class="row total">
        <span>TOTAL:</span>
        <span>₹${data.totalAmount.toFixed(2)}</span>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for your business!</p>
      <p>Please visit again</p>
    </div>
  </div>

  <div class="no-print" style="text-align: center; margin-top: 20px;">
    <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer;">
      Print Receipt
    </button>
    <button onclick="window.close()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; margin-left: 10px;">
      Close
    </button>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Download receipt as text file
 */
export function downloadReceiptText(data: ReceiptData): void {
  const text = generateReceiptText(data);
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `receipt-${data.orderNumber}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Open receipt in new window for printing
 */
export function printReceipt(data: ReceiptData): void {
  const html = generateReceiptHTML(data);
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    console.error('Failed to open print window. Please check popup blocker settings.');
  }
}

/**
 * Create receipt data from order
 */
export function createReceiptData(
  order: Order,
  transactionId: string,
  businessInfo?: ReceiptData['businessInfo']
): ReceiptData {
  return {
    orderNumber: order.orderNumber,
    transactionId,
    date: format(new Date(order.createdAt), 'PPpp'),
    items: order.items,
    subtotal: order.subtotal,
    taxAmount: order.taxAmount,
    discountAmount: order.discountAmount,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    businessInfo,
    customerInfo: order.customer ? {
      name: order.customer.name,
      phone: order.customer.phone,
    } : undefined,
  };
}
