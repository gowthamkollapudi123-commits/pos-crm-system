# Utility Functions

This directory contains utility functions for input sanitization, file validation, and XSS prevention.

## Overview

The utilities in this directory implement security controls as specified in Requirements 3.1, 3.2, 3.4, 3.5, and 25.8.

## Modules

### Sanitizer (`sanitizer.ts`)

Provides functions to sanitize user inputs and prevent XSS attacks.

**Functions:**

- `sanitizeHtml(html: string)`: Removes potentially harmful HTML elements and attributes
- `sanitizeText(text: string)`: Escapes HTML special characters for plain text display
- `sanitizeUrl(url: string)`: Validates and sanitizes URLs to prevent protocol attacks
- `sanitizeCsvValue(value: string)`: Prevents formula injection in CSV exports
- `sanitizeObject<T>(obj: T, sanitizeFn?)`: Recursively sanitizes all string values in an object

**Usage Example:**

```typescript
import { sanitizeHtml, sanitizeText } from '@/utils';

// Sanitize HTML content before rendering
const safeHtml = sanitizeHtml(userGeneratedHtml);

// Sanitize plain text
const safeText = sanitizeText(userInput);

// Sanitize form data
const safeFormData = sanitizeObject(formData);
```

### File Validation (`file-validation.ts`)

Provides functions to validate file uploads for type and size.

**Constants:**

- `MAX_FILE_SIZE`: Maximum file size (10MB)
- `ALLOWED_FILE_TYPES`: Predefined allowlists for images, CSV, and documents

**Functions:**

- `validateFileType(file: File, allowedTypes: string[])`: Validates file MIME type
- `validateFileSize(file: File, maxSize?: number)`: Validates file size
- `validateFile(file: File, allowedTypes: string[], maxSize?: number)`: Validates both type and size
- `validateFiles(files: File[], allowedTypes: string[], maxSize?: number)`: Validates multiple files
- `formatFileSize(bytes: number)`: Formats file size in human-readable format

**Usage Example:**

```typescript
import { validateFile, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/utils';

// Validate an image upload
const result = validateFile(file, ALLOWED_FILE_TYPES.images);
if (!result.valid) {
  console.error(result.error);
}

// Validate a CSV import
const csvResult = validateFile(csvFile, ALLOWED_FILE_TYPES.csv, MAX_FILE_SIZE);
```

### XSS Prevention (`xss-prevention.ts`)

Provides helper functions and utilities for XSS prevention.

**Functions:**

- `createSafeHtml(html: string)`: Safe wrapper for `dangerouslySetInnerHTML`
- `sanitizeUserInput(input: string)`: Sanitizes user input for safe display
- `sanitizeSearchQuery(query: string)`: Sanitizes search queries
- `sanitizeFormData<T>(formData: T)`: Validates and sanitizes form data
- `containsXssPattern(input: string)`: Checks for potential XSS patterns
- `sanitizeAttribute(value: string)`: Sanitizes HTML attributes
- `sanitizeClassName(className: string)`: Sanitizes CSS class names
- `generateCspHeader()`: Generates Content Security Policy header

**Usage Example:**

```typescript
import { createSafeHtml, sanitizeUserInput, sanitizeSearchQuery } from '@/utils';

// Safely render HTML (only when absolutely necessary)
<div dangerouslySetInnerHTML={createSafeHtml(userHtml)} />

// Sanitize user input before display
const safeInput = sanitizeUserInput(userComment);

// Sanitize search query
const safeQuery = sanitizeSearchQuery(searchTerm);
```

## Security Best Practices

### 1. Always Sanitize User Input

Before rendering any user-generated content:

```typescript
import { sanitizeUserInput } from '@/utils';

// ✅ Good
<p>{sanitizeUserInput(userComment)}</p>

// ❌ Bad
<p>{userComment}</p>
```

### 2. Avoid `dangerouslySetInnerHTML`

Only use `dangerouslySetInnerHTML` when absolutely necessary, and always with sanitization:

```typescript
import { createSafeHtml } from '@/utils';

// ✅ Good (when HTML rendering is required)
<div dangerouslySetInnerHTML={createSafeHtml(richTextContent)} />

// ❌ Bad
<div dangerouslySetInnerHTML={{ __html: userContent }} />
```

### 3. Validate File Uploads

Always validate file type and size before processing:

```typescript
import { validateFile, ALLOWED_FILE_TYPES } from '@/utils';

const handleFileUpload = (file: File) => {
  const validation = validateFile(file, ALLOWED_FILE_TYPES.images);
  
  if (!validation.valid) {
    showError(validation.error);
    return;
  }
  
  // Process file...
};
```

### 4. Sanitize Form Data

Sanitize form data before submission:

```typescript
import { sanitizeFormData } from '@/utils';

const handleSubmit = (data: FormData) => {
  const sanitizedData = sanitizeFormData(data);
  // Submit sanitized data...
};
```

### 5. Sanitize CSV Exports

Prevent formula injection in CSV exports:

```typescript
import { sanitizeCsvValue } from '@/utils';

const exportToCsv = (data: any[]) => {
  const rows = data.map(row => 
    Object.values(row).map(value => 
      sanitizeCsvValue(String(value))
    ).join(',')
  );
  // Export CSV...
};
```

## Testing

All utility functions should be tested with:

1. **Valid inputs**: Ensure functions work correctly with safe content
2. **XSS attempts**: Test with common XSS payloads
3. **Edge cases**: Empty strings, null, undefined, special characters
4. **File validation**: Invalid types, oversized files, missing extensions

## Requirements Coverage

- **Requirement 3.1**: `sanitizeHtml`, `sanitizeText`, `sanitizeObject` remove harmful content
- **Requirement 3.2**: `createSafeHtml` provides safe wrapper for `dangerouslySetInnerHTML`
- **Requirement 3.4**: `validateFileType` validates file types against allowlist
- **Requirement 3.5**: `validateFileSize` validates file size against maximum limit
- **Requirement 25.8**: `sanitizeCsvValue`, `sanitizeObject` sanitize imported data
