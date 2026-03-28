/**
 * Inventory History Page Tests
 * 
 * Tests for inventory history display, filters, and pagination.
 * Requirements: 11.12
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import InventoryHistoryPage from '../page';
import { productsService } from '@/services/products.service';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  useParams: () => ({
    id: 'prod-123',
  }),
}));

vi.mock('@/components/providers/AuthProvider', () => ({
  useAuthContext: () => ({
    user: {
      id: 'user-1',
      name: 'Test User',
      tenantId: 'tenant-1',
    },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock('@/services/products.service');

describe('InventoryHistoryPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <InventoryHistoryPage />
      </QueryClientProvider>
    );
  };

  it('should render inventory history page', async () => {
    const mockProduct = {
      data: {
        id: 'prod-123',
        name: 'Test Product',
        sku: 'TEST-001',
      },
    };

    const mockMovements = {
      data: [
        {
          id: 'mov-1',
          productId: 'prod-123',
          movementType: 'sale',
          quantity: -5,
          previousStock: 50,
          newStock: 45,
          referenceType: 'order',
          referenceId: 'order-123',
          createdAt: new Date().toISOString(),
          createdBy: 'user-1',
        },
      ],
      pagination: {
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
      },
    };

    vi.mocked(productsService.getById).mockResolvedValue(mockProduct as any);
    vi.mocked(productsService.getInventoryMovements).mockResolvedValue(mockMovements as any);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Inventory History')).toBeInTheDocument();
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
  });

  it('should display inventory movements in table', async () => {
    const mockProduct = {
      data: {
        id: 'prod-123',
        name: 'Test Product',
      },
    };

    const mockMovements = {
      data: [
        {
          id: 'mov-1',
          productId: 'prod-123',
          movementType: 'sale',
          quantity: -5,
          previousStock: 50,
          newStock: 45,
          referenceType: 'order',
          referenceId: 'order-123',
          createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
          createdBy: 'user-1',
        },
        {
          id: 'mov-2',
          productId: 'prod-123',
          movementType: 'purchase',
          quantity: 100,
          previousStock: 45,
          newStock: 145,
          referenceType: 'manual',
          referenceId: 'po-456',
          notes: 'Restocking',
          createdAt: new Date('2024-01-16T10:00:00Z').toISOString(),
          createdBy: 'user-1',
        },
      ],
      pagination: {
        page: 1,
        pageSize: 20,
        totalItems: 2,
        totalPages: 1,
      },
    };

    vi.mocked(productsService.getById).mockResolvedValue(mockProduct as any);
    vi.mocked(productsService.getInventoryMovements).mockResolvedValue(mockMovements as any);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('sale')).toBeInTheDocument();
      expect(screen.getByText('purchase')).toBeInTheDocument();
      expect(screen.getByText('-5')).toBeInTheDocument();
      expect(screen.getByText('+100')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getAllByText('45')).toHaveLength(2); // Previous stock and new stock
      expect(screen.getByText('145')).toBeInTheDocument();
    });
  });

  it('should filter by movement type', async () => {
    const mockProduct = {
      data: {
        id: 'prod-123',
        name: 'Test Product',
      },
    };

    const mockMovements = {
      data: [
        {
          id: 'mov-1',
          productId: 'prod-123',
          movementType: 'sale',
          quantity: -5,
          previousStock: 50,
          newStock: 45,
          referenceType: 'order',
          referenceId: 'order-123',
          createdAt: new Date().toISOString(),
          createdBy: 'user-1',
        },
      ],
      pagination: {
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
      },
    };

    vi.mocked(productsService.getById).mockResolvedValue(mockProduct as any);
    vi.mocked(productsService.getInventoryMovements).mockResolvedValue(mockMovements as any);

    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText('Movement Type')).toBeInTheDocument();
    });

    const select = screen.getByLabelText('Movement Type') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'sale' } });

    await waitFor(() => {
      expect(productsService.getInventoryMovements).toHaveBeenCalledWith(
        'prod-123',
        expect.objectContaining({
          movementType: 'sale',
        })
      );
    });
  });

  it('should filter by date range', async () => {
    const mockProduct = {
      data: {
        id: 'prod-123',
        name: 'Test Product',
      },
    };

    const mockMovements = {
      data: [],
      pagination: {
        page: 1,
        pageSize: 20,
        totalItems: 0,
        totalPages: 0,
      },
    };

    vi.mocked(productsService.getById).mockResolvedValue(mockProduct as any);
    vi.mocked(productsService.getInventoryMovements).mockResolvedValue(mockMovements as any);

    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    });

    const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
    const endDateInput = screen.getByLabelText('End Date') as HTMLInputElement;

    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-31' } });

    await waitFor(() => {
      expect(productsService.getInventoryMovements).toHaveBeenCalledWith(
        'prod-123',
        expect.objectContaining({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
      );
    });
  });

  it('should reset filters', async () => {
    const mockProduct = {
      data: {
        id: 'prod-123',
        name: 'Test Product',
      },
    };

    const mockMovements = {
      data: [],
      pagination: {
        page: 1,
        pageSize: 20,
        totalItems: 0,
        totalPages: 0,
      },
    };

    vi.mocked(productsService.getById).mockResolvedValue(mockProduct as any);
    vi.mocked(productsService.getInventoryMovements).mockResolvedValue(mockMovements as any);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Reset Filters')).toBeInTheDocument();
    });

    // Set filters
    const select = screen.getByLabelText('Movement Type') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'sale' } });

    // Reset filters
    const resetButton = screen.getByText('Reset Filters');
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(select.value).toBe('');
    });
  });

  it('should handle pagination', async () => {
    const mockProduct = {
      data: {
        id: 'prod-123',
        name: 'Test Product',
      },
    };

    const mockMovements = {
      data: Array.from({ length: 20 }, (_, i) => ({
        id: `mov-${i}`,
        productId: 'prod-123',
        movementType: 'sale',
        quantity: -1,
        previousStock: 50 - i,
        newStock: 49 - i,
        referenceType: 'order',
        referenceId: `order-${i}`,
        createdAt: new Date().toISOString(),
        createdBy: 'user-1',
      })),
      pagination: {
        page: 1,
        pageSize: 20,
        totalItems: 50,
        totalPages: 3,
      },
    };

    vi.mocked(productsService.getById).mockResolvedValue(mockProduct as any);
    vi.mocked(productsService.getInventoryMovements).mockResolvedValue(mockMovements as any);

    renderPage();

    await waitFor(() => {
      // Check for pagination text - there are two instances (mobile and desktop)
      const paginationTexts = screen.getAllByText((content, element) => {
        return element?.textContent === 'Page 1 of 3';
      });
      expect(paginationTexts.length).toBeGreaterThan(0);
    });

    const nextButtons = screen.getAllByText('Next');
    // Click the desktop version (second one)
    fireEvent.click(nextButtons[1]);

    await waitFor(() => {
      expect(productsService.getInventoryMovements).toHaveBeenCalledWith(
        'prod-123',
        expect.objectContaining({
          page: 2,
        })
      );
    });
  });

  it('should display empty state when no movements', async () => {
    const mockProduct = {
      data: {
        id: 'prod-123',
        name: 'Test Product',
      },
    };

    const mockMovements = {
      data: [],
      pagination: {
        page: 1,
        pageSize: 20,
        totalItems: 0,
        totalPages: 0,
      },
    };

    vi.mocked(productsService.getById).mockResolvedValue(mockProduct as any);
    vi.mocked(productsService.getInventoryMovements).mockResolvedValue(mockMovements as any);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('No inventory movements found')).toBeInTheDocument();
    });
  });

  it('should export to CSV', async () => {
    const mockProduct = {
      data: {
        id: 'prod-123',
        name: 'Test Product',
      },
    };

    const mockMovements = {
      data: [
        {
          id: 'mov-1',
          productId: 'prod-123',
          movementType: 'sale',
          quantity: -5,
          previousStock: 50,
          newStock: 45,
          referenceType: 'order',
          referenceId: 'order-123',
          notes: 'Test note',
          createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
          createdBy: 'user-1',
        },
      ],
      pagination: {
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
      },
    };

    vi.mocked(productsService.getById).mockResolvedValue(mockProduct as any);
    vi.mocked(productsService.getInventoryMovements).mockResolvedValue(mockMovements as any);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });

    // Mock document.createElement and related methods
    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {},
    };
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');

    const exportButton = screen.getByText('Export CSV');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockLink.click).toHaveBeenCalled();
    });

    // Cleanup
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    createObjectURLSpy.mockRestore();
  });
});
