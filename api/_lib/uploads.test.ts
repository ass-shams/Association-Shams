import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerResponse } from 'node:http';

const state = vi.hoisted(() => ({
  turnstile: 'ok' as 'ok' | 'failed' | 'unavailable',
  rate: 'allowed' as 'allowed' | 'limited' | 'unavailable',
  ticket: { ok: true, id: 'ticket-1' } as
    | { ok: true; id: string }
    | { ok: false; reason: 'unavailable' },
  urlError: null as { name: string } | null,
}));

vi.mock('./turnstile.js', () => ({
  verifyTurnstile: async () => state.turnstile,
  firstForwardedIp: () => '203.0.113.7',
}));

vi.mock('./rateLimit.js', () => ({
  consumeRateLimit: async () => state.rate,
  hashIdentifier: (value: string) => `hash:${value}`,
}));

vi.mock('./tickets.js', () => ({
  createUploadTicket: async () => state.ticket,
}));

vi.mock('./supabaseAdmin.js', () => ({
  getSupabaseAdmin: () => ({
    storage: {
      from: () => ({
        createSignedUploadUrl: async (objectPath: string) => {
          if (state.urlError) {
            return { data: null, error: state.urlError };
          }
          return { data: { path: objectPath, token: 'signed-token' }, error: null };
        },
      }),
    },
  }),
}));

import handler from '../golden-voice/uploads.js';

function createResponse() {
  let body = '';
  const res = {
    statusCode: 0,
    headers: {} as Record<string, unknown>,
    setHeader(name: string, value: unknown) {
      res.headers[name] = value;
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

const OTHER = { region: 'other', contentType: 'video/mp4', turnstileToken: 'turnstile-token' };

beforeEach(() => {
  state.turnstile = 'ok';
  state.rate = 'allowed';
  state.ticket = { ok: true, id: 'ticket-1' };
  state.urlError = null;
});

describe('POST /api/golden-voice/uploads', () => {
  it('returns no video for Beni Mellal-Khenifra participants (no token needed)', async () => {
    const result = await call({ region: 'beni_mellal_khenifra' });

    expect(result.status).toBe(200);
    expect(result.json).toEqual({ videoPath: null });
  });

  it('rejects an unknown region', async () => {
    const result = await call({ region: 'atlantis' });
    expect(result.status).toBe(400);
  });

  it('rejects a missing Turnstile token for the video region', async () => {
    const result = await call({ region: 'other', contentType: 'video/mp4' });
    expect(result.status).toBe(400);
  });

  it('rejects a failed Turnstile verification', async () => {
    state.turnstile = 'failed';
    const result = await call(OTHER);
    expect(result.status).toBe(400);
  });

  it('fails closed when Turnstile verification is unavailable', async () => {
    state.turnstile = 'unavailable';
    const result = await call(OTHER);
    expect(result.status).toBe(503);
  });

  it('rejects repeated requests over the rate limit', async () => {
    state.rate = 'limited';
    const result = await call(OTHER);
    expect(result.status).toBe(429);
  });

  it('fails closed when the rate limit cannot be checked', async () => {
    state.rate = 'unavailable';
    const result = await call(OTHER);
    expect(result.status).toBe(503);
  });

  it('rejects an unsupported video format', async () => {
    const result = await call({ ...OTHER, contentType: 'video/mpeg' });
    expect(result.status).toBe(415);
  });

  it('issues a scoped signed upload URL and a one-time ticket for a valid MP4', async () => {
    const result = await call(OTHER);

    expect(result.status).toBe(200);
    expect(result.json?.bucket).toBe('golden-voice-videos');
    expect(result.json?.token).toBe('signed-token');
    expect(result.json?.ticketId).toBe('ticket-1');
    expect(result.json?.path).toMatch(
      /^golden-voice\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.mp4$/,
    );
  });

  it('issues signed URLs with the correct extension for every supported format', async () => {
    const cases: [string, string][] = [
      ['video/quicktime', 'mov'],
      ['video/x-m4v', 'm4v'],
      ['video/3gpp', '3gp'],
      ['video/3gpp2', '3g2'],
      ['video/webm', 'webm'],
      ['video/x-matroska', 'mkv'],
      ['video/x-msvideo', 'avi'],
    ];

    for (const [contentType, extension] of cases) {
      const result = await call({ ...OTHER, contentType });
      expect(result.status, contentType).toBe(200);
      expect(String(result.json?.path), contentType).toMatch(new RegExp(`\\.${extension}$`));
    }
  });

  it('fails closed when the upload ticket cannot be created', async () => {
    state.ticket = { ok: false, reason: 'unavailable' };
    const result = await call(OTHER);
    expect(result.status).toBe(503);
  });

  it('returns a server error when the signed URL cannot be created', async () => {
    state.urlError = { name: 'storage-error' };
    const result = await call(OTHER);
    expect(result.status).toBe(500);
  });

  it('rejects non-POST methods', async () => {
    const result = await call({}, 'GET');
    expect(result.status).toBe(405);
  });
});
