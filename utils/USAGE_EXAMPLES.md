# Usage Examples for Input Sanitization Utilities

This document provides practical examples of how to use the input sanitization utilities in the POS CRM System.

## Table of Contents

1. [Sanitizing User Input in Components](#sanitizing-user-input-in-components)
2. [File Upload Validation](#file-upload-validation)
3. [Form Data Sanitization](#form-data-sanitization)
4. [CSV Export with Sanitization](#csv-export-with-sanitization)
5. [Safe HTML Rendering](#safe-html-rendering)

---

## Sanitizing User Input in Components

### Example: Displaying User Comments

```tsx
import { sanitizeUserInput } from '@/utils';

interface CommentProps {
  comment: string;
  author: string;
}

export function Comment({ comment, author }: CommentProps) {
  return (
    <div className="comment">
      <p className="author">{sanitizeUserInput(author)}</p>
      <p className="content">{sanitizeUserInput(comment)}</p>
    </div>
  );
}
```

### Example: Search Results with Highlighting

```tsx
import { sanitizeSearchQuery, sanitizeUserInput } from '@/utils';

interface SearchResultsProps {
  query: string;
  results: Array<{ id: string; name: string; description: string }>;
}

export function SearchResults({ query, results }: SearchResultsProps) {
  const safeQuery = sanitizeSearchQuery(query);

  return (
    <div>
      <h2>Search results for: {safeQuery}</h2>
      {results.map(result => (
        <div key={result.id}>
          <h3>{sanitizeUserInput(result.name)}</h3>
          <p>{sanitizeUserInput(result.description)}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## File Upload Validation

### Example: Image Upload Component

```tsx
import { useState } from 'react';
import { validateFile, ALLOWED_FILE_TYPES, formatFileSize } from '@/utils';

export function ImageUpload() {
  const [error, setError] = useState<string>('');
  const [preview, setPreview] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file, ALLOWED_FILE_TYPES.images);
    
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      setPreview('');
      return;
    }

    // File is valid, create preview
    setError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <input
        type="file"
        accept={ALLOWED_FILE_TYPES.images.join(',')}
        onChange={handleFileChange}
      />
      {error && <p className="error">{error}</p>}
      {preview && <img src={preview} alt="Preview" />}
    </div>
  );
}
```

### Example: CSV Import with Validation

```tsx
import { validateFile, ALLOWED_FILE_TYPES, MAX_FILE_SIZE, formatFileSize } from '@/utils';

export function CsvImport() {
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const validation = validateFile(file, ALLOWED_FILE_TYPES.csv, MAX_FILE_SIZE);
    
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // File is valid, proceed with import
    const text = await file.text();
    // Process CSV data...
  };

  return (
    <div>
      <input
        type="file"
        accept=".csv"
        onChange={handleImport}
      />
      <p className="help-text">
        Maximum file size: {formatFileSize(MAX_FILE_SIZE)}
      </p>
    </div>
  );
}
```

---

## Form Data Sanitization

### Example: Customer Form with Sanitization

```tsx
import { useForm } from 'react-hook-form';
import { sanitizeFormData } from '@/utils';

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export function CustomerForm() {
  const { register, handleSubmit } = useForm<CustomerFormData>();

  const onSubmit = (data: CustomerFormData) => {
    // Sanitize all form data before submission
    const sanitizedData = sanitizeFormData(data);
    
    // Submit to API
    fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedData),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} placeholder="Name" />
      <input {...register('email')} placeholder="Email" />
      <input {...register('phone')} placeholder="Phone" />
      <textarea {...register('notes')} placeholder="Notes" />
      <button type="submit">Save Customer</button>
    </form>
  );
}
```

---

## CSV Export with Sanitization

### Example: Export Customer Data

```tsx
import { sanitizeCsvValue } from '@/utils';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export function exportCustomersToCsv(customers: Customer[]) {
  // CSV header
  const headers = ['ID', 'Name', 'Email', 'Phone', 'Notes'];
  const csvRows = [headers.join(',')];

  // Add data rows with sanitization
  customers.forEach(customer => {
    const row = [
      sanitizeCsvValue(customer.id),
      sanitizeCsvValue(customer.name),
      sanitizeCsvValue(customer.email),
      sanitizeCsvValue(customer.phone),
      sanitizeCsvValue(customer.notes),
    ];
    csvRows.push(row.join(','));
  });

  // Create and download CSV file
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'customers.csv';
  link.click();
  
  URL.revokeObjectURL(url);
}
```

---

## Safe HTML Rendering

### Example: Rich Text Content (Use Sparingly!)

```tsx
import { createSafeHtml, containsXssPattern } from '@/utils';

