/**
 * ReportExportBar Component
 *
 * Unified export bar for all report types, providing both PDF (print) and
 * CSV export buttons in a consistent layout.
 *
 * Requirements: 12.8, 12.9
 */

'use client';

import { DownloadIcon, PrinterIcon } from 'lucide-react';
import { printReport } from '@/utils/pdf-export';

interface ReportExportBarProps {
  /** Report title shown in the print dialog and used as the PDF filename */
  reportTitle: string;
  /** Called when the user clicks "Export CSV" */
  onExportCsv: () => void;
  /** Whether a CSV export is currently in progress */
  isExportingCsv?: boolean;
}

export function ReportExportBar({
  reportTitle,
  onExportCsv,
  isExportingCsv = false,
}: ReportExportBarProps) {
  return (
    <div className="flex items-center gap-2">
      {/* PDF Export Button - Requirement 12.8 */}
      <button
        onClick={() => printReport(reportTitle)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        aria-label={`Export ${reportTitle} as PDF`}
      >
        <PrinterIcon className="h-4 w-4 mr-2" />
        Export PDF
      </button>

      {/* CSV Export Button - Requirement 12.9 */}
      <button
        onClick={onExportCsv}
        disabled={isExportingCsv}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={`Export ${reportTitle} as CSV`}
      >
        {isExportingCsv ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Exporting...
          </>
        ) : (
          <>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export CSV
          </>
        )}
      </button>
    </div>
  );
}
