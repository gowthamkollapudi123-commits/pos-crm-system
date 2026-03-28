/**
 * Cross-Browser and Responsive Pattern Tests
 *
 * Automated tests for responsive utility functions and breakpoint logic.
 * Requirements: 20.1-20.7
 */

import { describe, it, expect } from 'vitest';
import {
  BREAKPOINTS,
  TAILWIND_BREAKPOINTS,
  RESPONSIVE_LAYOUT_PATTERNS,
  isMobileWidth,
  isTabletWidth,
  isDesktopWidth,
  isSupportedWidth,
  getActiveBreakpoint,
  hasTouchTarget,
  hasTableScroll,
} from '../cross-browser-checklist';

// ── Breakpoints ───────────────────────────────────────────────────────────────

describe('BREAKPOINTS (Req 20.2)', () => {
  it('minimum supported width is 320px', () => {
    expect(BREAKPOINTS.XS).toBe(320);
  });

  it('4K breakpoint is defined', () => {
    expect(BREAKPOINTS['4K']).toBe(3840);
  });

  it('Tailwind breakpoints align with standard values', () => {
    expect(TAILWIND_BREAKPOINTS.sm).toBe(640);
    expect(TAILWIND_BREAKPOINTS.md).toBe(768);
    expect(TAILWIND_BREAKPOINTS.lg).toBe(1024);
    expect(TAILWIND_BREAKPOINTS.xl).toBe(1280);
  });
});

// ── isMobileWidth ─────────────────────────────────────────────────────────────

describe('isMobileWidth (Req 20.3)', () => {
  it('returns true for 320px', () => {
    expect(isMobileWidth(320)).toBe(true);
  });

  it('returns true for 767px', () => {
    expect(isMobileWidth(767)).toBe(true);
  });

  it('returns false for 768px (tablet boundary)', () => {
    expect(isMobileWidth(768)).toBe(false);
  });

  it('returns false for 1024px', () => {
    expect(isMobileWidth(1024)).toBe(false);
  });
});

// ── isTabletWidth ─────────────────────────────────────────────────────────────

describe('isTabletWidth (Req 20.3)', () => {
  it('returns true for 768px', () => {
    expect(isTabletWidth(768)).toBe(true);
  });

  it('returns true for 1023px', () => {
    expect(isTabletWidth(1023)).toBe(true);
  });

  it('returns false for 767px (mobile)', () => {
    expect(isTabletWidth(767)).toBe(false);
  });

  it('returns false for 1024px (desktop)', () => {
    expect(isTabletWidth(1024)).toBe(false);
  });
});

// ── isDesktopWidth ────────────────────────────────────────────────────────────

describe('isDesktopWidth (Req 20.3)', () => {
  it('returns true for 1024px', () => {
    expect(isDesktopWidth(1024)).toBe(true);
  });

  it('returns true for 1920px', () => {
    expect(isDesktopWidth(1920)).toBe(true);
  });

  it('returns true for 3840px (4K)', () => {
    expect(isDesktopWidth(3840)).toBe(true);
  });

  it('returns false for 1023px', () => {
    expect(isDesktopWidth(1023)).toBe(false);
  });
});

// ── isSupportedWidth ──────────────────────────────────────────────────────────

describe('isSupportedWidth (Req 20.2)', () => {
  it('returns true for 320px (minimum)', () => {
    expect(isSupportedWidth(320)).toBe(true);
  });

  it('returns true for 3840px (4K maximum)', () => {
    expect(isSupportedWidth(3840)).toBe(true);
  });

  it('returns true for common widths', () => {
    [375, 768, 1024, 1280, 1920].forEach((w) => {
      expect(isSupportedWidth(w)).toBe(true);
    });
  });

  it('returns false for widths below 320px', () => {
    expect(isSupportedWidth(319)).toBe(false);
    expect(isSupportedWidth(0)).toBe(false);
  });

  it('returns false for widths above 4K', () => {
    expect(isSupportedWidth(3841)).toBe(false);
  });
});

