/**
 * CSV Import Utilities
 * 
 * Provides functions to parse and validate CSV files for bulk import.
 * Handles different CSV formats, UTF-8 BOM, and structure validation.
 * 
 * Requirements: 11.8, 11.9, 25.4, 25.5, 25.9
 */

export interface ParsedCsvRow {
  row: number;
  data: Record<string, string>;
}

export interface CsvParseResult {
  headers: string[];
  rows: ParsedCsvRow[];
  errors: Array<{
    row: number;
    message: string;
  }>;
}

/**
 * Removes UTF-8 BOM from the beginning of a string
 * 
 * @param text - The text to process
 * @returns Text without BOM
 */
function removeBOM(text: string): string {
  if (text.charCodeAt(0) === 0xFEFF) {
    return text.slice(1);
  }
  return text;
}

/**
 * Detects the delimiter used in a CSV file
 * Supports comma and semicolon delimiters
 * 
 * @param firstLine - The first line of the CSV
 * @returns The detected delimiter
 */
function detectDelimiter(firstLine: string): ',' | ';' {
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  
  return semicolonCount > commaCount ? ';' : ',';
}

/**
 * Parses a CSV line respecting quoted values
 * 
 * @param line - The CSV line to parse
 * @param delimiter - The delimiter to use
 * @returns Array of cell values
 */
function parseCsvLine(line: string, delimiter: ',' | ';'): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // End of cell
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last cell
  result.push(current.trim());
  
  return result;
}

/**
 * Validates that required columns are present in the CSV
 * 
 * @param headers - The CSV headers
 * @param requiredColumns - Array of required column names
 * @returns Validation result
 */
export function validateCsvStructure(
  headers: string[],
  requiredColumns: string[]
): { valid: boolean; missingColumns: string[] } {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  const missingColumns: string[] = [];
  
  for (const required of requiredColumns) {
    if (!normalizedHeaders.includes(required.toLowerCase())) {
      missingColumns.push(required);
    }
  }
  
  return {
    valid: missingColumns.length === 0,
    missingColumns,
  };
}

/**
 * Parses a CSV file to an array of objects
 * Handles different CSV formats (comma, semicolon delimiters)
 * Handles UTF-8 BOM
 * Returns parsed data with row numbers for error reporting
 * 
 * @param fileContent - The CSV file content as string
 * @param requiredColumns - Optional array of required column names
 * @returns Parsed CSV result with headers, rows, and errors
 */
export function parseCsvFile(
  fileContent: string,
  requiredColumns?: string[]
): CsvParseResult {
  const errors: Array<{ row: number; message: string }> = [];
  
  // Remove BOM if present
  const cleanContent = removeBOM(fileContent);
  
  // Split into lines (handle both \r\n and \n)
  const lines = cleanContent.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length === 0) {
    return {
      headers: [],
      rows: [],
      errors: [{ row: 0, message: 'CSV file is empty' }],
    };
  }
  
  // Detect delimiter from first line
  const delimiter = detectDelimiter(lines[0]);
  
  // Parse header row
  const headers = parseCsvLine(lines[0], delimiter).map(h => h.trim());
  
  if (headers.length === 0) {
    return {
      headers: [],
      rows: [],
      errors: [{ row: 1, message: 'No headers found in CSV file' }],
    };
  }
  
  // Validate structure if required columns provided
  if (requiredColumns) {
    const validation = validateCsvStructure(headers, requiredColumns);
    if (!validation.valid) {
      errors.push({
        row: 1,
        message: `Missing required columns: ${validation.missingColumns.join(', ')}`,
      });
      return { headers, rows: [], errors };
    }
  }
  
  // Parse data rows
  const rows: ParsedCsvRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    const rowNumber = i + 1; // 1-indexed for user display
    const cells = parseCsvLine(line, delimiter);
    
    // Check if row has correct number of columns
    if (cells.length !== headers.length) {
      errors.push({
        row: rowNumber,
        message: `Row has ${cells.length} columns but expected ${headers.length}`,
      });
      continue;
    }
    
    // Create object from headers and cells
    const rowData: Record<string, string> = {};
    headers.forEach((header, index) => {
      rowData[header] = cells[index];
    });
    
    rows.push({
      row: rowNumber,
      data: rowData,
    });
  }
  
  return {
    headers,
    rows,
    errors,
  };
}

/**
 * Reads a file as text
 * 
 * @param file - The file to read
 * @returns Promise resolving to file content as string
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Validates file type and size for CSV import
 * 
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB (default: 10)
 * @returns Validation result
 */
export function validateCsvFile(
  file: File,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/csv'];
  const validExtensions = ['.csv'];
  
  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  
  if (!hasValidType && !hasValidExtension) {
    return {
      valid: false,
      error: 'Only CSV files are allowed',
    };
  }
  
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }
  
  return { valid: true };
}
