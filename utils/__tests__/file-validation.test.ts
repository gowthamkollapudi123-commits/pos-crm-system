/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unit tests for file validation utilities
 */

import {
  validateFileType,
  validateFileSize,
  validateFile,
  validateFiles,
  formatFileSize,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
} from '../file-validation';

// Helper to create mock File objects
function createMockFile(
  name: string,
  size: number,
  type: string
): File {
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], name, { type });
}

describe('validateFileType', () => {
  it('should accept valid image file', () => {
    const file = createMockFile('test.jpg', 1000, 'image/jpeg');
    const result = validateFileType(file, ALLOWED_FILE_TYPES.images);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject invalid file type', () => {
    const file = createMockFile('test.exe', 1000, 'application/x-msdownload');
    const result = validateFileType(file, ALLOWED_FILE_TYPES.images);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid file type');
  });

  it('should reject file without extension', () => {
    const file = createMockFile('test', 1000, 'image/jpeg');
    const result = validateFileType(file, ALLOWED_FILE_TYPES.images);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must have an extension');
  });

  it('should reject mismatched extension and MIME type', () => {
    const file = createMockFile('test.jpg', 1000, 'image/png');
    const result = validateFileType(file, ALLOWED_FILE_TYPES.images);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('does not match file type');
  });

  it('should accept CSV file', () => {
    const file = createMockFile('data.csv', 1000, 'text/csv');
    const result = validateFileType(file, ALLOWED_FILE_TYPES.csv);
    expect(result.valid).toBe(true);
  });

  it('should handle null file', () => {
    const result = validateFileType(null as any, ALLOWED_FILE_TYPES.images);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('No file provided');
  });
});

describe('validateFileSize', () => {
  it('should accept file within size limit', () => {
    const file = createMockFile('test.jpg', 1000, 'image/jpeg');
    const result = validateFileSize(file, MAX_FILE_SIZE);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject file exceeding size limit', () => {
    const file = createMockFile('large.jpg', MAX_FILE_SIZE + 1, 'image/jpeg');
    const result = validateFileSize(file, MAX_FILE_SIZE);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds maximum allowed size');
  });

  it('should use default MAX_FILE_SIZE when not specified', () => {
    const file = createMockFile('test.jpg', 1000, 'image/jpeg');
    const result = validateFileSize(file);
    expect(result.valid).toBe(true);
  });

  it('should accept file at exact size limit', () => {
    const file = createMockFile('test.jpg', MAX_FILE_SIZE, 'image/jpeg');
    const result = validateFileSize(file, MAX_FILE_SIZE);
    expect(result.valid).toBe(true);
  });

  it('should handle null file', () => {
    const result = validateFileSize(null as any);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('No file provided');
  });
});

describe('validateFile', () => {
  it('should accept valid file', () => {
    const file = createMockFile('test.jpg', 1000, 'image/jpeg');
    const result = validateFile(file, ALLOWED_FILE_TYPES.images);
    expect(result.valid).toBe(true);
  });

  it('should reject file with invalid type', () => {
    const file = createMockFile('test.exe', 1000, 'application/x-msdownload');
    const result = validateFile(file, ALLOWED_FILE_TYPES.images);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid file type');
  });

  it('should reject file exceeding size limit', () => {
    const file = createMockFile('large.jpg', MAX_FILE_SIZE + 1, 'image/jpeg');
    const result = validateFile(file, ALLOWED_FILE_TYPES.images);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds maximum allowed size');
  });

  it('should validate with custom size limit', () => {
    const customLimit = 500;
    const file = createMockFile('test.jpg', 1000, 'image/jpeg');
    const result = validateFile(file, ALLOWED_FILE_TYPES.images, customLimit);
    expect(result.valid).toBe(false);
  });
});

describe('validateFiles', () => {
  it('should accept array of valid files', () => {
    const files = [
      createMockFile('test1.jpg', 1000, 'image/jpeg'),
      createMockFile('test2.png', 2000, 'image/png'),
    ];
    const result = validateFiles(files, ALLOWED_FILE_TYPES.images);
    expect(result.valid).toBe(true);
  });

  it('should reject if any file is invalid', () => {
    const files = [
      createMockFile('test1.jpg', 1000, 'image/jpeg'),
      createMockFile('test2.exe', 2000, 'application/x-msdownload'),
    ];
    const result = validateFiles(files, ALLOWED_FILE_TYPES.images);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('File 2');
  });

  it('should reject empty array', () => {
    const result = validateFiles([], ALLOWED_FILE_TYPES.images);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('No files provided');
  });

  it('should handle null input', () => {
    const result = validateFiles(null as any, ALLOWED_FILE_TYPES.images);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('No files provided');
  });
});

describe('formatFileSize', () => {
  it('should format bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('should format kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('should format megabytes', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
  });

  it('should format gigabytes', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });
});

describe('ALLOWED_FILE_TYPES', () => {
  it('should have images allowlist', () => {
    expect(ALLOWED_FILE_TYPES.images).toContain('image/jpeg');
    expect(ALLOWED_FILE_TYPES.images).toContain('image/png');
  });

  it('should have csv allowlist', () => {
    expect(ALLOWED_FILE_TYPES.csv).toContain('text/csv');
  });

  it('should have documents allowlist', () => {
    expect(ALLOWED_FILE_TYPES.documents).toContain('application/pdf');
  });
});

describe('MAX_FILE_SIZE', () => {
  it('should be 10MB', () => {
    expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
  });
});
