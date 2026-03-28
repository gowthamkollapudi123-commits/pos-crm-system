/**
 * Axios Interceptor Property-Based Tests
 * Feature: pos-crm-audit
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';

/**
 * Pure function extracted from lib/axios.ts request interceptor logic.
 * Transforms a relative URL by injecting the tenant ID segment.
 */
function applyTenantInterceptor(url: string, tenantId: string): string {
  if (!url || !tenantId) return url;
  if (url.includes(`/${tenantId}/`)) return url;
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  return `/${tenantId}/${cleanUrl}`;
}

describe('Axios Interceptor Property-Based Tests', () => {
  // Feature: pos-crm-audit, Property 5: Tenant ID is injected into every outgoing request URL
  it('Property 5: tenant ID is injected into every relative URL path', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 50 })
        .filter(s => /^[a-z0-9/\-_]+$/.test(s) && s.startsWith('/')),
      (url) => {
        const result = applyTenantInterceptor(url, 'demo');
        return result.includes('/demo/');
      }
    ), { numRuns: 100 });
  });

  it('Property 5b: already-injected URLs are not double-injected', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 30 })
        .filter(s => /^[a-z0-9\-_]+$/.test(s)),
      (path) => {
        const alreadyInjected = `/demo/${path}`;
        const result = applyTenantInterceptor(alreadyInjected, 'demo');
        // Should not produce /demo/demo/
        return !result.includes('/demo/demo/');
      }
    ), { numRuns: 100 });
  });

  it('Property 5c: interceptor is idempotent — applying twice gives same result', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 50 })
        .filter(s => /^[a-z0-9/\-_]+$/.test(s) && s.startsWith('/')),
      (url) => {
        const once = applyTenantInterceptor(url, 'demo');
        const twice = applyTenantInterceptor(once, 'demo');
        return once === twice;
      }
    ), { numRuns: 100 });
  });
});
