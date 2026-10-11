import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerResponse } from 'node:http';

const state = vi.hoisted(() => ({
  insertError: null as { code?: string } | null,
  inserted: null as Record<string, unknown> | null,
  turnstile: 'ok' as 'ok' | 'failed' | 'unavailable',
  rate: 'allowed' as 'allowed' | 'limited' | 'unavailable',
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

vi.mock('../../api/_lib/turnstile.js', () => ({
  verifyTurnstile: async () => state.turnstile,
  firstForwardedIp: () => '203.0.113.7',
}));

vi.mock('../../api/_lib/rateLimit.js', () => ({
  consumeRateLimit: async () => state.rate,
  hashIdentifier: (value: string) => `hash:${value}`,
}));

import handler from '../../api/membership.js';

const BASE = {
  fullName: 'سعاد العلمي',
  phone: '0612345678',
  city: 'بني ملال',
  age: '22',
  gender: 'female',
  interests: ['ثقافية', 'فنية'],
  expectations: 'المشاركة في الأنشطة الثقافية للجمعية.',
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

beforeEach(() => {
  state.insertError = null;
  state.inserted = null;
  state.turnstile = 'ok';
  state.rate = 'allowed';
});

describe('POST /api/membership', () => {
  it('stores a valid application and returns 201', async () => {
    const result = await call(BASE);

    expect(result.status).toBe(201);
    expect(state.inserted).toMatchObject({
      full_name: 'سعاد العلمي',
      phone: '0612345678',
      city: 'بني ملال',
      age: 22,
      gender: 'female',
      interests: ['ثقافية', 'فنية'],
      expectations: 'المشاركة في الأنشطة الثقافية للجمعية.',
    });
  });

  it('accepts a numeric age and trims values', async () => {
    const result = await call({
      ...BASE,
      fullName: '  الاسم الكامل  ',
      city: '  الدار البيضاء ',
      age: 30,
      expectations: '  ',
    });

    expect(result.status).toBe(201);
    expect(state.inserted).toMatchObject({
      full_name: 'الاسم الكامل',
      city: 'الدار البيضاء',
      age: 30,
      expectations: null,
    });
  });

  it('de-duplicates interests while preserving order', async () => {
    const result = await call({ ...BASE, interests: ['فنية', 'ثقافية', 'فنية'] });

    expect(result.status).toBe(201);
    expect(state.inserted).toMatchObject({ interests: ['فنية', 'ثقافية'] });
  });

  it('rejects a missing full name', async () => {
    const { fullName: _fullName, ...rest } = BASE;
    const result = await call(rest);
    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('rejects a too-short full name', async () => {
    const result = await call({ ...BASE, fullName: 'أب' });
    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('rejects an invalid phone number', async () => {
    const result = await call({ ...BASE, phone: '123' });
    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('rejects a missing city', async () => {
    const { city: _city, ...rest } = BASE;
    const result = await call(rest);
    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('rejects a missing or invalid age', async () => {
    const { age: _age, ...rest } = BASE;
    expect((await call(rest)).status).toBe(400);
    expect((await call({ ...BASE, age: '0' })).status).toBe(400);
    expect((await call({ ...BASE, age: '5.5' })).status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('rejects a missing gender', async () => {
    const { gender: _gender, ...rest } = BASE;
    const result = await call(rest);
    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('rejects an unsupported gender', async () => {
    const result = await call({ ...BASE, gender: 'other' });
    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('rejects an empty interests selection', async () => {
    const result = await call({ ...BASE, interests: [] });
    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('rejects an interest outside the approved options', async () => {
    const result = await call({ ...BASE, interests: ['ثقافية', 'سياسية'] });
    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('rejects an oversized expectations value', async () => {
    const result = await call({ ...BASE, expectations: 'x'.repeat(5001) });
    expect(result.status).toBe(400);
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

describe('anti-abuse protections', () => {
  it('rejects a missing Turnstile token', async () => {
    const { turnstileToken: _token, ...rest } = BASE;
    const result = await call(rest);

    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('rejects a failed Turnstile verification', async () => {
    state.turnstile = 'failed';
    const result = await call(BASE);

    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('fails closed when Turnstile verification is unavailable', async () => {
    state.turnstile = 'unavailable';
    const result = await call(BASE);

    expect(result.status).toBe(503);
    expect(state.inserted).toBeNull();
  });

  it('rejects repeated requests over the rate limit', async () => {
    state.rate = 'limited';
    const result = await call(BASE);

    expect(result.status).toBe(429);
    expect(state.inserted).toBeNull();
  });

  it('fails closed when the rate limit cannot be checked', async () => {
    state.rate = 'unavailable';
    const result = await call(BASE);

    expect(result.status).toBe(503);
    expect(state.inserted).toBeNull();
  });

  it('does not insert when Turnstile fails even with valid fields', async () => {
    state.turnstile = 'failed';
    await call({ ...BASE, expectations: '  ' });
    expect(state.inserted).toBeNull();
  });
});