// ── getActiveBreakpoint ───────────────────────────────────────────────────────

describe('getActiveBreakpoint (Req 20.3)', () => {
  it('returns xs for widths below 640px', () => {
    expect(getActiveBreakpoint(320)).toBe('xs');
    expect(getActiveBreakpoint(639)).toBe('xs');
  });

  it('returns sm for 640-767px', () => {
    expect(getActiveBreakpoint(640)).toBe('sm');
    expect(getActiveBreakpoint(767)).toBe('sm');
  });

  it('returns md for 768-1023px', () => {
    expect(getActiveBreakpoint(768)).toBe('md');
    expect(getActiveBreakpoint(1023)).toBe('md');
  });

  it('returns lg for 1024-1279px', () => {
    expect(getActiveBreakpoint(1024)).toBe('lg');
    expect(getActiveBreakpoint(1279)).toBe('lg');
  });

  it('returns xl for 1280-1535px', () => {
    expect(getActiveBreakpoint(1280)).toBe('xl');
  });

  it('returns 2xl for 1536px+', () => {
    expect(getActiveBreakpoint(1536)).toBe('2xl');
    expect(getActiveBreakpoint(3840)).toBe('2xl');
  });
});

// ── Touch Targets — Req 20.4 ──────────────────────────────────────────────────

describe('hasTouchTarget (Req 20.4)', () => {
  it('returns true for min-h-[44px]', () => {
    expect(hasTouchTarget('flex items-center min-h-[44px] px-4')).toBe(true);
  });

  it('returns true for h-11 (44px)', () => {
    expect(hasTouchTarget('h-11 w-11 rounded-full')).toBe(true);
  });

  it('returns true for py-2 (standard button)', () => {
    expect(hasTouchTarget('px-4 py-2 bg-blue-600 text-white rounded-md')).toBe(true);
  });

  it('returns false for very small elements', () => {
    expect(hasTouchTarget('w-2 h-2 rounded-full')).toBe(false);
  });
});

// ── Table Scroll — Req 20.7 ───────────────────────────────────────────────────

describe('hasTableScroll (Req 20.7)', () => {
  it('returns true when overflow-x-auto is present', () => {
    expect(hasTableScroll('w-full overflow-x-auto rounded-lg')).toBe(true);
  });

  it('returns false when overflow-x-auto is absent', () => {
    expect(hasTableScroll('w-full rounded-lg')).toBe(false);
  });
});

// ── Responsive Layout Patterns ────────────────────────────────────────────────

describe('RESPONSIVE_LAYOUT_PATTERNS (Req 20.3, 20.5, 20.6, 20.7)', () => {
  it('defines mobile card and desktop table patterns', () => {
    expect(RESPONSIVE_LAYOUT_PATTERNS.MOBILE_CARD).toBe('md:hidden');
    expect(RESPONSIVE_LAYOUT_PATTERNS.DESKTOP_TABLE).toBe('hidden md:block');
  });

  it('defines touch target pattern', () => {
    expect(RESPONSIVE_LAYOUT_PATTERNS.TOUCH_TARGET).toContain('min-h-[44px]');
  });

  it('defines table scroll pattern', () => {
    expect(RESPONSIVE_LAYOUT_PATTERNS.TABLE_SCROLL).toBe('overflow-x-auto');
  });

  it('defines form stacking patterns', () => {
    expect(RESPONSIVE_LAYOUT_PATTERNS.FORM_STACK).toBe('grid-cols-1');
    expect(RESPONSIVE_LAYOUT_PATTERNS.FORM_STACK_SM).toBe('sm:grid-cols-2');
  });

  it('defines nav collapse patterns', () => {
    expect(RESPONSIVE_LAYOUT_PATTERNS.NAV_MOBILE_HIDDEN).toContain('hidden');
    expect(RESPONSIVE_LAYOUT_PATTERNS.NAV_MOBILE_VISIBLE).toContain('md:hidden');
  });
});
