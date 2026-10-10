import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerResponse } from 'node:http';
import type { AdminAuthResult } from '../_lib/adminAuth.js';

const state = vi.hoisted(() => ({
  result: { status: 'unauthenticated' } as AdminAuthResult,
}));

vi.mock('../_lib/adminAuth.js', () => ({
  resolveAdmin: async () => state.result,
}));

import handler from './me.js';

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

async function call(method = 'GET') {
  const fake = createResponse();
  await handler({ method, headers: {} } as never, fake.res);
  return fake;
}

beforeEach(() => {
  state.result = { status: 'unauthenticated' };
});

describe('GET /api/admin/me', () => {
  it('returns the admin identity for an allowlisted user', async () => {
    state.result = { status: 'ok', admin: { id: 'admin-1', email: 'admin@example.com' } };
    const result = await call();
    expect(result.status).toBe(200);
    expect(result.json?.admin).toEqual({ id: 'admin-1', email: 'admin@example.com' });
  });

  it('returns 401 without a valid session', async () => {
    const result = await call();
    expect(result.status).toBe(401);
  });

  it('returns 403 for an authenticated non-admin', async () => {
    state.result = { status: 'forbidden' };
    const result = await call();
    expect(result.status).toBe(403);
  });

  it('returns 503 when server credentials are unavailable', async () => {
    state.result = { status: 'unavailable' };
    const result = await call();
    expect(result.status).toBe(503);
  });

  it('rejects non-GET methods', async () => {
    const result = await call('POST');
    expect(result.status).toBe(405);
  });
});
