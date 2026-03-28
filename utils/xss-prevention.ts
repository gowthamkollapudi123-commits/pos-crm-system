/**
 * XSS Prevention Helpers
 * 
 * Provides helper functions and React components for XSS prevention.
 * Requirements: 3.1, 3.2
 */

import { sanitizeHtml, sanitizeText } from './sanitizer';

/**
 * Safe wrapper for dangerouslySetInnerHTML
 * Only use this when you absolutely need to render HTML content
 * 
 * Requirement: 3.2 - SHALL NOT use dangerouslySetInnerHTML without sanitized content
 * 
 * @param html - The HTML string to sanitize and render
 * @returns Object suitable for dangerouslySetInnerHTML prop
 */
export function createSafeHtml(html: string): { __html: string } {
  return {
    __html: sanitizeHtml(html),
  };
}

/**
 * Sanitizes user input for safe display
 * Use this for any user-generated content before rendering
 * 
 * @param input - User input to sanitize
 * @returns Sanitized string safe for display
 */
export function sanitizeUserInput(input: string | null | undefined): string {
  if (!input) {
    return '';
  }

  return sanitizeText(String(input));
}

/**
 * Sanitizes search query to prevent XSS in search results
 * 
 * @param query - Search query string
 * @returns Sanitized query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return '';
  }

  // Remove any HTML tags
  let sanitized = query.replace(/<[^>]*>/g, '');
  
  // Escape special characters
  sanitized = sanitizeText(sanitized);
  
  // Limit length to prevent DoS
  const MAX_QUERY_LENGTH = 200;
  if (sanitized.length > MAX_QUERY_LENGTH) {
    sanitized = sanitized.substring(0, MAX_QUERY_LENGTH);
  }

  return sanitized;
}

/**
 * Validates and sanitizes form data before submission
 * 
 * @param formData - Form data object
 * @returns Sanitized form data
 */
export function sanitizeFormData<T extends Record<string, unknown>>(formData: T): T {
  const sanitized: Record<string, unknown> = {};

  for (const key in formData) {
    if (Object.prototype.hasOwnProperty.call(formData, key)) {
      const value = formData[key];

      if (typeof value === 'string') {
        sanitized[key] = sanitizeText(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item: unknown) =>
          typeof item === 'string' ? sanitizeText(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeFormData(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized as T;
}

/**
 * Checks if a string contains potential XSS patterns
 * Use this for additional validation before processing user input
 * 
 * @param input - String to check
 * @returns true if potential XSS detected
 */
export function containsXssPattern(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<iframe/i,
    /<embed/i,
    /<object/i,
    /data:text\/html/i,
    /vbscript:/i,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitizes attributes for use in HTML elements
 * Use this when dynamically setting element attributes
 * 
 * @param value - Attribute value
 * @returns Sanitized attribute value
 */
export function sanitizeAttribute(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  // Remove quotes and angle brackets
  return value
    .replace(/["'<>]/g, '')
    .trim();
}

/**
 * Sanitizes class names to prevent injection
 * 
 * @param className - Class name string
 * @returns Sanitized class name
 */
export function sanitizeClassName(className: string): string {
  if (!className || typeof className !== 'string') {
    return '';
  }

  // Only allow alphanumeric, hyphens, underscores, and spaces
  return className.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim();
}

/**
 * Content Security Policy helpers
 */
export const CSP_DIRECTIVES = {
  // Recommended CSP directives for the application
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'"], // Note: Remove unsafe-inline in production if possible
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", 'data:', 'https:'],
  fontSrc: ["'self'", 'data:'],
  connectSrc: ["'self'"],
  frameSrc: ["'none'"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
} as const;

/**
 * Generates a Content Security Policy header value
 * 
 * @returns CSP header string
 */
export function generateCspHeader(): string {
  const directives = Object.entries(CSP_DIRECTIVES).map(
    ([key, values]) => {
      const directiveName = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
      return `${directiveName} ${values.join(' ')}`;
    }
  );

  return directives.join('; ');
}
