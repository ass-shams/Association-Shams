import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerResponse } from 'node:http';

const state = vi.hoisted(() => ({
  insertError: null as { code?: string } | null,
  inserted: null as Record<string, unknown> | null,
  insertId: '11111111-1111-4111-8111-111111111111',
  insertCreatedAt: '2026-10-09T12:00:00.000Z',
  verify: { ok: true } as { ok: true } | { ok: false; message: string },
  removed: [] as string[],
  syncResult: true as boolean,
  syncCalls: [] as Record<string, unknown>[],
}));

vi.mock('./supabaseAdmin.js', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      insert: (row: Record<string, unknown>) => {
        state.inserted = row;
        return {
          select: () => ({
            single: async () =>
              state.insertError
                ? { data: null, error: state.insertError }
                : {
                    data: { id: state.insertId, created_at: state.insertCreatedAt },
                    error: null,
                  },
          }),
        };
      },
    }),
  }),
}));

vi.mock('./googleSheets.js', () => ({
  syncRegistrationToSheetBestEffort: async (registration: Record<string, unknown>) => {
    state.syncCalls.push(registration);
    return state.syncResult;
  },
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

const OBJECT_PATH = 'golden-voice/123e4567-e89b-12d3-a456-426614174000.mp4';
const BASE = { fullName: 'سعاد العلمي', phone: '0612345678', age: 22, city: 'بني ملال' };

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
  state.syncResult = true;
  state.syncCalls = [];
});

describe('POST /api/golden-voice/register (with video)', () => {
  it('registers using a validated video path', async () => {
    const result = await call({ ...BASE, region: 'other', videoPath: OBJECT_PATH });

    expect(result.status).toBe(201);
    expect(state.inserted).toMatchObject({ region: 'other', video_path: OBJECT_PATH });
    expect(state.removed).toHaveLength(0);
  });

  it('rejects a video registration without a video path', async () => {
    const result = await call({ ...BASE, region: 'other' });

    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('rejects a path that does not match the server format', async () => {
    const result = await call({ ...BASE, region: 'other', videoPath: 'golden-voice/evil.avi' });

    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
    expect(state.removed).toHaveLength(0);
  });

  it('cleans up the object when verification fails', async () => {
    state.verify = { ok: false, message: 'سبب محدد' };
    const result = await call({ ...BASE, region: 'other', videoPath: OBJECT_PATH });

    expect(result.status).toBe(400);
    expect(result.json?.message).toBe('سبب محدد');
    expect(state.removed).toEqual([OBJECT_PATH]);
  });

  it('cleans up the object when the insert fails', async () => {
    state.insertError = { code: '23514' };
    const result = await call({ ...BASE, region: 'other', videoPath: OBJECT_PATH });

    expect(result.status).toBe(500);
    expect(state.removed).toEqual([OBJECT_PATH]);
  });

  it('mirrors the saved registration into the sheet by its UUID', async () => {
    const result = await call({ ...BASE, region: 'other', videoPath: OBJECT_PATH });

    expect(result.status).toBe(201);
    expect(state.syncCalls).toHaveLength(1);
    expect(state.syncCalls[0]).toMatchObject({
      id: state.insertId,
      region: 'other',
      videoPath: OBJECT_PATH,
      createdAt: state.insertCreatedAt,
    });
  });

  it('still succeeds when the sheet sync fails (no duplicate on retry)', async () => {
    state.syncResult = false;
    const result = await call({ ...BASE, region: 'other', videoPath: OBJECT_PATH });

    expect(result.status).toBe(201);
    expect(state.inserted).not.toBeNull();
    expect(state.removed).toHaveLength(0);
  });
});

describe('POST /api/golden-voice/register (Beni Mellal-Khenifra)', () => {
  it('registers without a video', async () => {
    const result = await call({ ...BASE, region: 'beni_mellal_khenifra' });

    expect(result.status).toBe(201);
    expect(state.inserted).toMatchObject({ region: 'beni_mellal_khenifra', video_path: null });
    expect(state.syncCalls[0]).toMatchObject({
      region: 'beni_mellal_khenifra',
      videoPath: null,
    });
  });

  it('rejects a video supplied for the no-video region', async () => {
    const result = await call({
      ...BASE,
      region: 'beni_mellal_khenifra',
      videoPath: OBJECT_PATH,
    });

    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });
});

describe('validation and method handling', () => {
  it('rejects an unknown region', async () => {
    const result = await call({ ...BASE, region: 'atlantis' });
    expect(result.status).toBe(400);
  });

  it('rejects missing required fields', async () => {
    const result = await call({ region: 'beni_mellal_khenifra' });
    expect(result.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it('rejects oversized text fields', async () => {
    const result = await call({ ...BASE, fullName: 'x'.repeat(500), region: 'beni_mellal_khenifra' });
    expect(result.status).toBe(400);
  });

  it('rejects non-POST methods', async () => {
    const result = await call({}, 'GET');
    expect(result.status).toBe(405);
  });
});
