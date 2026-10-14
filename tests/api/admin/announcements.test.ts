import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerResponse } from 'node:http';

const state = vi.hoisted(() => {
  process.env.SUPABASE_URL = 'https://proj.supabase.co';
  return {
    user: null as { id: string; email: string | null } | null,
    userError: null as { message?: string } | null,
    adminRow: null as { user_id: string } | null,
    list: { data: [] as Record<string, unknown>[], error: null as { code?: string } | null },
    lookup: { data: null as Record<string, unknown> | null, error: null as { code?: string } | null },
    insert: { data: null as Record<string, unknown> | null, error: null as { code?: string } | null },
    update: { data: null as Record<string, unknown> | null, error: null as { code?: string } | null },
    del: { data: null as Record<string, unknown> | null, error: null as { code?: string } | null },
    refs: { data: [] as Record<string, unknown>[], error: null as { code?: string } | null },
    lastInsert: null as Record<string, unknown> | null,
    lastUpdate: null as Record<string, unknown> | null,
    removed: [] as string[][],
  };
});

vi.mock('../../../api/_lib/supabaseAdmin.js', () => ({
  getSupabaseAdmin: () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user }, error: state.userError }),
    },
    storage: {
      from: () => ({
        remove: async (paths: string[]) => {
          state.removed.push(paths);
          return { data: [], error: null };
        },
      }),
    },
    from: (table: string) => {
      if (table === 'admin_users') {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: state.adminRow, error: null }) }),
          }),
        };
      }
      let op = 'select';
      const query: Record<string, unknown> = {
        select: () => query,
        insert: (payload: Record<string, unknown>) => {
          op = 'insert';
          state.lastInsert = payload;
          return query;
        },
        update: (payload: Record<string, unknown>) => {
          op = 'update';
          state.lastUpdate = payload;
          return query;
        },
        delete: () => {
          op = 'delete';
          return query;
        },
        eq: () => query,
        neq: () => query,
        not: () => query,
        lte: () => query,
        order: async () => state.list,
        limit: async () => state.refs,
        maybeSingle: async () => {
          if (op === 'insert') return state.insert;
          if (op === 'update') return state.update;
          if (op === 'delete') return state.del;
          return state.lookup;
        },
      };
      return query;
    },
  }),
}));

import handler from '../../../api/admin/_announcements.js';

const ADMIN_USER = { id: 'admin-1', email: 'admin@example.com' };
const ANNOUNCEMENT_ID = '123e4567-e89b-12d3-a456-426614174000';
const VALID_IMAGE =
  'https://proj.supabase.co/storage/v1/object/public/announcement-images/announcements/x.jpg';

const ROW = {
  id: ANNOUNCEMENT_ID,
  title: 'إعلان تجريبي',
  slug: 'demo-abc12345',
  body: 'نص الإعلان.',
  image_url: VALID_IMAGE,
  status: 'draft',
  published_at: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const VALID_BODY = {
  title: 'إعلان تجريبي',
  body: 'نص الإعلان.',
  imageUrl: VALID_IMAGE,
  status: 'published',
  publishedAt: null,
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
      url: options.url ?? '/api/admin/announcements',
    } as never,
    fake.res,
  );
  return fake;
}

beforeEach(() => {
  state.user = ADMIN_USER;
  state.userError = null;
  state.adminRow = { user_id: ADMIN_USER.id };
  state.list = { data: [ROW], error: null };
  state.lookup = { data: ROW, error: null };
  state.insert = { data: ROW, error: null };
  state.update = { data: ROW, error: null };
  state.del = { data: { id: ANNOUNCEMENT_ID, image_url: VALID_IMAGE }, error: null };
  state.refs = { data: [], error: null };
  state.lastInsert = null;
  state.lastUpdate = null;
  state.removed = [];
});

describe('authorization', () => {
  it('returns 401 without a bearer token', async () => {
    expect((await call()).status).toBe(401);
  });

  it('returns 403 for an authenticated non-admin', async () => {
    state.adminRow = null;
    expect((await call({ token: 'good-token' })).status).toBe(403);
  });
});

