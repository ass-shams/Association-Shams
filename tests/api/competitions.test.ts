import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerResponse } from 'node:http';

const state = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[],
  listError: null as { code?: string } | null,
  count: 0,
  countError: null as { code?: string } | null,
}));

vi.mock('../../api/_lib/supabaseAdmin.js', () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table === 'competitions') {
        return {
          select: () => ({
            order: async () => ({ data: state.rows, error: state.listError }),
          }),
        };
      }
      return {
        select: () => ({
          eq: async () => ({ count: state.count, error: state.countError }),
        }),
      };
    },
  }),
}));

import handler from '../../api/competitions.js';

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

async function call(method = 'GET') {
  const fake = createResponse();
  await handler({ method, headers: {} } as never, fake.res);
  return fake;
}

beforeEach(() => {
  state.rows = [];
  state.listError = null;
  state.count = 0;
  state.countError = null;
});

describe('GET /api/competitions (public)', () => {
  it('returns public competition data with effective status and count', async () => {
    state.rows = [
      {
        id: 'comp-1',
        slug: 'golden-voice',
        title: 'مسابقة الصوت الذهبي',
        description: 'وصف',
        status: 'open',
        registration_deadline: '2099-01-01T00:00:00.000Z',
        created_at: '2026-01-01T00:00:00.000Z',
      },
    ];
    state.count = 7;

    const result = await call();

    expect(result.status).toBe(200);
    const data = result.json?.data;
    expect(Array.isArray(data)).toBe(true);
    if (Array.isArray(data)) {
      expect(data[0]).toMatchObject({
        slug: 'golden-voice',
        status: 'open',
        effectiveStatus: 'open',
        participantsCount: 7,
      });
      // Internal fields must not leak.
      expect(data[0]).not.toHaveProperty('id');
      expect(data[0]).not.toHaveProperty('created_at');
    }
  });

  it('derives ended when the deadline has passed', async () => {
    state.rows = [
      {
        id: 'comp-1',
        slug: 'golden-voice',
        title: 'مسابقة الصوت الذهبي',
        description: 'وصف',
        status: 'open',
        registration_deadline: '2000-01-01T00:00:00.000Z',
        created_at: '2026-01-01T00:00:00.000Z',
      },
    ];

    const result = await call();
    const data = result.json?.data;
    if (Array.isArray(data)) {
      expect(data[0]).toMatchObject({ effectiveStatus: 'ended' });
    }
  });

  it('falls back to closed for an unknown stored status', async () => {
    state.rows = [
      {
        id: 'comp-1',
        slug: 'x',
        title: 'x',
        description: 'x',
        status: 'weird',
        registration_deadline: null,
        created_at: '2026-01-01T00:00:00.000Z',
      },
    ];

    const result = await call();
    const data = result.json?.data;
    if (Array.isArray(data)) {
      expect(data[0]).toMatchObject({ status: 'closed', effectiveStatus: 'closed' });
    }
  });

  it('returns 500 when the list query fails', async () => {
    state.listError = { code: '42P01' };
    const result = await call();
    expect(result.status).toBe(500);
  });

  it('returns 500 when a participant count fails (never a fake zero)', async () => {
    state.rows = [
      {
        id: 'comp-1',
        slug: 'x',
        title: 'x',
        description: 'x',
        status: 'open',
        registration_deadline: null,
        created_at: '2026-01-01T00:00:00.000Z',
      },
    ];
    state.countError = { code: '42P01' };
    const result = await call();
    expect(result.status).toBe(500);
  });

  it('rejects non-GET methods', async () => {
    const result = await call('POST');
    expect(result.status).toBe(405);
  });
});
