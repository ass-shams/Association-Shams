import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerResponse } from 'node:http';

const state = vi.hoisted(() => ({
  insertError: null as { code?: string } | null,
  inserted: null as Record<string, unknown> | null,
  turnstileSuccess: true,
}));

vi.mock('../../api/_lib/supabaseAdmin.js', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      insert: async (row: Record<string, unknown>) => {
        state.inserted = row;
        return { error: state.insertError };
      },
    }),
  }),
}));

import handler from '../../api/contact.js';

const BASE = {
  name: 'زائر تجريبي',
  email: 'visitor@example.com',
  message: 'مرحباً، هذه رسالة اختبار.',
  turnstileToken: 'turnstile-token',
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

async function call(body: unknown, method = 'POST') {
  const fake = createResponse();
  await handler({ method, body, headers: {} } as never, fake.res);
  return fake;
}

function stubTurnstile(success: boolean) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ success }) })),
  );
}

beforeEach(() => {
  state.insertError = null;
  state.inserted = null;
  state.turnstileSuccess = true;
  vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
  stubTurnstile(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('POST /api/contact', () => {
  it('stores a valid submission and returns 201', async () => {
    const result = await call(BASE);

    expect(result.status).toBe(201);
    expect(state.inserted).toMatchObject({
      name: 'زائر تجريبي',
      email: 'visitor@example.com',
      phone: null,
      subject: null,
      message: 'مرحباً، هذه رسالة اختبار.',
      status: 'new',
    });
  });

  it('trims values and lowercases the email', async () => {
    const result = await call({
      ...BASE,
      name: '  الاسم  ',
      email: '  User@Example.COM ',
      phone: '  ',
      subject: '  موضوع  ',
    });

    expect(result.status).toBe(201);
    expect(state.inserted).toMatchObject({
      name: 'الاسم',
      email: 'user@example.com',
      phone: null,
      subject: 'موضوع',
    });
  });

  it('rejects a missing name', async () => {
    const { name: _name, ...rest } = BASE;
    const result = await call(rest);
    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('rejects an invalid email', async () => {
    const result = await call({ ...BASE, email: 'not-an-email' });
    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('rejects a missing message', async () => {
    const { message: _message, ...rest } = BASE;
    const result = await call(rest);
    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('rejects an oversized message', async () => {
    const result = await call({ ...BASE, message: 'x'.repeat(5001) });
    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('rejects a missing Turnstile token', async () => {
    const { turnstileToken: _token, ...rest } = BASE;
    const result = await call(rest);
    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('rejects a failed Turnstile verification', async () => {
    stubTurnstile(false);
    const result = await call(BASE);
    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('fails closed when the Turnstile secret is missing', async () => {
    vi.unstubAllEnvs();
    const result = await call(BASE);
    expect(result.status).toBe(503);
    expect(state.inserted).toBeNull();
  });

  it('returns 500 when the insert fails', async () => {
    state.insertError = { code: '23514' };
    const result = await call(BASE);
    expect(result.status).toBe(500);
  });

  it('rejects non-POST methods', async () => {
    const result = await call({}, 'GET');
    expect(result.status).toBe(405);
  });
});
