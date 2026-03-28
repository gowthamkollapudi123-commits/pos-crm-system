/**
 * PDF Export Utilities
 *
 * Provides print-based PDF export for reports using the browser's built-in
 * print dialog. Works without any external PDF libraries.
 *
 * Requirements: 12.8
 */

/**
 * Triggers the browser print dialog to export the current report as PDF.
 * Sets a document title so the default filename in the print dialog is meaningful.
 *
 * @param title - The report title used as the print document title
 */
export function printReport(title: string): void {
  const previousTitle = document.title;
  document.title = title;

  window.print();

  // Restore original title after a short delay (print dialog is async)
  setTimeout(() => {
    document.title = previousTitle;
  }, 1000);
}
