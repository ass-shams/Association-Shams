import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerResponse } from 'node:http';

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string | null } | null,
  userError: null as { message?: string } | null,
  adminRow: null as { user_id: string } | null,
  row: null as { full_name: string | null; video_path: string | null } | null,
  rowError: null as { code?: string } | null,
  signedUrl: 'https://project.supabase.co/storage/v1/object/sign/golden-voice-videos/x.mp4?token=t',
  signedError: null as { name: string } | null,
  signedArgs: null as { path: string; expiresIn: number; options: unknown } | null,
}));

vi.mock('../_lib/supabaseAdmin.js', () => ({
  getSupabaseAdmin: () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user }, error: state.userError }),
    },
    from: (table: string) => {
      if (table === 'admin_users') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: state.adminRow, error: null }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: state.row, error: state.rowError }),
          }),
        }),
      };
    },
    storage: {
      from: () => ({
        createSignedUrl: async (path: string, expiresIn: number, options: unknown) => {
          state.signedArgs = { path, expiresIn, options };
          return {
            data: state.signedError ? null : { signedUrl: state.signedUrl },
            error: state.signedError,
          };
        },
      }),
    },
  }),
}));

import handler from './participant-video.js';

const ADMIN_USER = { id: 'admin-1', email: 'admin@example.com' };
const PARTICIPANT_ID = '123e4567-e89b-12d3-a456-426614174000';
const VIDEO_PATH = `golden-voice/${PARTICIPANT_ID}.mp4`;

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
  url?: string;
}

async function call(options: CallOptions = {}) {
  const fake = createResponse();
  const headers: Record<string, string> = {};
  if (options.token) {
    headers.authorization = `Bearer ${options.token}`;
  }
  await handler(
    {
      method: options.method ?? 'GET',
      headers,
      url: options.url ?? `/api/admin/participant-video?id=${PARTICIPANT_ID}`,
    } as never,
    fake.res,
  );
  return fake;
}

beforeEach(() => {
  state.user = ADMIN_USER;
  state.userError = null;
  state.adminRow = { user_id: ADMIN_USER.id };
  state.row = { full_name: 'سعاد العلمي', video_path: VIDEO_PATH };
  state.rowError = null;
  state.signedError = null;
  state.signedArgs = null;
});

describe('authorization', () => {
  it('returns 401 without a bearer token', async () => {
    const result = await call();
    expect(result.status).toBe(401);
  });

  it('returns 401 when the token is invalid', async () => {
    state.user = null;
    state.userError = { message: 'invalid jwt' };
    const result = await call({ token: 'bad-token' });
    expect(result.status).toBe(401);
  });

  it('returns 403 for an authenticated non-admin', async () => {
    state.adminRow = null;
    const result = await call({ token: 'good-token' });
    expect(result.status).toBe(403);
  });
});

describe('GET signed video url', () => {
  it('rejects a malformed participant id', async () => {
    const result = await call({ token: 'good-token', url: '/api/admin/participant-video?id=bad' });
    expect(result.status).toBe(400);
  });

  it('returns 404 when the participant does not exist', async () => {
    state.row = null;
    const result = await call({ token: 'good-token' });
    expect(result.status).toBe(404);
  });

  it('returns 404 when the participant has no video', async () => {
    state.row = { full_name: 'مشارك محلي', video_path: null };
    const result = await call({ token: 'good-token' });
    expect(result.status).toBe(404);
    expect(state.signedArgs).toBeNull();
  });

  it('returns a short-lived signed url for the participant video', async () => {
    const result = await call({ token: 'good-token' });

    expect(result.status).toBe(200);
    expect(result.json).toMatchObject({ url: state.signedUrl, expiresIn: 300 });
    // The path is derived from the record, never from the client.
    expect(state.signedArgs?.path).toBe(VIDEO_PATH);
    expect(state.signedArgs?.options).toBeUndefined();
  });

  it('requests an attachment disposition for downloads', async () => {
    const result = await call({
      token: 'good-token',
      url: `/api/admin/participant-video?id=${PARTICIPANT_ID}&download=1`,
    });

    expect(result.status).toBe(200);
    expect(state.signedArgs?.options).toEqual({ download: 'سعاد-العلمي.mp4' });
  });

  it('clamps the requested expiry to the allowed range', async () => {
    await call({
      token: 'good-token',
      url: `/api/admin/participant-video?id=${PARTICIPANT_ID}&expiresIn=999999`,
    });
    expect(state.signedArgs?.expiresIn).toBe(3600);
  });

  it('returns 500 when the signed url cannot be created', async () => {
    state.signedError = { name: 'storage-error' };
    const result = await call({ token: 'good-token' });
    expect(result.status).toBe(500);
  });

  it('rejects non-GET methods', async () => {
    const result = await call({ method: 'POST', token: 'good-token' });
    expect(result.status).toBe(405);
  });
});