describe('GET list', () => {
  it('returns announcements', async () => {
    const result = await call({ token: 'good-token' });
    expect(result.status).toBe(200);
    expect(Array.isArray(result.json?.data)).toBe(true);
  });
});

describe('POST create', () => {
  it('creates a published announcement and sets published_at', async () => {
    const result = await call({ method: 'POST', token: 'good-token', body: VALID_BODY });
    expect(result.status).toBe(201);
    expect(state.lastInsert?.slug).toBeTypeOf('string');
    expect(state.lastInsert?.published_at).toBeTypeOf('string');
  });

  it('creates a draft with a null published_at', async () => {
    const result = await call({
      method: 'POST',
      token: 'good-token',
      body: { ...VALID_BODY, status: 'draft', publishedAt: null },
    });
    expect(result.status).toBe(201);
    expect(state.lastInsert?.published_at).toBeNull();
  });

  it('rejects a missing title', async () => {
    const result = await call({
      method: 'POST',
      token: 'good-token',
      body: { ...VALID_BODY, title: '' },
    });
    expect(result.status).toBe(400);
  });

  it('rejects an image URL outside our bucket', async () => {
    const result = await call({
      method: 'POST',
      token: 'good-token',
      body: { ...VALID_BODY, imageUrl: 'https://evil.example/x.jpg' },
    });
    expect(result.status).toBe(400);
  });
});

describe('PATCH update', () => {
  it('publishes a draft via a status-only update', async () => {
    const result = await call({
      method: 'PATCH',
      token: 'good-token',
      body: { id: ANNOUNCEMENT_ID, status: 'published' },
    });
    expect(result.status).toBe(200);
    expect(state.lastUpdate?.status).toBe('published');
    expect(state.lastUpdate?.published_at).toBeTypeOf('string');
  });

  it('preserves the original published_at on a full edit', async () => {
    state.lookup = {
      data: { ...ROW, status: 'published', published_at: '2025-01-01T00:00:00.000Z' },
      error: null,
    };
    const result = await call({
      method: 'PATCH',
      token: 'good-token',
      body: { id: ANNOUNCEMENT_ID, ...VALID_BODY },
    });
    expect(result.status).toBe(200);
    expect(state.lastUpdate?.published_at).toBe('2025-01-01T00:00:00.000Z');
  });

  it('rejects a malformed id', async () => {
    const result = await call({
      method: 'PATCH',
      token: 'good-token',
      body: { id: 'nope', ...VALID_BODY },
    });
    expect(result.status).toBe(400);
  });

  it('returns 404 when the announcement is missing', async () => {
    state.lookup = { data: null, error: null };
    const result = await call({
      method: 'PATCH',
      token: 'good-token',
      body: { id: ANNOUNCEMENT_ID, ...VALID_BODY },
    });
    expect(result.status).toBe(404);
  });
});

describe('DELETE', () => {
  it('deletes an announcement and removes its unused image', async () => {
    const result = await call({
      method: 'DELETE',
      token: 'good-token',
      url: `/api/admin/announcements?id=${ANNOUNCEMENT_ID}`,
    });
    expect(result.status).toBe(200);
    expect(state.removed.length).toBe(1);
  });

  it('rejects a malformed id', async () => {
    const result = await call({
      method: 'DELETE',
      token: 'good-token',
      url: '/api/admin/announcements?id=nope',
    });
    expect(result.status).toBe(400);
  });

  it('returns 404 when the announcement is missing', async () => {
    state.del = { data: null, error: null };
    const result = await call({
      method: 'DELETE',
      token: 'good-token',
      url: `/api/admin/announcements?id=${ANNOUNCEMENT_ID}`,
    });
    expect(result.status).toBe(404);
  });

  it('rejects unsupported methods', async () => {
    expect((await call({ method: 'PUT', token: 'good-token' })).status).toBe(405);
  });
});
