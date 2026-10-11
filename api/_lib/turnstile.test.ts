import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { firstForwardedIp, verifyTurnstile } from './turnstile.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function stubVerify(body: unknown, ok = true) {
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ({
    ok,
    json: async () => body,
  }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('verifyTurnstile', () => {
  beforeEach(() => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
  });

  it('fails closed when the secret is not configured', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    expect(await verifyTurnstile('token', null)).toBe('unavailable');
  });

  it('returns ok when Cloudflare reports success', async () => {
    const fetchMock = stubVerify({ success: true });

    expect(await verifyTurnstile('token', '203.0.113.7')).toBe('ok');

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain('challenges.cloudflare.com');
    expect((init as RequestInit | undefined)?.method).toBe('POST');
    const body = (init as RequestInit | undefined)?.body as URLSearchParams;
    // The token is forwarded to Cloudflare; the secret is never asserted on/printed.
    expect(body.get('response')).toBe('token');
    expect(body.get('remoteip')).toBe('203.0.113.7');
  });

  it('returns failed when Cloudflare reports failure', async () => {
    stubVerify({ success: false });
    expect(await verifyTurnstile('token', null)).toBe('failed');
  });

  it('returns failed on a non-2xx response', async () => {
    stubVerify({ success: true }, false);
    expect(await verifyTurnstile('token', null)).toBe('failed');
  });

  it('returns failed when the request throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );
    expect(await verifyTurnstile('token', null)).toBe('failed');
  });
});

describe('firstForwardedIp', () => {
  it('prefers the platform-controlled x-vercel-forwarded-for', () => {
    const req = {
      headers: {
        'x-vercel-forwarded-for': '198.51.100.1',
        'x-real-ip': '198.51.100.2',
        'x-forwarded-for': '198.51.100.3',
      },
    } as never;

    expect(firstForwardedIp(req)).toBe('198.51.100.1');
  });

  it('falls back to x-real-ip', () => {
    const req = {
      headers: { 'x-real-ip': '198.51.100.2', 'x-forwarded-for': '198.51.100.3' },
    } as never;

    expect(firstForwardedIp(req)).toBe('198.51.100.2');
  });

  it('falls back to the first entry of x-forwarded-for', () => {
    const req = { headers: { 'x-forwarded-for': '198.51.100.3, 10.0.0.1' } } as never;
    expect(firstForwardedIp(req)).toBe('198.51.100.3');
  });

  it('ignores an empty trusted header and uses the next one', () => {
    const req = {
      headers: { 'x-vercel-forwarded-for': '', 'x-real-ip': '198.51.100.2' },
    } as never;

    expect(firstForwardedIp(req)).toBe('198.51.100.2');
  });

  it('returns null when no trusted header is present', () => {
    expect(firstForwardedIp({ headers: {} } as never)).toBeNull();
  });
});
