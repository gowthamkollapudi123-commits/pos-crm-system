/**
 * useSearchHighlight Hook Tests
 *
 * Requirements: 28.5
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { useSearchHighlight } from '../useSearchHighlight';

describe('useSearchHighlight', () => {
  describe('no match cases', () => {
    it('should return a span with original text when query is empty', () => {
      const result = useSearchHighlight('John Doe', '');
      expect(result.type).toBe('span');
      expect(result.props.children).toBe('John Doe');
    });

    it('should return a span with original text when text is empty', () => {
      const result = useSearchHighlight('', 'john');
      expect(result.type).toBe('span');
      expect(result.props.children).toBe('');
    });

    it('should return a span when query does not match text', () => {
      const result = useSearchHighlight('John Doe', 'xyz');
      expect(result.type).toBe('span');
      expect(result.props.children).toBe('John Doe');
    });
  });

  describe('match cases', () => {
    it('should wrap matching portion in a mark element', () => {
      const result = useSearchHighlight('John Doe', 'John');
      expect(result.type).toBe('span');
      const children = result.props.children as React.ReactElement[];
      const markEl = children.find(
        (c): c is React.ReactElement => typeof c === 'object' && c !== null && c.type === 'mark'
      );
      expect(markEl).toBeDefined();
      expect(markEl?.props.children).toBe('John');
    });

    it('should be case-insensitive', () => {
      const result = useSearchHighlight('John Doe', 'john');
      const children = result.props.children as React.ReactElement[];
      const markEl = children.find(
        (c): c is React.ReactElement => typeof c === 'object' && c !== null && c.type === 'mark'
      );
      expect(markEl).toBeDefined();
    });

    it('should highlight partial match in the middle of text', () => {
      const result = useSearchHighlight('Jane Smith', 'Smith');
      const children = result.props.children as React.ReactElement[];
      const markEl = children.find(
        (c): c is React.ReactElement => typeof c === 'object' && c !== null && c.type === 'mark'
      );
      expect(markEl).toBeDefined();
      expect(markEl?.props.children).toBe('Smith');
    });

    it('should apply highlight CSS classes to mark element', () => {
      const result = useSearchHighlight('John Doe', 'John');
      const children = result.props.children as React.ReactElement[];
      const markEl = children.find(
        (c): c is React.ReactElement => typeof c === 'object' && c !== null && c.type === 'mark'
      );
      expect(markEl?.props.className).toContain('bg-yellow-200');
    });

    it('should preserve non-matching text parts', () => {
      const result = useSearchHighlight('John Doe', 'Doe');
      const children = result.props.children as (string | React.ReactElement)[];
      const textParts = children.filter((c) => typeof c === 'string');
      expect(textParts).toContain('John ');
    });
  });

  describe('special character handling', () => {
    it('should handle regex special characters in query without throwing', () => {
      expect(() => useSearchHighlight('Price: $10.00', '$10')).not.toThrow();
    });

    it('should handle parentheses in query', () => {
      expect(() => useSearchHighlight('Test (value)', '(value)')).not.toThrow();
    });

    it('should handle dot in query', () => {
      const result = useSearchHighlight('john.doe@example.com', 'john.doe');
      expect(result.type).toBe('span');
    });
  });
});
