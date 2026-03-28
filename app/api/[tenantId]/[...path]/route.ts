import { NextRequest, NextResponse } from 'next/server';

// Shared mock data — field names match TypeScript entity types exactly
const mockProducts = [
  { id: 'p1', tenantId: 'demo', name: 'Laptop Pro 15"', sku: 'LAP-001', price: 1299.99, costPrice: 900, category: 'Electronics', stockQuantity: 24, minStockLevel: 5, isActive: true, variants: [], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-03-20T00:00:00Z' },
  { id: 'p2', tenantId: 'demo', name: 'Wireless Mouse', sku: 'MOU-001', price: 29.99, costPrice: 15, category: 'Accessories', stockQuantity: 3, minStockLevel: 10, isActive: true, variants: [], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-03-20T00:00:00Z' },
  { id: 'p3', tenantId: 'demo', name: 'USB-C Hub', sku: 'HUB-001', price: 49.99, costPrice: 22, category: 'Accessories', stockQuantity: 45, minStockLevel: 10, isActive: true, variants: [], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-03-20T00:00:00Z' },
  { id: 'p4', tenantId: 'demo', name: 'Mechanical Keyboard', sku: 'KEY-001', price: 149.99, costPrice: 80, category: 'Accessories', stockQuantity: 2, minStockLevel: 5, isActive: true, variants: [], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-03-20T00:00:00Z' },
  { id: 'p5', tenantId: 'demo', name: 'Monitor 27"', sku: 'MON-001', price: 399.99, costPrice: 220, category: 'Electronics', stockQuantity: 12, minStockLevel: 3, isActive: true, variants: [], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-03-20T00:00:00Z' },
  { id: 'p6', tenantId: 'demo', name: 'Webcam HD', sku: 'CAM-001', price: 79.99, costPrice: 40, category: 'Electronics', stockQuantity: 18, minStockLevel: 5, isActive: true, variants: [], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-03-20T00:00:00Z' },
  { id: 'p7', tenantId: 'demo', name: 'Desk Lamp', sku: 'LMP-001', price: 39.99, costPrice: 18, category: 'Office', stockQuantity: 30, minStockLevel: 5, isActive: true, variants: [], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-03-20T00:00:00Z' },
  { id: 'p8', tenantId: 'demo', name: 'Notebook A5', sku: 'NTB-001', price: 9.99, costPrice: 4, category: 'Stationery', stockQuantity: 100, minStockLevel: 20, isActive: true, variants: [], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-03-20T00:00:00Z' },
];

const mockCustomers = [
  { id: 'c1', tenantId: 'demo', name: 'Alice Johnson', email: 'alice@example.com', phone: '+1-555-0101', address: { street: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001', country: 'US' }, segment: 'VIP', lifetimeValue: 4520.50, totalOrders: 12, createdAt: '2024-01-15T00:00:00Z', updatedAt: '2026-03-20T00:00:00Z' },
  { id: 'c2', tenantId: 'demo', name: 'Bob Smith', email: 'bob@example.com', phone: '+1-555-0102', address: { street: '456 Oak Ave', city: 'Chicago', state: 'IL', zipCode: '60601', country: 'US' }, segment: 'Regular', lifetimeValue: 890.00, totalOrders: 3, createdAt: '2024-02-20T00:00:00Z', updatedAt: '2026-03-20T00:00:00Z' },
  { id: 'c3', tenantId: 'demo', name: 'Carol White', email: 'carol@example.com', phone: '+1-555-0103', address: { street: '789 Pine Rd', city: 'Houston', state: 'TX', zipCode: '77001', country: 'US' }, segment: 'New', lifetimeValue: 120.00, totalOrders: 1, createdAt: '2024-03-10T00:00:00Z', updatedAt: '2026-03-20T00:00:00Z' },
  { id: 'c4', tenantId: 'demo', name: 'David Brown', email: 'david@example.com', phone: '+1-555-0104', address: { street: '321 Elm St', city: 'Phoenix', state: 'AZ', zipCode: '85001', country: 'US' }, segment: 'VIP', lifetimeValue: 7200.00, totalOrders: 21, createdAt: '2023-11-05T00:00:00Z', updatedAt: '2026-03-20T00:00:00Z' },
  { id: 'c5', tenantId: 'demo', name: 'Eva Martinez', email: 'eva@example.com', phone: '+1-555-0105', address: { street: '654 Maple Dr', city: 'Los Angeles', state: 'CA', zipCode: '90001', country: 'US' }, segment: 'Regular', lifetimeValue: 1340.75, totalOrders: 5, createdAt: '2024-01-28T00:00:00Z', updatedAt: '2026-03-20T00:00:00Z' },
];

const mockOrders = [
  { id: 'o1', tenantId: 'demo', orderNumber: 'ORD-001', customerId: 'c1', customerName: 'Alice Johnson', status: 'completed', totalAmount: 1329.98, subtotal: 1229.98, taxAmount: 100, discountAmount: 0, paymentMethod: 'card', paymentStatus: 'success', createdBy: 'user-1', createdAt: '2026-03-20T10:30:00Z', updatedAt: '2026-03-20T10:35:00Z', items: [{ id: 'oi1', productId: 'p1', quantity: 1, unitPrice: 1299.99, totalPrice: 1299.99 }, { id: 'oi2', productId: 'p3', quantity: 1, unitPrice: 49.99, totalPrice: 49.99 }] },
  { id: 'o2', tenantId: 'demo', orderNumber: 'ORD-002', customerId: 'c2', customerName: 'Bob Smith', status: 'pending', totalAmount: 179.98, subtotal: 165, taxAmount: 14.98, discountAmount: 0, paymentMethod: 'cash', paymentStatus: 'pending', createdBy: 'user-3', createdAt: '2026-03-22T14:15:00Z', updatedAt: '2026-03-22T14:15:00Z', items: [{ id: 'oi3', productId: 'p4', quantity: 1, unitPrice: 149.99, totalPrice: 149.99 }, { id: 'oi4', productId: 'p8', quantity: 3, unitPrice: 9.99, totalPrice: 29.97 }] },
  { id: 'o3', tenantId: 'demo', orderNumber: 'ORD-003', customerId: 'c3', customerName: 'Carol White', status: 'processing', totalAmount: 79.99, subtotal: 73.60, taxAmount: 6.39, discountAmount: 0, paymentMethod: 'upi', paymentStatus: 'success', createdBy: 'user-3', createdAt: '2026-03-24T09:00:00Z', updatedAt: '2026-03-24T09:00:00Z', items: [{ id: 'oi5', productId: 'p6', quantity: 1, unitPrice: 79.99, totalPrice: 79.99 }] },
  { id: 'o4', tenantId: 'demo', orderNumber: 'ORD-004', customerId: 'c4', customerName: 'David Brown', status: 'completed', totalAmount: 449.98, subtotal: 413.76, taxAmount: 36.22, discountAmount: 0, paymentMethod: 'card', paymentStatus: 'success', createdBy: 'user-2', createdAt: '2026-03-25T16:45:00Z', updatedAt: '2026-03-25T16:50:00Z', items: [{ id: 'oi6', productId: 'p5', quantity: 1, unitPrice: 399.99, totalPrice: 399.99 }, { id: 'oi7', productId: 'p7', quantity: 1, unitPrice: 39.99, totalPrice: 39.99 }] },
  { id: 'o5', tenantId: 'demo', orderNumber: 'ORD-005', customerId: 'c5', customerName: 'Eva Martinez', status: 'cancelled', totalAmount: 29.99, subtotal: 27.57, taxAmount: 2.42, discountAmount: 0, paymentMethod: 'cash', paymentStatus: 'failed', createdBy: 'user-3', createdAt: '2026-03-26T11:20:00Z', updatedAt: '2026-03-26T11:25:00Z', items: [{ id: 'oi8', productId: 'p2', quantity: 1, unitPrice: 29.99, totalPrice: 29.99 }] },
];

const mockLeads = [
  { id: 'l1', tenantId: 'demo', name: 'Frank Lee', email: 'frank@corp.com', phone: '+1-555-0201', company: 'Tech Corp', status: 'qualified', estimatedValue: 5000, assignedTo: 'user-1', source: 'Referral', notes: 'Interested in bulk laptop order', activities: [], followUpTasks: [], createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-03-15T00:00:00Z' },
  { id: 'l2', tenantId: 'demo', name: 'Grace Kim', email: 'grace@startup.io', phone: '+1-555-0202', company: 'Startup IO', status: 'proposal', estimatedValue: 2500, assignedTo: 'user-2', source: 'Website', notes: 'Needs custom pricing', activities: [], followUpTasks: [], createdAt: '2026-03-05T00:00:00Z', updatedAt: '2026-03-18T00:00:00Z' },
  { id: 'l3', tenantId: 'demo', name: 'Henry Park', email: 'henry@enterprise.com', phone: '+1-555-0203', company: 'Enterprise Co', status: 'new', estimatedValue: 12000, assignedTo: 'user-1', source: 'Referral', notes: 'Referred by Alice Johnson', activities: [], followUpTasks: [], createdAt: '2026-03-20T00:00:00Z', updatedAt: '2026-03-20T00:00:00Z' },
  { id: 'l4', tenantId: 'demo', name: 'Iris Chen', email: 'iris@retail.com', phone: '+1-555-0204', company: 'Retail Plus', status: 'won', estimatedValue: 8500, assignedTo: 'user-2', source: 'Cold Call', notes: 'Deal closed', activities: [], followUpTasks: [], createdAt: '2026-02-15T00:00:00Z', updatedAt: '2026-03-10T00:00:00Z' },
  { id: 'l5', tenantId: 'demo', name: 'Jack Wilson', email: 'jack@media.com', phone: '+1-555-0205', company: 'Media House', status: 'lost', estimatedValue: 3000, assignedTo: 'user-1', source: 'Advertisement', notes: 'Went with competitor', activities: [], followUpTasks: [], createdAt: '2026-02-20T00:00:00Z', updatedAt: '2026-03-05T00:00:00Z' },
];

const mockUsers = [
  { id: 'user-1', name: 'Admin User', email: 'admin@demo.com', role: 'Admin', status: 'Active', createdAt: '2024-01-01' },
  { id: 'user-2', name: 'Manager User', email: 'manager@demo.com', role: 'Manager', status: 'Active', createdAt: '2024-01-15' },
  { id: 'user-3', name: 'Staff User', email: 'staff@demo.com', role: 'Staff', status: 'Active', createdAt: '2024-02-01' },
];

function ok(data: unknown, pagination?: unknown) {
  return NextResponse.json({
    success: true,
    data,
    ...(pagination ? { pagination } : {}),
    timestamp: new Date().toISOString(),
  });
}

function paginated(items: unknown[], page = 1, limit = 20) {
  const start = (page - 1) * limit;
  return ok(items.slice(start, start + limit), {
    totalItems: items.length,
    page,
    pageSize: limit,
    totalPages: Math.ceil(items.length / limit),
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; path: string[] }> }
) {
  const { path } = await params;
  const route = path.join('/');
  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  // Dashboard
  if (route === 'dashboard/metrics') {
    return ok({
      sales: { today: 2459.96, week: 12340.50, month: 48920.75 },
      transactions: { today: 8, week: 42, month: 187 },
      inventory: { totalValue: 89430.00, lowStockCount: 2 },
      customers: { total: 156, newThisMonth: 12 },
      recentTransactions: mockOrders.slice(0, 5),
    });
  }
  if (route === 'dashboard/sales-trends') {
    return ok([
      { date: '2026-03-01', sales: 1200 }, { date: '2026-03-05', sales: 1850 },
      { date: '2026-03-10', sales: 2100 }, { date: '2026-03-15', sales: 1600 },
      { date: '2026-03-20', sales: 2459 }, { date: '2026-03-25', sales: 3100 },
    ]);
  }
  if (route === 'dashboard/top-products') {
    return ok([
      { productId: 'p1', productName: 'Laptop Pro 15"', quantity: 34, revenue: 44199.66 },
      { productId: 'p5', productName: 'Monitor 27"', quantity: 28, revenue: 11199.72 },
      { productId: 'p4', productName: 'Mechanical Keyboard', quantity: 22, revenue: 3299.78 },
      { productId: 'p3', productName: 'USB-C Hub', quantity: 19, revenue: 949.81 },
      { productId: 'p6', productName: 'Webcam HD', quantity: 15, revenue: 1199.85 },
    ]);
  }
  if (route === 'dashboard/customer-acquisition') {
    return ok([
      { date: '2025-10-01', newCustomers: 12, totalCustomers: 120 },
      { date: '2025-11-01', newCustomers: 18, totalCustomers: 138 },
      { date: '2025-12-01', newCustomers: 25, totalCustomers: 163 },
      { date: '2026-01-01', newCustomers: 14, totalCustomers: 177 },
      { date: '2026-02-01', newCustomers: 20, totalCustomers: 197 },
      { date: '2026-03-01', newCustomers: 16, totalCustomers: 213 },
    ]);
  }
  if (route === 'dashboard/recent-transactions') {
    return ok(mockOrders.slice(0, 5));
  }

  // Products
  if (route === 'products') {
    const search = searchParams.get('search')?.toLowerCase();
    const filtered = search ? mockProducts.filter(p => p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search)) : mockProducts;
    return paginated(filtered, page, limit);
  }
  if (route === 'products/low-stock') {
    return ok(mockProducts.filter(p => p.stockQuantity <= p.minStockLevel));
  }
  if (route.match(/^products\/[^/]+\/inventory-history$/)) {
    return ok([
      { id: 'ih1', type: 'Sale', quantity: -2, balance: 24, date: '2026-03-25T10:00:00Z', note: 'Order o1' },
      { id: 'ih2', type: 'Restock', quantity: 10, balance: 26, date: '2026-03-20T09:00:00Z', note: 'Manual restock' },
      { id: 'ih3', type: 'Sale', quantity: -1, balance: 16, date: '2026-03-15T14:30:00Z', note: 'Order o4' },
    ]);
  }
  if (route.match(/^products\/[^/]+$/)) {
    const id = path[1];
    return ok(mockProducts.find(p => p.id === id) || mockProducts[0]);
  }

  // Customers
  if (route === 'customers') {
    const search = searchParams.get('search')?.toLowerCase();
    const filtered = search ? mockCustomers.filter(c => c.name.toLowerCase().includes(search) || c.email?.toLowerCase().includes(search)) : mockCustomers;
    return paginated(filtered, page, limit);
  }
  if (route === 'customers/segments') {
    return ok([
      { segment: 'VIP', count: 2, avgValue: 5860.25 },
      { segment: 'Regular', count: 2, avgValue: 1115.38 },
      { segment: 'New', count: 1, avgValue: 120.00 },
    ]);
  }
  if (route.match(/^customers\/[^/]+\/orders$/)) {
    return ok(mockOrders.slice(0, 3));
  }
  if (route.match(/^customers\/[^/]+$/)) {
    const id = path[1];
    return ok(mockCustomers.find(c => c.id === id) || mockCustomers[0]);
  }

  // Orders
  if (route === 'orders') {
    const status = searchParams.get('status');
    const filtered = status ? mockOrders.filter(o => o.status === status) : mockOrders;
    return paginated(filtered, page, limit);
  }
  if (route.match(/^orders\/[^/]+$/)) {
    const id = path[1];
    return ok(mockOrders.find(o => o.id === id) || mockOrders[0]);
  }

  // Leads
  if (route === 'leads') {
    const status = searchParams.get('status');
    const filtered = status ? mockLeads.filter(l => l.status === status) : mockLeads;
    return paginated(filtered, page, limit);
  }
  if (route === 'leads/tasks/overdue') {
    return ok([
      { id: 't1', leadId: 'l2', leadName: 'Grace Kim', taskTitle: 'Send proposal follow-up', dueDate: '2026-03-25', overdueDays: 1 },
    ]);
  }
  if (route.match(/^leads\/[^/]+\/activities$/)) {
    return ok([
      { id: 'a1', type: 'Call', note: 'Initial contact made', date: '2026-03-21T10:00:00Z', userId: 'user-1' },
      { id: 'a2', type: 'Email', note: 'Sent product catalog', date: '2026-03-23T14:00:00Z', userId: 'user-1' },
    ]);
  }
  if (route.match(/^leads\/[^/]+$/)) {
    const id = path[1];
    return ok(mockLeads.find(l => l.id === id) || mockLeads[0]);
  }

  // Users
  if (route === 'users') return paginated(mockUsers, page, limit);
  if (route.match(/^users\/[^/]+$/)) {
    const id = path[1];
    return ok(mockUsers.find(u => u.id === id) || mockUsers[0]);
  }

  // Reports
  if (route === 'reports/sales') {
    return ok({ total: 48920.75, byCategory: [{ category: 'Electronics', total: 32000 }, { category: 'Accessories', total: 12000 }, { category: 'Office', total: 4920.75 }], byPaymentMethod: [{ method: 'Card', total: 28000 }, { method: 'Cash', total: 12000 }, { method: 'UPI', total: 8920.75 }] });
  }
  if (route === 'reports/inventory') return ok(mockProducts);
  if (route === 'reports/customers') return ok({ total: mockCustomers.length, new: 1, returning: 4, avgLifetimeValue: 2814.25 });
  if (route === 'reports/products') return ok(mockProducts.map(p => ({ ...p, sold: Math.floor(Math.random() * 50) })));
  if (route === 'reports/payments') return ok([{ method: 'Card', count: 95, total: 28000 }, { method: 'Cash', count: 62, total: 12000 }, { method: 'UPI', count: 30, total: 8920.75 }]);
  if (route === 'reports/profit-loss') return ok({ revenue: 48920.75, cogs: 28000, grossProfit: 20920.75, expenses: 5000, netProfit: 15920.75 });

  // Settings
  if (route === 'settings') {
    return ok({
      business: { name: 'Demo Store', address: '100 Commerce St', phone: '+1-555-0100', email: 'store@demo.com', taxId: 'TAX-123456' },
      tax: { rate: 8.5, inclusive: false },
      notifications: { lowStock: true, overdueLeads: true, dailyReport: false },
      inventory: { lowStockThreshold: 5 },
      branding: { primaryColor: '#3B82F6', logo: null },
    });
  }

  // Activity logs
  if (route === 'activity-logs') {
    return paginated([
      { id: 'al1', action: 'LOGIN', userId: 'user-1', userName: 'Admin User', details: 'Successful login', timestamp: '2026-03-26T08:00:00Z' },
      { id: 'al2', action: 'ORDER_CREATED', userId: 'user-3', userName: 'Staff User', details: 'Order o3 created', timestamp: '2026-03-24T09:00:00Z' },
      { id: 'al3', action: 'PRODUCT_UPDATED', userId: 'user-2', userName: 'Manager User', details: 'Updated stock for LAP-001', timestamp: '2026-03-23T11:30:00Z' },
    ], page, limit);
  }

  // Sales
  if (route === 'sales/analytics') {
    return ok({ totalSales: 48920.75, totalOrders: 187, avgOrderValue: 261.60 });
  }

  // Fallback — return empty success so pages don't crash
  return ok([]);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; path: string[] }> }
) {
  const { path } = await params;
  const route = path.join('/');
  const body = await request.json().catch(() => ({}));

  if (route === 'products') return ok({ ...body, id: `p${Date.now()}`, createdAt: new Date().toISOString() });
  if (route === 'customers') return ok({ ...body, id: `c${Date.now()}`, createdAt: new Date().toISOString() });
  if (route === 'orders') return ok({ ...body, id: `o${Date.now()}`, status: 'pending', paymentStatus: 'pending', updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() });
  if (route === 'leads') return ok({ ...body, id: `l${Date.now()}`, status: 'new', activities: [], followUpTasks: [], updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() });
  if (route === 'users') return ok({ ...body, id: `u${Date.now()}`, isActive: true, updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() });
  if (route === 'settings') return ok({ ...body, updatedAt: new Date().toISOString() });
  if (route.match(/^leads\/[^/]+\/activities$/)) return ok({ id: `a${Date.now()}`, ...body, date: new Date().toISOString() });
  if (route.match(/^leads\/[^/]+\/convert$/)) return ok({ customerId: `c${Date.now()}`, message: 'Lead converted to customer' });
  if (route === 'reports/export') return ok({ url: '/mock-export.csv', message: 'Export ready' });

  return ok({ id: `mock-${Date.now()}`, ...body, createdAt: new Date().toISOString() });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; path: string[] }> }
) {
  const body = await request.json().catch(() => ({}));
  return ok({ ...body, updatedAt: new Date().toISOString() });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; path: string[] }> }
) {
  const body = await request.json().catch(() => ({}));
  return ok({ ...body, updatedAt: new Date().toISOString() });
}

export async function DELETE() {
  return ok({ deleted: true });
}
