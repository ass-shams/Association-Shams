import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAdminIdentity } from './adminService';

function fakeResponse(status: number, body: unknown = {}, contentType = 'application/json') {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'content-type' ? contentType : null,
    },
    json: async () => body,
  } as unknown as Response;
}

function stubFetch(status: number, body: unknown = {}, contentType = 'application/json') {
  const fetchMock = vi.fn(async () => fakeResponse(status, body, contentType));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchAdminIdentity', () => {
  it('maps a 200 JSON response to an admin identity', async () => {
    stubFetch(200, { admin: { id: 'admin-1', email: 'admin@example.com' } });

    const result = await fetchAdminIdentity('token-123');

    expect(result).toEqual({
      status: 'admin',
      admin: { id: 'admin-1', email: 'admin@example.com' },
    });
  });

  it('sends the bearer token to /api/admin/me', async () => {
    const fetchMock = stubFetch(200, { admin: { id: 'a', email: null } });

    await fetchAdminIdentity('token-123');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/me',
      expect.objectContaining({
        method: 'GET',
        headers: { authorization: 'Bearer token-123' },
      }),
    );
  });

  it('maps 401 to unauthenticated', async () => {
    stubFetch(401);
    expect(await fetchAdminIdentity('token')).toEqual({ status: 'unauthenticated' });
  });

  it('maps 403 to forbidden (allowlist denial)', async () => {
    stubFetch(403);
    const result = await fetchAdminIdentity('token');
    expect(result).toMatchObject({ status: 'forbidden' });
  });

  it('maps 503 to unavailable (server configuration)', async () => {
    stubFetch(503);
    expect(await fetchAdminIdentity('token')).toMatchObject({ status: 'unavailable' });
  });

  it('maps 404 to unavailable (endpoint not served)', async () => {
    stubFetch(404);
    expect(await fetchAdminIdentity('token')).toMatchObject({ status: 'unavailable' });
  });

  it('treats a 200 non-JSON body as an unavailable endpoint (Vite dev case)', async () => {
    // `npm run dev` serves api/admin/me.ts as text/javascript with status 200.
    stubFetch(200, 'import { sendJson } from "/api/_lib/http.ts";', 'text/javascript');
    expect(await fetchAdminIdentity('token')).toMatchObject({ status: 'unavailable' });
  });

  it('maps any other error status to error', async () => {
    stubFetch(500);
    expect(await fetchAdminIdentity('token')).toMatchObject({ status: 'error' });
  });

  it('maps a malformed success body to error', async () => {
    stubFetch(200, { admin: {} });
    expect(await fetchAdminIdentity('token')).toMatchObject({ status: 'error' });
  });

  it('maps a network failure to network', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );
    expect(await fetchAdminIdentity('token')).toMatchObject({ status: 'network' });
  });

  it('times out a stalled request instead of hanging', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
          }),
      ),
    );

    const result = await fetchAdminIdentity('token', { timeoutMs: 20 });

    expect(result).toMatchObject({ status: 'timeout' });
  });
});
