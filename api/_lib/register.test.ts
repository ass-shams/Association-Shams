import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerResponse } from 'node:http';

const TICKET_PATH = 'golden-voice/123e4567-e89b-12d3-a456-426614174000.mp4';

const state = vi.hoisted(() => ({
  insertError: null as { code?: string } | null,
  inserted: null as Record<string, unknown> | null,
  verify: { ok: true } as { ok: true } | { ok: false; message: string },
  removed: [] as string[],
  turnstile: 'ok' as 'ok' | 'failed' | 'unavailable',
  rate: 'allowed' as 'allowed' | 'limited' | 'unavailable',
  claim: { ok: true, objectPath: 'golden-voice/123e4567-e89b-12d3-a456-426614174000.mp4' } as
    | { ok: true; objectPath: string }
    | { ok: false; reason: 'invalid' | 'unavailable' },
}));

const gate = vi.hoisted(() => ({
  result: { ok: true, competitionId: 'comp-1' } as
    | { ok: true; competitionId: string }
    | { ok: false; reason: 'unavailable' | 'not-found' | 'not-open' },
}));

vi.mock('./competitions.js', () => ({
  resolveGoldenVoiceRegistrationGate: async () => gate.result,
}));

vi.mock('./supabaseAdmin.js', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      insert: async (row: Record<string, unknown>) => {
        state.inserted = row;
        return { error: state.insertError };
      },
    }),
  }),
}));

vi.mock('./tickets.js', () => ({
  claimUploadTicket: async () => state.claim,
}));

vi.mock('./rateLimit.js', () => ({
  consumeRateLimit: async () => state.rate,
  hashIdentifier: (value: string) => `hash:${value}`,
}));

vi.mock('./turnstile.js', () => ({
  verifyTurnstile: async () => state.turnstile,
  firstForwardedIp: () => '203.0.113.7',
}));

vi.mock('./goldenVoice.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./goldenVoice.js')>();
  return {
    ...actual,
    verifyVideo: async () => state.verify,
    removeObject: async (objectPath: string) => {
      state.removed.push(objectPath);
    },
  };
});

import handler from '../golden-voice/register.js';

const BASE = { fullName: 'سعاد العلمي', phone: '0612345678', age: 22, city: 'بني ملال' };
const CAPTCHA = 'turnstile-token';

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

async function call(body: unknown, method = 'POST') {
  const fake = createResponse();
  await handler({ method, body, headers: {} } as never, fake.res);
  return fake;
}

beforeEach(() => {
  state.insertError = null;
  state.inserted = null;
  state.verify = { ok: true };
  state.removed = [];
  state.turnstile = 'ok';
  state.rate = 'allowed';
  state.claim = { ok: true, objectPath: TICKET_PATH };
  gate.result = { ok: true, competitionId: 'comp-1' };
});

