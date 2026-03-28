/**
 * CSV Export Utilities
 * 
 * Provides functions to generate and download CSV files from data.
 * Includes proper escaping, UTF-8 BOM for Excel compatibility, and sanitization.
 * 
 * Requirements: 10.9, 25.3
 */

import { sanitizeCsvValue } from './sanitizer';
import { format } from 'date-fns';

/**
 * Escapes a CSV cell value by:
 * - Sanitizing for formula injection
 * - Wrapping in quotes if contains comma, quote, or newline
 * - Escaping internal quotes by doubling them
 * 
 * @param value - The value to escape
 * @returns Escaped CSV cell value
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  let stringValue = String(value);
  
  // Sanitize for formula injection
  stringValue = sanitizeCsvValue(stringValue);

  // Check if value needs quoting
  const needsQuoting = /[",\n\r]/.test(stringValue);

  if (needsQuoting) {
    // Escape internal quotes by doubling them
    stringValue = stringValue.replace(/"/g, '""');
    // Wrap in quotes
    return `"${stringValue}"`;
  }

  return stringValue;
}

/**
 * Converts an array of objects to CSV format
 * 
 * @param data - Array of objects to convert
 * @param headers - Column headers (keys to extract from objects)
 * @param headerLabels - Optional display labels for headers
 * @returns CSV string with UTF-8 BOM
 */
export function arrayToCsv<T>(
  data: T[],
  headers: (keyof T & string)[],
  headerLabels?: Partial<Record<keyof T & string, string>>
): string {
  // UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';

  // Generate header row
  const headerRow = headers
    .map(header => {
      const label = headerLabels?.[header] || String(header);
      return escapeCsvCell(label);
    })
    .join(',');

  // Generate data rows
  const dataRows = data.map(row => {
    return headers
      .map(header => escapeCsvCell(row[header]))
      .join(',');
  });

  // Combine all rows
  return BOM + [headerRow, ...dataRows].join('\n');
}

/**
 * Triggers a browser download of CSV content
 * 
 * @param csvContent - The CSV string to download
 * @param filename - The filename (without extension)
 */
export function downloadCsv(csvContent: string, filename: string): void {
  // Create blob with CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a filename with timestamp
 * 
 * @param prefix - Filename prefix
 * @param dateRange - Optional date range to include in filename
 * @returns Filename with timestamp
 */
export function generateCsvFilename(
  prefix: string,
  dateRange?: { start: string; end: string }
): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
  
  if (dateRange) {
    const startDate = format(new Date(dateRange.start), 'yyyy-MM-dd');
    const endDate = format(new Date(dateRange.end), 'yyyy-MM-dd');
    return `${prefix}_${startDate}_to_${endDate}_${timestamp}`;
  }

  return `${prefix}_${timestamp}`;
}

/**
 * Formats currency value for CSV export
 * 
 * @param value - The numeric value
 * @param currency - Currency code (default: INR)
 * @returns Formatted currency string
 */
export function formatCurrencyForCsv(value: number, currency: string = 'INR'): string {
  return `${currency} ${value.toFixed(2)}`;
}

/**
 * Formats date for CSV export
 * 
 * @param date - Date string or Date object
 * @param formatString - date-fns format string (default: yyyy-MM-dd HH:mm:ss)
 * @returns Formatted date string
 */
export function formatDateForCsv(
  date: string | Date,
  formatString: string = 'yyyy-MM-dd HH:mm:ss'
): string {
  try {
    return format(new Date(date), formatString);
  } catch {
    return String(date);
  }
}
