import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerResponse } from 'node:http';

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string | null } | null,
  userError: null as { message?: string } | null,
  adminRow: null as { user_id: string } | null,
  rows: [] as Record<string, unknown>[],
  listError: null as { code?: string } | null,
  updatedRow: null as Record<string, unknown> | null,
  updateError: null as { code?: string } | null,
  count: 0,
  countError: null as { code?: string } | null,
}));

vi.mock('../../../api/_lib/supabaseAdmin.js', () => ({
  getSupabaseAdmin: () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user }, error: state.userError }),
    },
    from: (table: string) => {
      if (table === 'admin_users') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: state.adminRow, error: null }),
            }),
          }),
        };
      }
      if (table === 'competitions') {
        return {
          select: () => ({
            order: async () => ({ data: state.rows, error: state.listError }),
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                maybeSingle: async () => ({ data: state.updatedRow, error: state.updateError }),
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: async () => ({ count: state.count, error: state.countError }),
        }),
      };
    },
  }),
}));

import handler from '../../../api/admin/_competitions.js';

const ADMIN_USER = { id: 'admin-1', email: 'admin@example.com' };
const COMPETITION_ID = '123e4567-e89b-12d3-a456-426614174000';

const ROW = {
  id: COMPETITION_ID,
  slug: 'golden-voice',
  title: 'مسابقة الصوت الذهبي',
  description: 'وصف',
  status: 'open',
  registration_deadline: '2026-10-23T22:59:59.000Z',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

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
}

async function call(options: CallOptions = {}) {
  const fake = createResponse();
  const headers: Record<string, string> = {};
  if (options.token) {
    headers.authorization = `Bearer ${options.token}`;
  }
  await handler(
    { method: options.method ?? 'GET', headers, body: options.body } as never,
    fake.res,
  );
  return fake;
}

beforeEach(() => {
  state.user = ADMIN_USER;
  state.userError = null;
  state.adminRow = { user_id: ADMIN_USER.id };
  state.rows = [ROW];
  state.listError = null;
  state.updatedRow = null;
  state.updateError = null;
  state.count = 3;
  state.countError = null;
});

describe('authorization', () => {
  it('returns 401 without a bearer token', async () => {
    expect((await call()).status).toBe(401);
  });

  it('returns 401 when the token is invalid', async () => {
    state.user = null;
    state.userError = { message: 'invalid jwt' };
    expect((await call({ token: 'bad-token' })).status).toBe(401);
  });

  it('returns 403 for an authenticated non-admin', async () => {
    state.adminRow = null;
    expect((await call({ token: 'good-token' })).status).toBe(403);
  });
});

describe('GET list', () => {
  it('returns competitions with real participant counts', async () => {
    const result = await call({ token: 'good-token' });
    expect(result.status).toBe(200);
    const data = result.json?.data;
    expect(Array.isArray(data)).toBe(true);
    if (Array.isArray(data)) {
      expect(data[0]).toMatchObject({ slug: 'golden-voice', status: 'open', participantCount: 3 });
    }
  });

  it('returns 500 when a participant count fails', async () => {
    state.countError = { code: '42P01' };
    expect((await call({ token: 'good-token' })).status).toBe(500);
  });

  it('rejects unsupported methods', async () => {
    expect((await call({ method: 'PUT', token: 'good-token' })).status).toBe(405);
  });
});

describe('PATCH settings', () => {
  it('rejects an invalid status', async () => {
    const result = await call({
      method: 'PATCH',
      token: 'good-token',
      body: { id: COMPETITION_ID, status: 'ended' },
    });
    expect(result.status).toBe(400);
  });

  it('rejects a malformed deadline', async () => {
    const result = await call({
      method: 'PATCH',
      token: 'good-token',
      body: { id: COMPETITION_ID, registrationDeadline: 'not-a-date' },
    });
    expect(result.status).toBe(400);
  });

  it('rejects an empty title', async () => {
    const result = await call({
      method: 'PATCH',
      token: 'good-token',
      body: { id: COMPETITION_ID, title: '   ' },
    });
    expect(result.status).toBe(400);
  });

  it('rejects a malformed id', async () => {
    const result = await call({
      method: 'PATCH',
      token: 'good-token',
      body: { id: 'nope', status: 'closed' },
    });
    expect(result.status).toBe(400);
  });

  it('updates the settings and returns the competition', async () => {
    state.updatedRow = { ...ROW, status: 'paused', registration_deadline: null };

    const result = await call({
      method: 'PATCH',
      token: 'good-token',
      body: { id: COMPETITION_ID, status: 'paused', registrationDeadline: null },
    });

    expect(result.status).toBe(200);
    expect(result.json?.competition).toMatchObject({
      status: 'paused',
      registrationDeadline: null,
      participantCount: 3,
    });
  });

  it('returns 404 when the competition does not exist', async () => {
    state.updatedRow = null;
    const result = await call({
      method: 'PATCH',
      token: 'good-token',
      body: { id: COMPETITION_ID, status: 'closed' },
    });
    expect(result.status).toBe(404);
  });
});
