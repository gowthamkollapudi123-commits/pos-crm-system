/**
 * Sanitizer Property-Based Tests
 * Feature: pos-crm-audit
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { sanitizeHtml } from '@/utils/sanitizer';

describe('Sanitizer Property-Based Tests', () => {
  // Feature: pos-crm-audit, Property 6: sanitizeHtml is idempotent
  it('Property 6: sanitizeHtml(sanitizeHtml(x)) === sanitizeHtml(x) for any string', () => {
    fc.assert(fc.property(
      fc.string(),
      (input) => sanitizeHtml(sanitizeHtml(input)) === sanitizeHtml(input)
    ), { numRuns: 200 });
  });

  // Feature: pos-crm-audit, Property 7: sanitizeHtml never produces script tags or event handlers
  it('Property 7: sanitizeHtml output never contains script tags, javascript: or event handlers', () => {
    fc.assert(fc.property(
      fc.string(),
      (input) => {
        const result = sanitizeHtml(input);
        return !/<script/i.test(result)
          && !/javascript:/i.test(result)
          && !/\son\w+\s*=/i.test(result);
      }
    ), { numRuns: 200 });
  });
});
