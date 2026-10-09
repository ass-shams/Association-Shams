import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerResponse } from 'node:http';

const state = vi.hoisted(() => ({
  urlError: null as { name: string } | null,
}));

vi.mock('./supabaseAdmin', () => ({
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

import handler from '../golden-voice/uploads';

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

beforeEach(() => {
  state.urlError = null;
});

describe('POST /api/golden-voice/uploads', () => {
  it('returns no video for Beni Mellal-Khenifra participants', async () => {
    const result = await call({ region: 'beni_mellal_khenifra' });

    expect(result.status).toBe(200);
    expect(result.json).toEqual({ videoPath: null });
  });

  it('rejects an unknown region', async () => {
    const result = await call({ region: 'atlantis' });
    expect(result.status).toBe(400);
  });

  it('rejects an unsupported video format', async () => {
    const result = await call({ region: 'other', contentType: 'video/quicktime' });
    expect(result.status).toBe(415);
  });

  it('issues a scoped signed upload URL for a valid MP4', async () => {
    const result = await call({ region: 'other', contentType: 'video/mp4' });

    expect(result.status).toBe(200);
    expect(result.json?.bucket).toBe('golden-voice-videos');
    expect(result.json?.token).toBe('signed-token');
    expect(result.json?.path).toMatch(
      /^golden-voice\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.mp4$/,
    );
  });

  it('uses the WebM extension for WebM uploads', async () => {
    const result = await call({ region: 'other', contentType: 'video/webm' });

    expect(result.status).toBe(200);
    expect(String(result.json?.path)).toMatch(/\.webm$/);
  });

  it('returns a server error when the signed URL cannot be created', async () => {
    state.urlError = { name: 'storage-error' };
    const result = await call({ region: 'other', contentType: 'video/mp4' });
    expect(result.status).toBe(500);
  });

  it('rejects non-POST methods', async () => {
    const result = await call({}, 'GET');
    expect(result.status).toBe(405);
  });
});
