import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerResponse } from 'node:http';

const state = vi.hoisted(() => ({
  adminThrows: false,
  userThrows: false,
  rowThrows: false,
  user: null as { id: string; email: string | null } | null,
  userError: null as { message?: string } | null,
  adminRow: null as { user_id: string } | null,
  rowError: null as { message?: string } | null,
}));

vi.mock('./supabaseAdmin.js', () => ({
  getSupabaseAdmin: () => {
    if (state.adminThrows) {
      throw new Error('Supabase server credentials are not configured.');
    }

    return {
      auth: {
        getUser: async (_token: string) => {
          if (state.userThrows) {
            throw new Error('auth network failure');
          }
          return {
            data: { user: state.user },
            error: state.userError,
          };
        },
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => {
              if (state.rowThrows) {
                throw new Error('database network failure');
              }
              return { data: state.adminRow, error: state.rowError };
            },
          }),
        }),
      }),
    };
  },
}));

import { resolveAdmin, requireAdmin } from './adminAuth.js';

function createResponse() {
  const headers: Record<string, unknown> = {};
  let body = '';
  const res = {
    statusCode: 0,
    setHeader(name: string, value: unknown) {
      headers[name] = value;
    },
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

function request(authorization?: string) {
  return {
    method: 'GET',
    headers: authorization ? { authorization } : {},
  } as never;
}

beforeEach(() => {
  state.adminThrows = false;
  state.userThrows = false;
  state.rowThrows = false;
  state.user = null;
  state.userError = null;
  state.adminRow = null;
  state.rowError = null;
});

describe('resolveAdmin', () => {
  it('reports unauthenticated when no bearer token is present', async () => {
    const result = await resolveAdmin(request());
    expect(result.status).toBe('unauthenticated');
  });

  it('reports unauthenticated when the token is invalid', async () => {
    state.userError = { message: 'invalid jwt' };
    const result = await resolveAdmin(request('Bearer bad-token'));
    expect(result.status).toBe('unauthenticated');
  });

  it('reports forbidden for an authenticated non-admin user', async () => {
    state.user = { id: 'user-1', email: 'user@example.com' };
    const result = await resolveAdmin(request('Bearer good-token'));
    expect(result.status).toBe('forbidden');
  });

  it('reports ok for an allowlisted administrator', async () => {
    state.user = { id: 'admin-1', email: 'admin@example.com' };
    state.adminRow = { user_id: 'admin-1' };
    const result = await resolveAdmin(request('Bearer good-token'));
    expect(result).toEqual({
      status: 'ok',
      admin: { id: 'admin-1', email: 'admin@example.com' },
    });
  });

  it('reports unavailable when the admin lookup fails', async () => {
    state.user = { id: 'admin-1', email: 'admin@example.com' };
    state.rowError = { message: 'db down' };
    const result = await resolveAdmin(request('Bearer good-token'));
    expect(result.status).toBe('unavailable');
  });

  it('reports unavailable when server credentials are missing', async () => {
    state.adminThrows = true;
    const result = await resolveAdmin(request('Bearer good-token'));
    expect(result.status).toBe('unavailable');
  });

  it('reports unavailable when the token verification throws', async () => {
    state.userThrows = true;
    const result = await resolveAdmin(request('Bearer good-token'));
    expect(result.status).toBe('unavailable');
  });

  it('reports unavailable when the allowlist lookup throws', async () => {
    state.user = { id: 'admin-1', email: 'admin@example.com' };
    state.rowThrows = true;
    const result = await resolveAdmin(request('Bearer good-token'));
    expect(result.status).toBe('unavailable');
  });
});

describe('requireAdmin', () => {
  it('sends 401 without a token', async () => {
    const fake = createResponse();
    const admin = await requireAdmin(request(), fake.res);
    expect(admin).toBeNull();
    expect(fake.status).toBe(401);
  });

  it('sends 403 for a non-admin user', async () => {
    state.user = { id: 'user-1', email: 'user@example.com' };
    const fake = createResponse();
    const admin = await requireAdmin(request('Bearer good-token'), fake.res);
    expect(admin).toBeNull();
    expect(fake.status).toBe(403);
  });

  it('returns the administrator without writing a response', async () => {
    state.user = { id: 'admin-1', email: 'admin@example.com' };
    state.adminRow = { user_id: 'admin-1' };
    const fake = createResponse();
    const admin = await requireAdmin(request('Bearer good-token'), fake.res);
    expect(admin).toEqual({ id: 'admin-1', email: 'admin@example.com' });
    expect(fake.status).toBe(0);
    expect(fake.json).toBeNull();
  });

  it('sends 503 (not 500) when authorization cannot be resolved', async () => {
    state.userThrows = true;
    const fake = createResponse();
    const admin = await requireAdmin(request('Bearer good-token'), fake.res);
    expect(admin).toBeNull();
    expect(fake.status).toBe(503);
  });
});
