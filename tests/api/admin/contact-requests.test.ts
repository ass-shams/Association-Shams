import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerResponse } from 'node:http';

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string | null } | null,
  userError: null as { message?: string } | null,
  adminRow: null as { user_id: string } | null,
  listRows: [] as Record<string, unknown>[],
  listCount: 0,
  listError: null as { code?: string } | null,
  detailRow: null as Record<string, unknown> | null,
  updateRow: null as Record<string, unknown> | null,
  updateError: null as { code?: string } | null,
}));

vi.mock('../../../api/_lib/supabaseAdmin.js', () => {
  function makeChain(awaitResult: () => unknown, singleResult: () => unknown) {
    const chain: Record<string, unknown> = {};
    const pass = () => chain;
    chain.select = pass;
    chain.order = pass;
    chain.eq = pass;
    chain.or = pass;
    // `range` is the last call in the list chain; returning the resolved result
    // keeps the mock awaitable without exposing a custom `then`.
    chain.range = () => Promise.resolve(awaitResult());
    chain.maybeSingle = async () => singleResult();
    chain.single = async () => singleResult();
    return chain;
  }

  return {
    getSupabaseAdmin: () => ({
      auth: {
        getUser: async () => ({ data: { user: state.user }, error: state.userError }),
      },
      from: (table: string) => {
        if (table === 'admin_users') {
          return makeChain(
            () => ({ data: null, error: null }),
            () => ({ data: state.adminRow, error: null }),
          );
        }
        return {
          select: () =>
            makeChain(
              () => ({ data: state.listRows, count: state.listCount, error: state.listError }),
              () => ({ data: state.detailRow, error: null }),
            ),
          update: () =>
            makeChain(
              () => ({ data: null, error: null }),
              () => ({ data: state.updateRow, error: state.updateError }),
            ),
        };
      },
    }),
  };
});

import handler from '../../../api/admin/_contact-requests.js';

const REQUEST_ID = '123e4567-e89b-12d3-a456-426614174000';
const ADMIN_USER = { id: 'admin-1', email: 'admin@example.com' };

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

interface CallOptions {
  method?: string;
  token?: string;
  body?: unknown;
  url?: string;
}

async function call(options: CallOptions = {}) {
  const fake = createResponse();
  const headers: Record<string, string> = {};
  if (options.token) {
    headers.authorization = `Bearer ${options.token}`;
  }
  await handler(
    {
      method: options.method ?? 'GET',
      headers,
      body: options.body,
      url: options.url ?? '/api/admin/contact-requests',
    } as never,
    fake.res,
  );
  return fake;
}

beforeEach(() => {
  state.user = ADMIN_USER;
  state.userError = null;
  state.adminRow = { user_id: ADMIN_USER.id };
  state.listRows = [];
  state.listCount = 0;
  state.listError = null;
  state.detailRow = null;
  state.updateRow = null;
  state.updateError = null;
});

describe('authorization', () => {
  it('returns 401 without a bearer token', async () => {
    const result = await call();
    expect(result.status).toBe(401);
  });

  it('returns 401 when the token is invalid', async () => {
    state.user = null;
    state.userError = { message: 'invalid jwt' };
    const result = await call({ token: 'bad-token' });
    expect(result.status).toBe(401);
  });

  it('returns 403 for an authenticated non-admin', async () => {
    state.adminRow = null;
    const result = await call({ token: 'good-token' });
    expect(result.status).toBe(403);
  });
});

describe('GET list', () => {
  it('returns newest-first data with count', async () => {
    state.listRows = [{ id: REQUEST_ID, name: 'زائر', status: 'new' }];
    state.listCount = 1;

    const result = await call({ token: 'good-token' });

    expect(result.status).toBe(200);
    expect(result.json).toMatchObject({ count: 1, page: 1 });
    const data = result.json?.data;
    expect(Array.isArray(data)).toBe(true);
    if (Array.isArray(data)) {
      expect(data).toHaveLength(1);
    }
  });

  it('returns 500 when the list query fails', async () => {
    state.listError = { code: '42P01' };
    const result = await call({ token: 'good-token' });
    expect(result.status).toBe(500);
  });
});

describe('GET detail', () => {
  it('returns a single request', async () => {
    state.detailRow = { id: REQUEST_ID, status: 'new' };
    const result = await call({ token: 'good-token', url: `/api/admin/contact-requests?id=${REQUEST_ID}` });
    expect(result.status).toBe(200);
    expect(result.json?.request).toMatchObject({ id: REQUEST_ID });
  });

  it('rejects a malformed id', async () => {
    const result = await call({ token: 'good-token', url: '/api/admin/contact-requests?id=bad' });
    expect(result.status).toBe(400);
  });

  it('returns 404 when the request does not exist', async () => {
    state.detailRow = null;
    const result = await call({ token: 'good-token', url: `/api/admin/contact-requests?id=${REQUEST_ID}` });
    expect(result.status).toBe(404);
  });
});

describe('PATCH status', () => {
  it('rejects an unsupported status', async () => {
    const result = await call({
      method: 'PATCH',
      token: 'good-token',
      body: { id: REQUEST_ID, status: 'archived' },
    });
    expect(result.status).toBe(400);
  });

  it('rejects a malformed id', async () => {
    const result = await call({
      method: 'PATCH',
      token: 'good-token',
      body: { id: 'nope', status: 'resolved' },
    });
    expect(result.status).toBe(400);
  });

  it('updates the status', async () => {
    state.updateRow = { id: REQUEST_ID, status: 'resolved' };
    const result = await call({
      method: 'PATCH',
      token: 'good-token',
      body: { id: REQUEST_ID, status: 'resolved' },
    });
    expect(result.status).toBe(200);
    expect(result.json?.request).toMatchObject({ status: 'resolved' });
  });

  it('returns 404 when the request does not exist', async () => {
    state.updateRow = null;
    const result = await call({
      method: 'PATCH',
      token: 'good-token',
      body: { id: REQUEST_ID, status: 'resolved' },
    });
    expect(result.status).toBe(404);
  });

  it('rejects unsupported methods', async () => {
    const result = await call({ method: 'PUT', token: 'good-token' });
    expect(result.status).toBe(405);
  });
});
