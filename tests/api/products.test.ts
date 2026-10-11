import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerResponse } from 'node:http';

const state = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[],
  listError: null as { code?: string } | null,
}));

vi.mock('../../api/_lib/supabaseAdmin.js', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      select: () => ({
        order: async () => ({ data: state.rows, error: state.listError }),
      }),
    }),
  }),
}));

import handler from '../../api/products.js';

const ROW = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'قميص الجمعية',
  slug: 'shirt-abc',
  category: 'ملابس',
  price: '150.00',
  compare_at_price: '190.00',
  is_available: true,
  short_description: 'قميص قطني.',
  description: 'وصف.',
  additional_information: [{ label: 'المادة', value: 'قطن' }],
  tags: ['قميص'],
  image_url: null,
  is_featured: true,
  is_best_seller: false,
  is_new: true,
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

async function call(method = 'GET') {
  const fake = createResponse();
  await handler({ method, headers: {} } as never, fake.res);
  return fake;
}

beforeEach(() => {
  state.rows = [ROW];
  state.listError = null;
});

describe('GET /api/products (public)', () => {
  it('returns the public catalogue with normalised fields', async () => {
    const result = await call();

    expect(result.status).toBe(200);
    const data = result.json?.data;
    expect(Array.isArray(data)).toBe(true);
    if (Array.isArray(data)) {
      expect(data[0]).toMatchObject({
        name: 'قميص الجمعية',
        price: 150,
        compareAtPrice: 190,
        isAvailable: true,
        isFeatured: true,
      });
      // Internal column names must not leak.
      expect(data[0]).not.toHaveProperty('compare_at_price');
    }
  });

  it('returns 500 when the list query fails', async () => {
    state.listError = { code: '42P01' };
    expect((await call()).status).toBe(500);
  });

  it('rejects non-GET methods', async () => {
    expect((await call('POST')).status).toBe(405);
  });
});
