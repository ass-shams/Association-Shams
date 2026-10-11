import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerResponse } from 'node:http';

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string | null } | null,
  userError: null as { message?: string } | null,
  adminRow: null as { user_id: string } | null,
  listRows: [] as Record<string, unknown>[],
  listCount: 0,
  listError: null as { code?: string } | null,
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
              () => ({ data: null, error: null }),
            ),
        };
      },
    }),
  };
});

import handler from '../../../api/admin/_members.js';

const ADMIN_USER = { id: 'admin-1', email: 'admin@example.com' };
const MEMBER_ID = '123e4567-e89b-12d3-a456-426614174000';

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
      url: options.url ?? '/api/admin/members',
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
    state.listRows = [
      {
        id: MEMBER_ID,
        full_name: 'سعاد العلمي',
        phone: '0612345678',
        city: 'بني ملال',
        age: 22,
        gender: 'female',
        interests: ['ثقافية'],
        expectations: null,
      },
    ];
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

  it('accepts a search term', async () => {
    const result = await call({ token: 'good-token', url: '/api/admin/members?q=%D8%A8%D9%86%D9%8A' });
    expect(result.status).toBe(200);
  });

  it('returns 500 when the list query fails', async () => {
    state.listError = { code: '42P01' };
    const result = await call({ token: 'good-token' });
    expect(result.status).toBe(500);
  });

  it('rejects non-GET methods', async () => {
    const result = await call({ method: 'POST', token: 'good-token' });
    expect(result.status).toBe(405);
  });
});
