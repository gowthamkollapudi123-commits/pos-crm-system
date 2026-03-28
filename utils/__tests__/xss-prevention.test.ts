/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unit tests for XSS prevention helpers
 */

import {
  createSafeHtml,
  sanitizeUserInput,
  sanitizeSearchQuery,
  sanitizeFormData,
  containsXssPattern,
  sanitizeAttribute,
  sanitizeClassName,
  generateCspHeader,
} from '../xss-prevention';

describe('createSafeHtml', () => {
  it('should create safe HTML object', () => {
    const input = '<p>Hello</p>';
    const result = createSafeHtml(input);
    expect(result).toHaveProperty('__html');
    expect(result.__html).toBe('<p>Hello</p>');
  });

  it('should sanitize dangerous HTML', () => {
    const input = '<p>Hello</p><script>alert("XSS")</script>';
    const result = createSafeHtml(input);
    expect(result.__html).not.toContain('script');
  });

  it('should remove event handlers', () => {
    const input = '<div onclick="alert(\'XSS\')">Click</div>';
    const result = createSafeHtml(input);
    expect(result.__html).not.toContain('onclick');
  });
});

describe('sanitizeUserInput', () => {
  it('should sanitize user input', () => {
    const input = '<script>alert("XSS")</script>';
    const result = sanitizeUserInput(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;');
  });

  it('should handle null input', () => {
    expect(sanitizeUserInput(null)).toBe('');
  });

  it('should handle undefined input', () => {
    expect(sanitizeUserInput(undefined)).toBe('');
  });

  it('should preserve safe text', () => {
    const input = 'Hello World';
    const result = sanitizeUserInput(input);
    expect(result).toBe('Hello World');
  });
});

describe('sanitizeSearchQuery', () => {
  it('should remove HTML tags from query', () => {
    const input = '<script>alert("XSS")</script>search term';
    const result = sanitizeSearchQuery(input);
    expect(result).not.toContain('<script>');
  });

  it('should escape special characters', () => {
    const input = 'search & query';
    const result = sanitizeSearchQuery(input);
    expect(result).toContain('&amp;');
  });

  it('should limit query length', () => {
    const input = 'a'.repeat(300);
    const result = sanitizeSearchQuery(input);
    expect(result.length).toBe(200);
  });

  it('should handle empty string', () => {
    expect(sanitizeSearchQuery('')).toBe('');
  });

  it('should handle non-string input', () => {
    expect(sanitizeSearchQuery(null as any)).toBe('');
  });
});

describe('sanitizeFormData', () => {
  it('should sanitize string values', () => {
    const input = {
      name: '<script>XSS</script>',
      age: 25,
    };
    const result = sanitizeFormData(input);
    expect(result.name).not.toContain('<script>');
    expect(result.age).toBe(25);
  });

  it('should sanitize nested objects', () => {
    const input = {
      user: {
        name: '<script>XSS</script>',
      },
    };
    const result = sanitizeFormData(input);
    expect(result.user.name).not.toContain('<script>');
  });

  it('should sanitize arrays', () => {
    const input = {
      tags: ['<script>XSS</script>', 'safe'],
    };
    const result = sanitizeFormData(input);
    expect(result.tags[0]).not.toContain('<script>');
    expect(result.tags[1]).toBe('safe');
  });

  it('should preserve non-string values', () => {
    const input = {
      count: 10,
      active: true,
      data: null,
    };
    const result = sanitizeFormData(input);
    expect(result.count).toBe(10);
    expect(result.active).toBe(true);
    expect(result.data).toBe(null);
  });
});

describe('containsXssPattern', () => {
  it('should detect script tags', () => {
    expect(containsXssPattern('<script>alert("XSS")</script>')).toBe(true);
  });

  it('should detect javascript: protocol', () => {
    expect(containsXssPattern('javascript:alert("XSS")')).toBe(true);
  });

  it('should detect event handlers', () => {
    expect(containsXssPattern('<div onclick="alert()">')).toBe(true);
    expect(containsXssPattern('<img onerror="alert()">')).toBe(true);
  });

  it('should detect iframe tags', () => {
    expect(containsXssPattern('<iframe src="evil.com"></iframe>')).toBe(true);
  });

  it('should detect data: protocol', () => {
    expect(containsXssPattern('data:text/html,<script>alert()</script>')).toBe(true);
  });

  it('should return false for safe content', () => {
    expect(containsXssPattern('Hello World')).toBe(false);
    expect(containsXssPattern('<p>Safe paragraph</p>')).toBe(false);
  });

  it('should handle empty string', () => {
    expect(containsXssPattern('')).toBe(false);
  });

  it('should handle non-string input', () => {
    expect(containsXssPattern(null as any)).toBe(false);
  });
});

describe('sanitizeAttribute', () => {
  it('should remove quotes', () => {
    const input = 'value"with"quotes';
    const result = sanitizeAttribute(input);
    expect(result).not.toContain('"');
  });

  it('should remove angle brackets', () => {
    const input = 'value<with>brackets';
    const result = sanitizeAttribute(input);
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('should trim whitespace', () => {
    const input = '  value  ';
    const result = sanitizeAttribute(input);
    expect(result).toBe('value');
  });

  it('should handle empty string', () => {
    expect(sanitizeAttribute('')).toBe('');
  });

  it('should handle non-string input', () => {
    expect(sanitizeAttribute(null as any)).toBe('');
  });
});

describe('sanitizeClassName', () => {
  it('should allow alphanumeric characters', () => {
    const input = 'btn-primary-123';
    const result = sanitizeClassName(input);
    expect(result).toBe('btn-primary-123');
  });

  it('should allow hyphens and underscores', () => {
    const input = 'my-class_name';
    const result = sanitizeClassName(input);
    expect(result).toBe('my-class_name');
  });

  it('should remove special characters', () => {
    const input = 'class<script>alert()</script>';
    const result = sanitizeClassName(input);
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('should trim whitespace', () => {
    const input = '  my-class  ';
    const result = sanitizeClassName(input);
    expect(result).toBe('my-class');
  });

  it('should handle empty string', () => {
    expect(sanitizeClassName('')).toBe('');
  });

  it('should handle non-string input', () => {
    expect(sanitizeClassName(null as any)).toBe('');
  });
});

describe('generateCspHeader', () => {
  it('should generate CSP header string', () => {
    const result = generateCspHeader();
    expect(result).toContain('default-src');
    expect(result).toContain('script-src');
    expect(result).toContain('style-src');
  });

  it('should include self directive', () => {
    const result = generateCspHeader();
    expect(result).toContain("'self'");
  });

  it('should include frame-src none', () => {
    const result = generateCspHeader();
    expect(result).toContain('frame-src');
    expect(result).toContain("'none'");
  });

  it('should be a valid CSP format', () => {
    const result = generateCspHeader();
    // Should have directives separated by semicolons
    expect(result.split(';').length).toBeGreaterThan(1);
  });
});