describe('POST /api/golden-voice/register (with video)', () => {
  it('registers using the object path from the claimed ticket', async () => {
    const result = await call({ ...BASE, region: 'other', ticketId: 'ticket-1' });

    expect(result.status).toBe(201);
    expect(state.inserted).toMatchObject({ region: 'other', video_path: TICKET_PATH });
    expect(state.removed).toHaveLength(0);
  });

  it('ignores an arbitrary client-supplied video path', async () => {
    const result = await call({
      ...BASE,
      region: 'other',
      ticketId: 'ticket-1',
      videoPath: 'golden-voice/attacker-chosen.mp4',
    });

    expect(result.status).toBe(201);
    expect(state.inserted).toMatchObject({ video_path: TICKET_PATH });
  });

  it('rejects a video registration without a ticket', async () => {
    const result = await call({ ...BASE, region: 'other' });

    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('rejects a missing, expired or reused ticket', async () => {
    state.claim = { ok: false, reason: 'invalid' };
    const result = await call({ ...BASE, region: 'other', ticketId: 'stale' });

    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('fails closed when the ticket store is unavailable', async () => {
    state.claim = { ok: false, reason: 'unavailable' };
    const result = await call({ ...BASE, region: 'other', ticketId: 'ticket-1' });

    expect(result.status).toBe(503);
    expect(state.inserted).toBeNull();
  });

  it('cleans up the object when verification fails', async () => {
    state.verify = { ok: false, message: 'سبب محدد' };
    const result = await call({ ...BASE, region: 'other', ticketId: 'ticket-1' });

    expect(result.status).toBe(400);
    expect(result.json?.message).toBe('سبب محدد');
    expect(state.removed).toEqual([TICKET_PATH]);
  });

  it('cleans up the object when the insert fails', async () => {
    state.insertError = { code: '23514' };
    const result = await call({ ...BASE, region: 'other', ticketId: 'ticket-1' });

    expect(result.status).toBe(500);
    expect(state.removed).toEqual([TICKET_PATH]);
  });
});

describe('POST /api/golden-voice/register (Beni Mellal-Khenifra)', () => {
  it('registers without a video when Turnstile succeeds', async () => {
    const result = await call({ ...BASE, region: 'beni_mellal_khenifra', turnstileToken: CAPTCHA });

    expect(result.status).toBe(201);
    expect(state.inserted).toMatchObject({ region: 'beni_mellal_khenifra', video_path: null });
  });

  it('rejects a missing Turnstile token', async () => {
    const result = await call({ ...BASE, region: 'beni_mellal_khenifra' });

    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('rejects a failed Turnstile verification', async () => {
    state.turnstile = 'failed';
    const result = await call({ ...BASE, region: 'beni_mellal_khenifra', turnstileToken: CAPTCHA });

    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('fails closed when Turnstile verification is unavailable', async () => {
    state.turnstile = 'unavailable';
    const result = await call({ ...BASE, region: 'beni_mellal_khenifra', turnstileToken: CAPTCHA });

    expect(result.status).toBe(503);
    expect(state.inserted).toBeNull();
  });

  it('rejects a video path for the no-video region', async () => {
    const result = await call({
      ...BASE,
      region: 'beni_mellal_khenifra',
      videoPath: TICKET_PATH,
      turnstileToken: CAPTCHA,
    });

    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('rejects a ticket for the no-video region', async () => {
    const result = await call({
      ...BASE,
      region: 'beni_mellal_khenifra',
      ticketId: 'ticket-1',
      turnstileToken: CAPTCHA,
    });

    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });
});

describe('rate limiting', () => {
  it('rejects repeated registrations over the rate limit', async () => {
    state.rate = 'limited';
    const result = await call({ ...BASE, region: 'beni_mellal_khenifra', turnstileToken: CAPTCHA });
    expect(result.status).toBe(429);
  });

  it('fails closed when the rate limit cannot be checked', async () => {
    state.rate = 'unavailable';
    const result = await call({ ...BASE, region: 'beni_mellal_khenifra', turnstileToken: CAPTCHA });
    expect(result.status).toBe(503);
  });
});

describe('validation and method handling', () => {
  it('rejects an unknown region', async () => {
    const result = await call({ ...BASE, region: 'atlantis' });
    expect(result.status).toBe(400);
  });

  it('associates every registration with its competition', async () => {
    const result = await call({ ...BASE, region: 'beni_mellal_khenifra', turnstileToken: CAPTCHA });
    expect(result.status).toBe(201);
    expect(state.inserted).toMatchObject({ competition_id: 'comp-1' });
  });

  it('rejects missing required fields', async () => {
    const result = await call({ region: 'beni_mellal_khenifra', turnstileToken: CAPTCHA });
    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('rejects oversized text fields', async () => {
    const result = await call({
      ...BASE,
      fullName: 'x'.repeat(500),
      region: 'beni_mellal_khenifra',
      turnstileToken: CAPTCHA,
    });
    expect(result.status).toBe(400);
  });

  it('rejects non-POST methods', async () => {
    const result = await call({}, 'GET');
    expect(result.status).toBe(405);
  });
});

describe('competition registration gate', () => {
  it('refuses registration when the competition is not open', async () => {
    gate.result = { ok: false, reason: 'not-open' };
    const result = await call({ ...BASE, region: 'beni_mellal_khenifra', turnstileToken: CAPTCHA });
    expect(result.status).toBe(403);
    expect(state.inserted).toBeNull();
  });

  it('fails closed when the competition is unavailable', async () => {
    gate.result = { ok: false, reason: 'unavailable' };
    const result = await call({ ...BASE, region: 'beni_mellal_khenifra', turnstileToken: CAPTCHA });
    expect(result.status).toBe(503);
    expect(state.inserted).toBeNull();
  });

  it('fails closed when the competition is missing', async () => {
    gate.result = { ok: false, reason: 'not-found' };
    const result = await call({ ...BASE, region: 'beni_mellal_khenifra', turnstileToken: CAPTCHA });
    expect(result.status).toBe(503);
    expect(state.inserted).toBeNull();
  });
});
