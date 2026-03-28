/**
 * Unit Tests for Customer List Segment Filter
 * 
 * Tests the segment filter functionality on the customer list page.
 */

import { describe, it, expect } from 'vitest';
import { Customer } from '@/types/entities';

describe('Customer Segment Filter Logic', () => {
  const getCustomerSegment = (customer: Customer): string => {
    const { lifetimeValue, totalOrders } = customer;
    
    // New: Low orders OR low value
    if (totalOrders < 3 || lifetimeValue < 1000) return 'New';
    
    // VIP: High value
    if (lifetimeValue > 10000) return 'VIP';
    
    // Regular: Everything else (1000-10000 with 3+ orders)
    return 'Regular';
  };

  it('should filter VIP customers correctly', () => {
    const customers: Customer[] = [
      {
        id: '1',
        tenantId: 'tenant1',
        name: 'VIP Customer',
        phone: '1234567890',
        lifetimeValue: 15000,
        totalOrders: 20,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        tenantId: 'tenant1',
        name: 'Regular Customer',
        phone: '2345678901',
        lifetimeValue: 5000,
        totalOrders: 10,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
    ];

    const vipCustomers = customers.filter(c => getCustomerSegment(c) === 'VIP');
    
    expect(vipCustomers).toHaveLength(1);
    expect(vipCustomers[0].name).toBe('VIP Customer');
  });

  it('should filter Regular customers correctly', () => {
    const customers: Customer[] = [
      {
        id: '1',
        tenantId: 'tenant1',
        name: 'VIP Customer',
        phone: '1234567890',
        lifetimeValue: 15000,
        totalOrders: 20,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        tenantId: 'tenant1',
        name: 'Regular Customer',
        phone: '2345678901',
        lifetimeValue: 5000,
        totalOrders: 10,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
      {
        id: '3',
        tenantId: 'tenant1',
        name: 'Another Regular',
        phone: '3456789012',
        lifetimeValue: 2000,
        totalOrders: 8,
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
      },
    ];

    const regularCustomers = customers.filter(c => getCustomerSegment(c) === 'Regular');
    
    expect(regularCustomers).toHaveLength(2);
    expect(regularCustomers.map(c => c.name)).toContain('Regular Customer');
    expect(regularCustomers.map(c => c.name)).toContain('Another Regular');
  });

  it('should filter New customers correctly', () => {
    const customers: Customer[] = [
      {
        id: '1',
        tenantId: 'tenant1',
        name: 'New Customer 1',
        phone: '1234567890',
        lifetimeValue: 500,
        totalOrders: 2,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        tenantId: 'tenant1',
        name: 'Regular Customer',
        phone: '3456789012',
        lifetimeValue: 5000,
        totalOrders: 10,
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
      },
    ];

    const newCustomers = customers.filter(c => getCustomerSegment(c) === 'New');
    
    expect(newCustomers).toHaveLength(1);
    expect(newCustomers.map(c => c.name)).toContain('New Customer 1');
  });

  it('should handle mixed segments correctly', () => {
    const customers: Customer[] = [
      {
        id: '1',
        tenantId: 'tenant1',
        name: 'VIP',
        phone: '1234567890',
        lifetimeValue: 15000,
        totalOrders: 20,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        tenantId: 'tenant1',
        name: 'Regular',
        phone: '2345678901',
        lifetimeValue: 5000,
        totalOrders: 10,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
      {
        id: '3',
        tenantId: 'tenant1',
        name: 'New',
        phone: '3456789012',
        lifetimeValue: 500,
        totalOrders: 2,
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
      },
    ];

    const vipCount = customers.filter(c => getCustomerSegment(c) === 'VIP').length;
    const regularCount = customers.filter(c => getCustomerSegment(c) === 'Regular').length;
    const newCount = customers.filter(c => getCustomerSegment(c) === 'New').length;
    
    expect(vipCount).toBe(1);
    expect(regularCount).toBe(1);
    expect(newCount).toBe(1);
    expect(vipCount + regularCount + newCount).toBe(customers.length);
  });

  it('should handle boundary cases correctly', () => {
    const customers: Customer[] = [
      {
        id: '1',
        tenantId: 'tenant1',
        name: 'Exactly 10000',
        phone: '1234567890',
        lifetimeValue: 10000,
        totalOrders: 10,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        tenantId: 'tenant1',
        name: 'Exactly 10001',
        phone: '2345678901',
        lifetimeValue: 10001,
        totalOrders: 10,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
      {
        id: '3',
        tenantId: 'tenant1',
        name: 'Exactly 1000',
        phone: '3456789012',
        lifetimeValue: 1000,
        totalOrders: 5,
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
      },
      {
        id: '4',
        tenantId: 'tenant1',
        name: 'Exactly 999',
        phone: '4567890123',
        lifetimeValue: 999,
        totalOrders: 5,
        createdAt: '2024-01-04T00:00:00Z',
        updatedAt: '2024-01-04T00:00:00Z',
      },
    ];

    expect(getCustomerSegment(customers[0])).toBe('Regular'); // 10000 is Regular
    expect(getCustomerSegment(customers[1])).toBe('VIP'); // 10001 is VIP
    expect(getCustomerSegment(customers[2])).toBe('Regular'); // 1000 is Regular
    expect(getCustomerSegment(customers[3])).toBe('New'); // 999 is New
  });

  it('should prioritize lifetime value over order count for New segment', () => {
    const customer: Customer = {
      id: '1',
      tenantId: 'tenant1',
      name: 'Low Value High Orders',
      phone: '1234567890',
      lifetimeValue: 500,
      totalOrders: 10,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    // Should be New because lifetimeValue < 1000 (OR condition)
    expect(getCustomerSegment(customer)).toBe('New');
  });

  it('should classify as New when order count is low even with moderate value', () => {
    const customer: Customer = {
      id: '1',
      tenantId: 'tenant1',
      name: 'Moderate Value Low Orders',
      phone: '1234567890',
      lifetimeValue: 1500,
      totalOrders: 2,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    // Should be New because totalOrders < 3 (OR condition)
    expect(getCustomerSegment(customer)).toBe('New');
  });

  it('should handle zero values correctly', () => {
    const customer: Customer = {
      id: '1',
      tenantId: 'tenant1',
      name: 'Zero Customer',
      phone: '1234567890',
      lifetimeValue: 0,
      totalOrders: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    expect(getCustomerSegment(customer)).toBe('New');
  });
});
