import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerResponse } from 'node:http';

const state = vi.hoisted(() => {
  process.env.SUPABASE_URL = 'https://proj.supabase.co';
  return {
    user: null as { id: string; email: string | null } | null,
    userError: null as { message?: string } | null,
    adminRow: null as { user_id: string } | null,
    rows: [] as Record<string, unknown>[],
    listError: null as { code?: string } | null,
    inserted: null as Record<string, unknown> | null,
    insertError: null as { code?: string } | null,
    updated: null as Record<string, unknown> | null,
    updateError: null as { code?: string } | null,
    deleted: null as Record<string, unknown> | null,
    deleteError: null as { code?: string } | null,
  };
});

vi.mock('../../../api/_lib/supabaseAdmin.js', () => ({
  getSupabaseAdmin: () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user }, error: state.userError }),
    },
    from: (table: string) => {
      if (table === 'admin_users') {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: state.adminRow, error: null }) }),
          }),
        };
      }
      return {
        select: () => ({ order: async () => ({ data: state.rows, error: state.listError }) }),
        insert: () => ({
          select: () => ({
            maybeSingle: async () => ({ data: state.inserted, error: state.insertError }),
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              maybeSingle: async () => ({ data: state.updated, error: state.updateError }),
            }),
          }),
        }),
        delete: () => ({
          eq: () => ({
            select: () => ({
              maybeSingle: async () => ({ data: state.deleted, error: state.deleteError }),
            }),
          }),
        }),
      };
    },
  }),
}));

import handler from '../../../api/admin/_products.js';

const ADMIN_USER = { id: 'admin-1', email: 'admin@example.com' };
const PRODUCT_ID = '123e4567-e89b-12d3-a456-426614174000';
const VALID_IMAGE = 'https://proj.supabase.co/storage/v1/object/public/product-images/products/x.jpg';

const ROW = {
  id: PRODUCT_ID,
  name: 'قميص الجمعية',
  slug: 'shirt-abc',
  category: 'ملابس',
  price: '150.00',
  compare_at_price: null,
  is_available: true,
  short_description: null,
  description: null,
  additional_information: [],
  tags: [],
  image_url: null,
  is_featured: false,
  is_best_seller: false,
  is_new: false,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const VALID_BODY = { name: 'قميص الجمعية', category: 'ملابس', price: 150 };

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
      url: options.url ?? '/api/admin/products',
    } as never,
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
  state.inserted = ROW;
  state.insertError = null;
  state.updated = ROW;
  state.updateError = null;
  state.deleted = { id: PRODUCT_ID };
  state.deleteError = null;
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
  it('returns products', async () => {
    const result = await call({ token: 'good-token' });
    expect(result.status).toBe(200);
    expect(Array.isArray(result.json?.data)).toBe(true);
  });
});

describe('POST create', () => {
  it('creates a valid product', async () => {
    const result = await call({ method: 'POST', token: 'good-token', body: VALID_BODY });
    expect(result.status).toBe(201);
    expect(result.json?.product).toMatchObject({ id: PRODUCT_ID, price: 150 });
  });

  it('rejects a missing name', async () => {
    const result = await call({ method: 'POST', token: 'good-token', body: { category: 'x', price: 1 } });
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

  it('accepts an image URL from our public bucket', async () => {
    const result = await call({
      method: 'POST',
      token: 'good-token',
      body: { ...VALID_BODY, imageUrl: VALID_IMAGE },
    });
    expect(result.status).toBe(201);
  });
});

describe('PATCH update', () => {
  it('updates a product', async () => {
    const result = await call({
      method: 'PATCH',
      token: 'good-token',
      body: { id: PRODUCT_ID, ...VALID_BODY },
    });
    expect(result.status).toBe(200);
  });

  it('rejects a malformed id', async () => {
    const result = await call({
      method: 'PATCH',
      token: 'good-token',
      body: { id: 'nope', ...VALID_BODY },
    });
    expect(result.status).toBe(400);
  });

  it('returns 404 when the product is missing', async () => {
    state.updated = null;
    const result = await call({
      method: 'PATCH',
      token: 'good-token',
      body: { id: PRODUCT_ID, ...VALID_BODY },
    });
    expect(result.status).toBe(404);
  });
});

describe('DELETE', () => {
  it('deletes a product', async () => {
    const result = await call({
      method: 'DELETE',
      token: 'good-token',
      url: `/api/admin/products?id=${PRODUCT_ID}`,
    });
    expect(result.status).toBe(200);
  });

  it('rejects a malformed id', async () => {
    const result = await call({
      method: 'DELETE',
      token: 'good-token',
      url: '/api/admin/products?id=nope',
    });
    expect(result.status).toBe(400);
  });

  it('returns 404 when the product is missing', async () => {
    state.deleted = null;
    const result = await call({
      method: 'DELETE',
      token: 'good-token',
      url: `/api/admin/products?id=${PRODUCT_ID}`,
    });
    expect(result.status).toBe(404);
  });

  it('rejects unsupported methods', async () => {
    expect((await call({ method: 'PUT', token: 'good-token' })).status).toBe(405);
  });
});