interface RichTextProps {
  content: string;
}

export function RichTextDisplay({ content }: RichTextProps) {
  // Check for XSS patterns first
  if (containsXssPattern(content)) {
    console.warn('Potential XSS detected in content');
  }

  // Only use dangerouslySetInnerHTML when absolutely necessary
  // and always with sanitization
  return (
    <div 
      className="rich-text"
      dangerouslySetInnerHTML={createSafeHtml(content)}
    />
  );
}
```

### Example: Product Description with Safe Rendering

```tsx
import { sanitizeHtml, sanitizeText } from '@/utils';

interface ProductDescriptionProps {
  description: string;
  allowHtml?: boolean;
}

export function ProductDescription({ description, allowHtml = false }: ProductDescriptionProps) {
  if (allowHtml) {
    // If HTML is allowed, sanitize it first
    const safeHtml = sanitizeHtml(description);
    return <div dangerouslySetInnerHTML={{ __html: safeHtml }} />;
  }

  // Default: treat as plain text
  return <div>{sanitizeText(description)}</div>;
}
```

---

## Advanced Examples

### Example: URL Validation in Links

```tsx
import { sanitizeUrl } from '@/utils';

interface ExternalLinkProps {
  href: string;
  children: React.ReactNode;
}

export function ExternalLink({ href, children }: ExternalLinkProps) {
  const safeUrl = sanitizeUrl(href);
  
  if (!safeUrl) {
    // Invalid URL, render as plain text
    return <span>{children}</span>;
  }

  return (
    <a 
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}
```

### Example: Dynamic Class Names

```tsx
import { sanitizeClassName } from '@/utils';

interface ButtonProps {
  variant?: string;
  size?: string;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', children }: ButtonProps) {
  // Sanitize user-provided class names
  const safeVariant = sanitizeClassName(variant);
  const safeSize = sanitizeClassName(size);
  
  const className = `btn btn-${safeVariant} btn-${safeSize}`;

  return (
    <button className={className}>
      {children}
    </button>
  );
}
```

### Example: Sanitizing API Responses

```tsx
import { sanitizeObject } from '@/utils';

export async function fetchCustomers() {
  const response = await fetch('/api/customers');
  const data = await response.json();
  
  // Sanitize all string values in the response
  const sanitizedData = sanitizeObject(data);
  
  return sanitizedData;
}
```

---

## Best Practices Summary

1. **Always sanitize user input** before displaying it
2. **Validate files** before processing uploads
3. **Sanitize form data** before submission
4. **Prevent CSV injection** when exporting data
5. **Avoid `dangerouslySetInnerHTML`** unless absolutely necessary
6. **Use type-safe utilities** with TypeScript
7. **Check for XSS patterns** in suspicious content
8. **Sanitize URLs** before using them in links
9. **Validate and sanitize** at multiple layers (client and server)
10. **Log security events** for monitoring and auditing

---

## Testing Your Implementation

Always test your sanitization with these common XSS payloads:

```typescript
const xssPayloads = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror="alert(\'XSS\')">',
  'javascript:alert("XSS")',
  '<iframe src="javascript:alert(\'XSS\')"></iframe>',
  '<svg onload="alert(\'XSS\')">',
  '"><script>alert(String.fromCharCode(88,83,83))</script>',
];

// Test each payload with your sanitization functions
xssPayloads.forEach(payload => {
  const sanitized = sanitizeUserInput(payload);
  console.log('Original:', payload);
  console.log('Sanitized:', sanitized);
  console.log('---');
});
```
