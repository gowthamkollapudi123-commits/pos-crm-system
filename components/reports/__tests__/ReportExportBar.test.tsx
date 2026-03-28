/**
 * ReportExportBar Component Tests
 *
 * Tests for the unified report export bar providing PDF and CSV export buttons.
 *
 * Requirements: 12.8, 12.9
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportExportBar } from '../ReportExportBar';
import * as pdfExport from '@/utils/pdf-export';

// Mock pdf-export utility
vi.mock('@/utils/pdf-export', () => ({
  printReport: vi.fn(),
}));

describe('ReportExportBar', () => {
  const defaultProps = {
    reportTitle: 'Sales Report',
    onExportCsv: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render both Export PDF and Export CSV buttons', () => {
      render(<ReportExportBar {...defaultProps} />);

      expect(screen.getByRole('button', { name: /export.*pdf/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export.*csv/i })).toBeInTheDocument();
    });

    it('should show "Export PDF" button text', () => {
      render(<ReportExportBar {...defaultProps} />);
      expect(screen.getByText('Export PDF')).toBeInTheDocument();
    });

    it('should show "Export CSV" button text when not exporting', () => {
      render(<ReportExportBar {...defaultProps} />);
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });

    it('should show "Exporting..." text when isExportingCsv is true', () => {
      render(<ReportExportBar {...defaultProps} isExportingCsv={true} />);
      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });

    it('should disable CSV button when isExportingCsv is true', () => {
      render(<ReportExportBar {...defaultProps} isExportingCsv={true} />);
      const csvButton = screen.getByRole('button', { name: /export.*csv/i });
      expect(csvButton).toBeDisabled();
    });

    it('should not disable CSV button when isExportingCsv is false', () => {
      render(<ReportExportBar {...defaultProps} isExportingCsv={false} />);
      const csvButton = screen.getByRole('button', { name: /export.*csv/i });
      expect(csvButton).not.toBeDisabled();
    });

    it('should not disable CSV button when isExportingCsv is not provided', () => {
      render(<ReportExportBar {...defaultProps} />);
      const csvButton = screen.getByRole('button', { name: /export.*csv/i });
      expect(csvButton).not.toBeDisabled();
    });
  });

  describe('PDF Export - Requirement 12.8', () => {
    it('should call printReport with the report title when PDF button is clicked', async () => {
      const user = userEvent.setup();
      render(<ReportExportBar {...defaultProps} />);

      const pdfButton = screen.getByRole('button', { name: /export.*pdf/i });
      await user.click(pdfButton);

      expect(pdfExport.printReport).toHaveBeenCalledWith('Sales Report');
    });

    it('should pass the correct title for different report types', async () => {
      const user = userEvent.setup();
      render(
        <ReportExportBar
          reportTitle="Inventory Report"
          onExportCsv={vi.fn()}
        />
      );

      const pdfButton = screen.getByRole('button', { name: /export.*pdf/i });
      await user.click(pdfButton);

      expect(pdfExport.printReport).toHaveBeenCalledWith('Inventory Report');
    });
  });

  describe('CSV Export - Requirement 12.9', () => {
    it('should call onExportCsv when CSV button is clicked', async () => {
      const user = userEvent.setup();
      const onExportCsv = vi.fn();
      render(<ReportExportBar reportTitle="Sales Report" onExportCsv={onExportCsv} />);

      const csvButton = screen.getByRole('button', { name: /export.*csv/i });
      await user.click(csvButton);

      expect(onExportCsv).toHaveBeenCalledTimes(1);
    });

    it('should not call onExportCsv when CSV button is disabled', async () => {
      const user = userEvent.setup();
      const onExportCsv = vi.fn();
      render(
        <ReportExportBar
          reportTitle="Sales Report"
          onExportCsv={onExportCsv}
          isExportingCsv={true}
        />
      );

      const csvButton = screen.getByRole('button', { name: /export.*csv/i });
      await user.click(csvButton);

      expect(onExportCsv).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible aria-labels on both buttons', () => {
      render(<ReportExportBar reportTitle="Customer Report" onExportCsv={vi.fn()} />);

      expect(
        screen.getByRole('button', { name: /export customer report as pdf/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /export customer report as csv/i })
      ).toBeInTheDocument();
    });
  });
});

