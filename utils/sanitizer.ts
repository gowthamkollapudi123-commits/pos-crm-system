/**
 * Input Sanitization Utilities
 * 
 * Provides functions to sanitize user inputs and prevent XSS attacks.
 * Requirements: 3.1, 3.2, 25.8
 */

/**
 * Sanitizes HTML content by removing potentially harmful elements and attributes
 * 
 * This function removes:
 * - Script tags and their content
 * - Event handlers (onclick, onerror, etc.)
 * - JavaScript protocol in links
 * - Potentially dangerous HTML elements
 * 
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  let sanitized = html;

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers (onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  // Remove potentially dangerous elements
  const dangerousTags = ['iframe', 'embed', 'object', 'link', 'style', 'meta', 'base'];
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');
    // Also remove self-closing versions
    const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    sanitized = sanitized.replace(selfClosingRegex, '');
  });

  return sanitized;
}

/**
 * Sanitizes plain text by escaping HTML special characters
 * Use this for user-generated text that should be displayed as plain text
 * 
 * @param text - The text to sanitize
 * @returns HTML-escaped text safe for rendering
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Sanitizes a URL to prevent javascript: and data: protocol attacks
 * 
 * @param url - The URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmedUrl = url.trim().toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (trimmedUrl.startsWith(protocol)) {
      return '';
    }
  }

  return url.trim();
}

/**
 * Sanitizes CSV data by removing potentially harmful content
 * Prevents formula injection attacks in spreadsheet applications
 * 
 * @param value - The CSV cell value to sanitize
 * @returns Sanitized value safe for CSV export
 */
export function sanitizeCsvValue(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  // Remove leading characters that could trigger formula execution
  // =, +, -, @, \t, \r are dangerous in CSV files
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
  let sanitized = value;

  while (dangerousChars.some(char => sanitized.startsWith(char))) {
    sanitized = sanitized.substring(1);
  }

  return sanitized;
}

/**
 * Sanitizes an object by applying sanitization to all string values
 * Useful for sanitizing form data or API responses
 * 
 * @param obj - The object to sanitize
 * @param sanitizeFn - The sanitization function to apply (defaults to sanitizeText)
 * @returns New object with sanitized values
 */
export function sanitizeObject<T>(
  obj: T,
  sanitizeFn: (value: string) => string = sanitizeText
): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return (obj as any[]).map(item => sanitizeObject(item, sanitizeFn)) as unknown as T;
  }

  const sanitized: Record<string, unknown> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as Record<string, any>)[key];

      if (typeof value === 'string') {
        sanitized[key] = sanitizeFn(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value, sanitizeFn);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized as unknown as T;
}
