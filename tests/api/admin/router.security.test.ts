import { describe, expect, it } from 'vitest';
import type { ServerResponse } from 'node:http';

import handler from '../../../api/admin/[route].js';

/**
 * The consolidated router must not become an authorization bypass. These tests
 * import the REAL handlers (no module mocks) so that the guard each endpoint
 * calls (`requireAdmin` / `resolveAdmin`) is the one under test. Without a
 * bearer token `resolveAdmin` returns `unauthenticated` before touching
 * Supabase, so every protected route must answer 401.
 */

const PROTECTED_ROUTES = [
  'me',
  'members',
  'competitions',
  'contact-requests',
  'participants',
  'participant-video',
  'products',
  'product-image-uploads',
] as const;

function createResponse() {
  let body = '';
  const res = {
    statusCode: 0,
    setHeader(_name: string, _value: unknown) {},
    end(chunk?: string) {
      body = typeof chunk === 'string' ? chunk : '';
    },
  };

  return {
    res: res as unknown as ServerResponse,
    get status() {
      return res.statusCode;
    },
    get json() {
      return body ? (JSON.parse(body) as Record<string, unknown>) : null;
    },
  };
}

describe('admin router does not bypass authorization', () => {
  it.each(PROTECTED_ROUTES)('returns 401 for "%s" without a bearer token', async (route) => {
    const fake = createResponse();
    await handler(
      { method: 'GET', headers: {}, query: { route }, url: `/api/admin/${route}` } as never,
      fake.res,
    );

    expect(fake.status).toBe(401);
  });

  it('returns 404 for an unknown route', async () => {
    const fake = createResponse();
    await handler({ method: 'GET', headers: {}, query: { route: 'unknown' } } as never, fake.res);

    expect(fake.status).toBe(404);
  });
});
