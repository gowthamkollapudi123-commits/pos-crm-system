/**
 * Cross-Browser and Responsive Testing Checklist
 *
 * Documents the cross-browser testing checklist and responsive breakpoints.
 * Requirements: 20.1-20.7
 */

// ─────────────────────────────────────────────────────────────────────────────
// CROSS-BROWSER TESTING CHECKLIST
// ─────────────────────────────────────────────────────────────────────────────

export const CROSS_BROWSER_CHECKLIST = {
  browsers: [
    { name: 'Chrome', minVersion: 90, notes: 'Primary development target' },
    { name: 'Firefox', minVersion: 88, notes: 'Full feature parity required' },
    { name: 'Safari', minVersion: 14, notes: 'iOS Safari also required' },
    { name: 'Edge', minVersion: 90, notes: 'Chromium-based, should match Chrome' },
  ],

  mobileDevices: [
    { platform: 'iOS', minVersion: '14', browsers: ['Safari', 'Chrome'] },
    { platform: 'Android', minVersion: '10', browsers: ['Chrome'] },
  ],

  tablets: [
    { platform: 'iPad', minVersion: 'iPadOS 14', browsers: ['Safari'] },
    { platform: 'Android Tablet', minVersion: '10', browsers: ['Chrome'] },
  ],

  featureChecks: [
    'IndexedDB availability and quota',
    'Service Worker registration',
    'CSS Grid and Flexbox layout',
    'CSS custom properties (variables)',
    'Intersection Observer API',
    'Fetch API with credentials',
    'Web Storage (localStorage/sessionStorage)',
    'navigator.onLine and network events',
  ],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSIVE BREAKPOINTS — Req 20.2, 20.3
// ─────────────────────────────────────────────────────────────────────────────

export const BREAKPOINTS = {
  /** Minimum supported width */
  XS: 320,
  /** Small devices (phones landscape) */
  SM: 640,
  /** Medium devices (tablets) */
  MD: 768,
  /** Large devices (laptops) */
  LG: 1024,
  /** Extra large (desktops) */
  XL: 1280,
  /** 2XL (wide screens) */
  '2XL': 1536,
  /** 4K screens */
  '4K': 3840,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/** Tailwind CSS breakpoint prefix map */
export const TAILWIND_BREAKPOINTS: Record<string, number> = {
  sm: BREAKPOINTS.SM,
  md: BREAKPOINTS.MD,
  lg: BREAKPOINTS.LG,
  xl: BREAKPOINTS.XL,
  '2xl': BREAKPOINTS['2XL'],
};

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSIVE LAYOUT PATTERNS — Req 20.3, 20.4, 20.5, 20.6, 20.7
// ─────────────────────────────────────────────────────────────────────────────

export const RESPONSIVE_LAYOUT_PATTERNS = {
  /** Mobile-first card/table switch */
  MOBILE_CARD: 'md:hidden',
  DESKTOP_TABLE: 'hidden md:block',

  /** Minimum touch target size (44px) — Req 20.4 */
  TOUCH_TARGET: 'min-h-[44px] min-w-[44px]',

  /** Horizontal scroll for tables on small screens — Req 20.7 */
  TABLE_SCROLL: 'overflow-x-auto',

  /** Stacked form fields on mobile — Req 20.6 */
  FORM_STACK: 'grid-cols-1',
  FORM_STACK_SM: 'sm:grid-cols-2',

  /** Collapsed navigation on mobile — Req 20.5 */
  NAV_MOBILE_HIDDEN: 'hidden md:flex',
  NAV_MOBILE_VISIBLE: 'flex md:hidden',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if the given width falls within a mobile viewport (< MD breakpoint).
 */
export function isMobileWidth(width: number): boolean {
  return width < BREAKPOINTS.MD;
}

/**
 * Returns true if the given width falls within a tablet viewport (MD to LG).
 */
export function isTabletWidth(width: number): boolean {
  return width >= BREAKPOINTS.MD && width < BREAKPOINTS.LG;
}

/**
 * Returns true if the given width falls within a desktop viewport (>= LG).
 */
export function isDesktopWidth(width: number): boolean {
  return width >= BREAKPOINTS.LG;
}

/**
 * Returns true if the given width is within the supported range (320px to 4K).
 * Requirement 20.2
 */
export function isSupportedWidth(width: number): boolean {
  return width >= BREAKPOINTS.XS && width <= BREAKPOINTS['4K'];
}

/**
 * Returns the active Tailwind breakpoint name for a given width.
 */
export function getActiveBreakpoint(width: number): string {
  if (width >= BREAKPOINTS['2XL']) return '2xl';
  if (width >= BREAKPOINTS.XL) return 'xl';
  if (width >= BREAKPOINTS.LG) return 'lg';
  if (width >= BREAKPOINTS.MD) return 'md';
  if (width >= BREAKPOINTS.SM) return 'sm';
  return 'xs';
}

/**
 * Returns true if a className string contains the touch target pattern.
 * Requirement 20.4
 */
export function hasTouchTarget(classNames: string): boolean {
  return (
    classNames.includes('min-h-[44px]') ||
    classNames.includes('h-11') || // 44px = 2.75rem = h-11
    classNames.includes('h-12') ||
    classNames.includes('py-3') ||
    classNames.includes('py-2') // px-4 py-2 typically renders ≥44px
  );
}

/**
 * Returns true if a className string contains horizontal scroll for tables.
 * Requirement 20.7
 */
export function hasTableScroll(classNames: string): boolean {
  return classNames.includes('overflow-x-auto');
}
