import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerResponse } from 'node:http';

const state = vi.hoisted(() => {
  process.env.SUPABASE_URL = 'https://proj.supabase.co';
  return {
    user: null as { id: string; email: string | null } | null,
    adminRow: null as { user_id: string } | null,
    urlError: null as { name: string } | null,
    lastPath: '' as string,
  };
});

vi.mock('../../../api/_lib/supabaseAdmin.js', () => ({
  getSupabaseAdmin: () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user }, error: null }),
    },
    from: (table: string) => {
      if (table === 'admin_users') {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: state.adminRow, error: null }) }),
          }),
        };
      }
      return {};
    },
    storage: {
      from: () => ({
        createSignedUploadUrl: async (path: string) => {
          state.lastPath = path;
          if (state.urlError) {
            return { data: null, error: state.urlError };
          }
          return { data: { path, token: 'signed-token' }, error: null };
        },
      }),
    },
  }),
}));

import handler from '../../../api/admin/_product-image-uploads.js';

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
}

async function call(options: CallOptions = {}) {
  const fake = createResponse();
  const headers: Record<string, string> = {};
  if (options.token) {
    headers.authorization = `Bearer ${options.token}`;
  }
  await handler({ method: options.method ?? 'POST', headers, body: options.body } as never, fake.res);
  return fake;
}

beforeEach(() => {
  state.user = ADMIN_USER;
  state.adminRow = { user_id: ADMIN_USER.id };
  state.urlError = null;
  state.lastPath = '';
});

describe('authorization', () => {
  it('returns 401 without a bearer token', async () => {
    expect((await call({ body: { contentType: 'image/png' } })).status).toBe(401);
  });

  it('returns 403 for an authenticated non-admin', async () => {
    state.adminRow = null;
    expect((await call({ token: 'good-token', body: { contentType: 'image/png' } })).status).toBe(403);
  });
});

describe('POST signed upload', () => {
  it('rejects an unsupported image type', async () => {
    const result = await call({ token: 'good-token', body: { contentType: 'application/pdf' } });
    expect(result.status).toBe(415);
  });

  it('issues a signed upload URL with a public URL for a valid image', async () => {
    const result = await call({ token: 'good-token', body: { contentType: 'image/png' } });

    expect(result.status).toBe(200);
    expect(result.json?.bucket).toBe('product-images');
    expect(result.json?.token).toBe('signed-token');
    expect(String(result.json?.path)).toMatch(/^products\/[0-9a-f-]{36}\.png$/);
    expect(String(result.json?.publicUrl)).toBe(
      `https://proj.supabase.co/storage/v1/object/public/product-images/${state.lastPath}`,
    );
  });

  it('returns 500 when the signed URL cannot be created', async () => {
    state.urlError = { name: 'storage-error' };
    const result = await call({ token: 'good-token', body: { contentType: 'image/jpeg' } });
    expect(result.status).toBe(500);
  });

  it('rejects non-POST methods', async () => {
    expect((await call({ method: 'GET', token: 'good-token' })).status).toBe(405);
  });
});
