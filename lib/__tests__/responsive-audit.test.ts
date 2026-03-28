/**
 * Responsive Design Audit Tests
 *
 * Verifies that responsive CSS class patterns are correctly defined
 * and utility functions work as expected.
 *
 * Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6
 */

import { describe, it, expect } from 'vitest';
import {
  RESPONSIVE_PATTERNS,
  hasMobileCardPattern,
  hasDesktopTablePattern,
  hasResponsivePadding,
  hasResponsiveHeaderFlex,
  hasTableScroll,
} from '../responsive-audit';

describe('Responsive Design Patterns', () => {
  describe('RESPONSIVE_PATTERNS constants', () => {
    it('should define mobile card view pattern (Req 20.3)', () => {
      expect(RESPONSIVE_PATTERNS.MOBILE_CARD_VIEW).toBe('md:hidden');
    });

    it('should define desktop table view pattern (Req 20.3)', () => {
      expect(RESPONSIVE_PATTERNS.DESKTOP_TABLE_VIEW).toBe('hidden md:block');
    });

    it('should define touch target minimum height (Req 20.4)', () => {
      expect(RESPONSIVE_PATTERNS.TOUCH_TARGET_MIN_H).toBe('min-h-[44px]');
    });

    it('should define touch target minimum width (Req 20.4)', () => {
      expect(RESPONSIVE_PATTERNS.TOUCH_TARGET_MIN_W).toBe('min-w-[44px]');
    });

    it('should define table horizontal scroll pattern (Req 20.2)', () => {
      expect(RESPONSIVE_PATTERNS.TABLE_SCROLL).toBe('overflow-x-auto');
    });

    it('should define responsive padding patterns (Req 20.2)', () => {
      expect(RESPONSIVE_PATTERNS.PADDING_BASE).toBe('px-4');
      expect(RESPONSIVE_PATTERNS.PADDING_SM).toBe('sm:px-6');
      expect(RESPONSIVE_PATTERNS.PADDING_LG).toBe('lg:px-8');
    });

    it('should define responsive header flex patterns (Req 20.3)', () => {
      expect(RESPONSIVE_PATTERNS.HEADER_FLEX).toBe('flex-col');
      expect(RESPONSIVE_PATTERNS.HEADER_FLEX_SM).toBe('sm:flex-row');
    });
  });

  describe('hasMobileCardPattern', () => {
    it('should return true when md:hidden is present', () => {
      expect(hasMobileCardPattern('md:hidden space-y-4')).toBe(true);
    });

    it('should return false when md:hidden is absent', () => {
      expect(hasMobileCardPattern('hidden md:block')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(hasMobileCardPattern('')).toBe(false);
    });
  });

  describe('hasDesktopTablePattern', () => {
    it('should return true when hidden md:block is present', () => {
      expect(hasDesktopTablePattern('hidden md:block overflow-x-auto')).toBe(true);
    });

    it('should return false when pattern is absent', () => {
      expect(hasDesktopTablePattern('md:hidden space-y-4')).toBe(false);
    });
  });

  describe('hasResponsivePadding', () => {
    it('should return true when both px-4 and sm:px-6 are present', () => {
      expect(hasResponsivePadding('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8')).toBe(true);
    });

    it('should return false when sm:px-6 is missing', () => {
      expect(hasResponsivePadding('max-w-7xl mx-auto px-4')).toBe(false);
    });

    it('should return false when px-4 is missing', () => {
      expect(hasResponsivePadding('max-w-7xl mx-auto sm:px-6 lg:px-8')).toBe(false);
    });
  });

  describe('hasResponsiveHeaderFlex', () => {
    it('should return true when flex-col and sm:flex-row are present', () => {
      expect(
        hasResponsiveHeaderFlex('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4')
      ).toBe(true);
    });

    it('should return false when sm:flex-row is missing', () => {
      expect(hasResponsiveHeaderFlex('flex flex-col gap-4')).toBe(false);
    });

    it('should return false when flex-col is missing', () => {
      expect(hasResponsiveHeaderFlex('flex sm:flex-row gap-4')).toBe(false);
    });
  });

  describe('hasTableScroll', () => {
    it('should return true when overflow-x-auto is present', () => {
      expect(hasTableScroll('overflow-x-auto border border-gray-200 rounded-lg')).toBe(true);
    });

    it('should return false when overflow-x-auto is absent', () => {
      expect(hasTableScroll('border border-gray-200 rounded-lg')).toBe(false);
    });
  });

  describe('Responsive layout pattern combinations (Req 20.3)', () => {
    it('should verify list page uses both mobile card and desktop table patterns', () => {
      // Simulates the pattern used in customers/page.tsx, products/page.tsx, etc.
      const mobileSection = 'md:hidden space-y-4';
      const desktopSection = 'hidden md:block';

      expect(hasMobileCardPattern(mobileSection)).toBe(true);
      expect(hasDesktopTablePattern(desktopSection)).toBe(true);
    });

    it('should verify nav container uses responsive padding (Req 20.2)', () => {
      const navClasses = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
      expect(hasResponsivePadding(navClasses)).toBe(true);
    });

    it('should verify page header uses responsive flex (Req 20.3)', () => {
      const headerClasses = 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4';
      expect(hasResponsiveHeaderFlex(headerClasses)).toBe(true);
    });

    it('should verify data table wrapper has horizontal scroll (Req 20.2)', () => {
      const tableWrapperClasses = 'overflow-x-auto border border-gray-200 rounded-lg';
      expect(hasTableScroll(tableWrapperClasses)).toBe(true);
    });
  });
});
