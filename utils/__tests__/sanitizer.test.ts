/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unit tests for sanitizer utilities
 */

import {
  sanitizeHtml,
  sanitizeText,
  sanitizeUrl,
  sanitizeCsvValue,
  sanitizeObject,
} from '../sanitizer';

describe('sanitizeHtml', () => {
  it('should remove script tags', () => {
    const input = '<p>Hello</p><script>alert("XSS")</script>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<p>Hello</p>');
    expect(result).not.toContain('script');
  });

  it('should remove event handlers', () => {
    const input = '<div onclick="alert(\'XSS\')">Click me</div>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onclick');
  });

  it('should remove javascript: protocol', () => {
    const input = '<a href="javascript:alert(\'XSS\')">Link</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('javascript:');
  });

  it('should remove iframe tags', () => {
    const input = '<iframe src="evil.com"></iframe>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('iframe');
  });

  it('should remove multiple dangerous elements', () => {
    const input = '<p>Safe</p><script>bad()</script><iframe src="x"></iframe>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<p>Safe</p>');
  });

  it('should handle empty string', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('should handle non-string input', () => {
    expect(sanitizeHtml(null as any)).toBe('');
    expect(sanitizeHtml(undefined as any)).toBe('');
  });

  it('should preserve safe HTML', () => {
    const input = '<p>Hello <strong>world</strong></p>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<p>');
    expect(result).toContain('<strong>');
  });
});

describe('sanitizeText', () => {
  it('should escape HTML special characters', () => {
    const input = '<script>alert("XSS")</script>';
    const result = sanitizeText(input);
    expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
  });

  it('should escape ampersands', () => {
    const input = 'Tom & Jerry';
    const result = sanitizeText(input);
    expect(result).toBe('Tom &amp; Jerry');
  });

  it('should escape quotes', () => {
    const input = 'He said "Hello"';
    const result = sanitizeText(input);
    expect(result).toContain('&quot;');
  });

  it('should handle empty string', () => {
    expect(sanitizeText('')).toBe('');
  });

  it('should handle non-string input', () => {
    expect(sanitizeText(null as any)).toBe('');
    expect(sanitizeText(undefined as any)).toBe('');
  });

  it('should preserve safe text', () => {
    const input = 'Hello World 123';
    const result = sanitizeText(input);
    expect(result).toBe('Hello World 123');
  });
});

describe('sanitizeUrl', () => {
  it('should block javascript: protocol', () => {
    const input = 'javascript:alert("XSS")';
    const result = sanitizeUrl(input);
    expect(result).toBe('');
  });

  it('should block data: protocol', () => {
    const input = 'data:text/html,<script>alert("XSS")</script>';
    const result = sanitizeUrl(input);
    expect(result).toBe('');
  });

  it('should block vbscript: protocol', () => {
    const input = 'vbscript:msgbox("XSS")';
    const result = sanitizeUrl(input);
    expect(result).toBe('');
  });

  it('should allow safe URLs', () => {
    const input = 'https://example.com/page';
    const result = sanitizeUrl(input);
    expect(result).toBe('https://example.com/page');
  });

  it('should allow relative URLs', () => {
    const input = '/dashboard';
    const result = sanitizeUrl(input);
    expect(result).toBe('/dashboard');
  });

  it('should trim whitespace', () => {
    const input = '  https://example.com  ';
    const result = sanitizeUrl(input);
    expect(result).toBe('https://example.com');
  });

  it('should handle empty string', () => {
    expect(sanitizeUrl('')).toBe('');
  });

  it('should handle non-string input', () => {
    expect(sanitizeUrl(null as any)).toBe('');
    expect(sanitizeUrl(undefined as any)).toBe('');
  });
});

describe('sanitizeCsvValue', () => {
  it('should remove leading equals sign', () => {
    const input = '=1+1';
    const result = sanitizeCsvValue(input);
    expect(result).toBe('1+1');
  });

  it('should remove leading plus sign', () => {
    const input = '+1+1';
    const result = sanitizeCsvValue(input);
    expect(result).toBe('1+1');
  });

  it('should remove leading minus sign', () => {
    const input = '-1+1';
    const result = sanitizeCsvValue(input);
    expect(result).toBe('1+1');
  });

  it('should remove leading @ sign', () => {
    const input = '@SUM(A1:A10)';
    const result = sanitizeCsvValue(input);
    expect(result).toBe('SUM(A1:A10)');
  });

  it('should remove multiple leading dangerous characters', () => {
    const input = '=+@test';
    const result = sanitizeCsvValue(input);
    expect(result).toBe('test');
  });

  it('should preserve safe values', () => {
    const input = 'Normal text 123';
    const result = sanitizeCsvValue(input);
    expect(result).toBe('Normal text 123');
  });

  it('should handle empty string', () => {
    expect(sanitizeCsvValue('')).toBe('');
  });

  it('should handle non-string input', () => {
    expect(sanitizeCsvValue(null as any)).toBe('');
    expect(sanitizeCsvValue(undefined as any)).toBe('');
  });
});

describe('sanitizeObject', () => {
  it('should sanitize string values in object', () => {
    const input = {
      name: '<script>alert("XSS")</script>',
      age: 25,
    };
    const result = sanitizeObject(input);
    expect(result.name).not.toContain('<script>');
    expect(result.age).toBe(25);
  });

  it('should sanitize nested objects', () => {
    const input = {
      user: {
        name: '<script>XSS</script>',
        email: 'test@example.com',
      },
    };
    const result = sanitizeObject(input);
    expect(result.user.name).not.toContain('<script>');
    expect(result.user.email).toContain('test@example.com');
  });

  it('should sanitize arrays', () => {
    const input = {
      tags: ['<script>XSS</script>', 'safe tag'],
    };
    const result = sanitizeObject(input);
    expect(result.tags[0]).not.toContain('<script>');
    expect(result.tags[1]).toContain('safe tag');
  });

  it('should preserve non-string values', () => {
    const input = {
      name: 'John',
      age: 30,
      active: true,
      score: null,
    };
    const result = sanitizeObject(input);
    expect(result.age).toBe(30);
    expect(result.active).toBe(true);
    expect(result.score).toBe(null);
  });

  it('should use custom sanitization function', () => {
    const input = {
      value: 'test',
    };
    const customSanitize = (str: string) => str.toUpperCase();
    const result = sanitizeObject(input, customSanitize);
    expect(result.value).toBe('TEST');
  });

  it('should handle empty object', () => {
    const result = sanitizeObject({});
    expect(result).toEqual({});
  });

  it('should handle null input', () => {
    const result = sanitizeObject(null as any);
    expect(result).toBe(null);
  });
});
