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

vi.mock('../_lib/supabaseAdmin.js', () => {
  function makeChain(awaitResult: () => unknown, singleResult: () => unknown) {
    const chain: Record<string, unknown> = {};
    const pass = () => chain;
    chain.select = pass;
    chain.order = pass;
    chain.eq = pass;
    chain.or = pass;
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

import handler from './participants.js';

const ADMIN_USER = { id: 'admin-1', email: 'admin@example.com' };
const PARTICIPANT_ID = '123e4567-e89b-12d3-a456-426614174000';

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
      url: options.url ?? '/api/admin/participants',
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
  it('returns newest-first data with count and a hasVideo flag', async () => {
    state.listRows = [
      {
        id: PARTICIPANT_ID,
        full_name: 'سعاد العلمي',
        phone: '0612345678',
        age: 22,
        city: 'بني ملال',
        region: 'other',
        video_path: `golden-voice/${PARTICIPANT_ID}.mp4`,
        created_at: '2026-01-01T00:00:00.000Z',
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
      expect(data[0]).toMatchObject({ hasVideo: true, region: 'other' });
      // The private storage path must never leave the server.
      expect(data[0]).not.toHaveProperty('video_path');
    }
  });

  it('reports hasVideo=false when no video is attached', async () => {
    state.listRows = [
      {
        id: PARTICIPANT_ID,
        full_name: 'مشارك محلي',
        phone: '0612345678',
        age: 30,
        city: 'بني ملال',
        region: 'beni_mellal_khenifra',
        video_path: null,
        created_at: '2026-01-01T00:00:00.000Z',
      },
    ];
    state.listCount = 1;

    const result = await call({ token: 'good-token', url: '/api/admin/participants?q=%D9%85' });
    expect(result.status).toBe(200);
    const data = result.json?.data;
    if (Array.isArray(data)) {
      expect(data[0]).toMatchObject({ hasVideo: false, region: 'beni_mellal_khenifra' });
    }
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
