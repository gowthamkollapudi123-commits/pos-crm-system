/**
 * File Upload Validation Utilities
 * 
 * Provides functions to validate file uploads for type and size.
 * Requirements: 3.4, 3.5, 25.9
 */

/**
 * Maximum file size in bytes (10MB)
 * Requirement: 25.9
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Allowed file types for different upload contexts
 */
export const ALLOWED_FILE_TYPES = {
  // Image uploads (logos, product images)
  images: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  
  // CSV imports
  csv: [
    'text/csv',
    'application/csv',
    'text/comma-separated-values',
    'application/vnd.ms-excel',
  ],
  
  // Document exports/imports
  documents: [
    'application/pdf',
    'text/csv',
    'application/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const;

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates file type against an allowlist
 * Requirement: 3.4
 * 
 * @param file - The file to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns Validation result with error message if invalid
 */
export function validateFileType(
  file: File,
  allowedTypes: readonly string[]
): FileValidationResult {
  if (!file) {
    return {
      valid: false,
      error: 'No file provided',
    };
  }

  // Additional check: validate file has an extension
  const dotIndex = file.name.lastIndexOf('.');
  if (dotIndex === -1 || dotIndex === file.name.length - 1) {
    return {
      valid: false,
      error: 'File must have an extension',
    };
  }
  const extension = file.name.slice(dotIndex + 1).toLowerCase();

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Map MIME types to expected extensions
  const mimeToExtension: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/jpg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
    'image/svg+xml': ['svg'],
    'text/csv': ['csv'],
    'application/csv': ['csv'],
    'text/comma-separated-values': ['csv'],
    'application/vnd.ms-excel': ['xls', 'csv'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
    'application/pdf': ['pdf'],
  };

  const expectedExtensions = mimeToExtension[file.type];
  if (expectedExtensions && !expectedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension .${extension} does not match file type ${file.type}`,
    };
  }

  return { valid: true };
}

/**
 * Validates file size against maximum limit
 * Requirement: 3.5
 * 
 * @param file - The file to validate
 * @param maxSize - Maximum file size in bytes (defaults to MAX_FILE_SIZE)
 * @returns Validation result with error message if invalid
 */
export function validateFileSize(
  file: File,
  maxSize: number = MAX_FILE_SIZE
): FileValidationResult {
  if (!file) {
    return {
      valid: false,
      error: 'No file provided',
    };
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
    };
  }

  return { valid: true };
}

/**
 * Validates a file for both type and size
 * Combines validateFileType and validateFileSize
 * 
 * @param file - The file to validate
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSize - Maximum file size in bytes (defaults to MAX_FILE_SIZE)
 * @returns Validation result with error message if invalid
 */
export function validateFile(
  file: File,
  allowedTypes: readonly string[],
  maxSize: number = MAX_FILE_SIZE
): FileValidationResult {
  // Validate type first
  const typeValidation = validateFileType(file, allowedTypes);
  if (!typeValidation.valid) {
    return typeValidation;
  }

  // Then validate size
  const sizeValidation = validateFileSize(file, maxSize);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  return { valid: true };
}

/**
 * Validates multiple files
 * 
 * @param files - Array of files to validate
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSize - Maximum file size in bytes per file
 * @returns Validation result with error message if any file is invalid
 */
export function validateFiles(
  files: File[],
  allowedTypes: readonly string[],
  maxSize: number = MAX_FILE_SIZE
): FileValidationResult {
  if (!files || files.length === 0) {
    return {
      valid: false,
      error: 'No files provided',
    };
  }

  for (let i = 0; i < files.length; i++) {
    const result = validateFile(files[i], allowedTypes, maxSize);
    if (!result.valid) {
      return {
        valid: false,
        error: `File ${i + 1} (${files[i].name}): ${result.error}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Formats file size in human-readable format
 * 
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
