import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerResponse } from 'node:http';

const state = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[],
  listError: null as { code?: string } | null,
  single: null as Record<string, unknown> | null,
  singleError: null as { code?: string } | null,
}));

vi.mock('../../api/_lib/supabaseAdmin.js', () => ({
  getSupabaseAdmin: () => ({
    from: () => {
      const query = {
        select: () => query,
        eq: () => query,
        not: () => query,
        lte: () => query,
        order: () => query,
        limit: async () => ({ data: state.rows, error: state.listError }),
        maybeSingle: async () => ({ data: state.single, error: state.singleError }),
      };
      return query;
    },
  }),
}));

import handler from '../../api/announcements.js';

const ROW = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'إعلان تجريبي',
  slug: 'demo-abc12345',
  body: 'نص الإعلان.',
  image_url: 'https://proj.supabase.co/storage/v1/object/public/announcement-images/announcements/x.jpg',
  status: 'published',
  published_at: '2026-01-01T00:00:00.000Z',
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

async function call(method = 'GET', url = '/api/announcements') {
  const fake = createResponse();
  await handler({ method, headers: {}, url } as never, fake.res);
  return fake;
}

beforeEach(() => {
  state.rows = [ROW];
  state.listError = null;
  state.single = ROW;
  state.singleError = null;
});

describe('GET /api/announcements (public)', () => {
  it('returns the public list with normalised fields', async () => {
    const result = await call();

    expect(result.status).toBe(200);
    const data = result.json?.data;
    expect(Array.isArray(data)).toBe(true);
    if (Array.isArray(data)) {
      expect(data[0]).toMatchObject({
        title: 'إعلان تجريبي',
        status: 'published',
        publishedAt: '2026-01-01T00:00:00.000Z',
      });
      // Internal column names must not leak.
      expect(data[0]).not.toHaveProperty('published_at');
      expect(data[0]).not.toHaveProperty('image_url');
    }
  });

  it('returns a single announcement by slug', async () => {
    const result = await call('GET', '/api/announcements?slug=demo-abc12345');
    expect(result.status).toBe(200);
    expect(result.json?.announcement).toMatchObject({ slug: 'demo-abc12345' });
  });

  it('returns 404 for an unknown slug', async () => {
    state.single = null;
    const result = await call('GET', '/api/announcements?slug=missing');
    expect(result.status).toBe(404);
  });

  it('returns 500 when the list query fails', async () => {
    state.listError = { code: '42P01' };
    expect((await call()).status).toBe(500);
  });

  it('rejects non-GET methods', async () => {
    expect((await call('POST')).status).toBe(405);
  });
});
