import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  clientThrows: false,
  insertResult: { data: { id: 'ticket-1' }, error: null } as { data: unknown; error: unknown },
  claimResult: { data: { object_path: 'golden-voice/x.mp4' }, error: null } as {
    data: unknown;
    error: unknown;
  },
}));

vi.mock('./supabaseAdmin.js', () => ({
  getSupabaseAdmin: () => {
    if (state.clientThrows) {
      throw new Error('Supabase server credentials are not configured.');
    }
    return {
      from: () => ({
        insert: () => ({ select: () => ({ maybeSingle: async () => state.insertResult }) }),
        update: () => {
          const chain: Record<string, unknown> = {};
          const pass = () => chain;
          chain.eq = pass;
          chain.is = pass;
          chain.gt = pass;
          chain.select = pass;
          chain.maybeSingle = async () => state.claimResult;
          return chain;
        },
      }),
    };
  },
}));

import { claimUploadTicket, createUploadTicket } from './tickets.js';

beforeEach(() => {
  state.clientThrows = false;
  state.insertResult = { data: { id: 'ticket-1' }, error: null };
  state.claimResult = { data: { object_path: 'golden-voice/x.mp4' }, error: null };
});

describe('createUploadTicket', () => {
  it('returns the new ticket id', async () => {
    expect(await createUploadTicket('golden-voice/x.mp4', 'other')).toEqual({
      ok: true,
      id: 'ticket-1',
    });
  });

  it('reports unavailable on a database error', async () => {
    state.insertResult = { data: null, error: { code: '42P01' } };
    expect(await createUploadTicket('golden-voice/x.mp4', 'other')).toEqual({
      ok: false,
      reason: 'unavailable',
    });
  });

  it('reports unavailable when no row is returned', async () => {
    state.insertResult = { data: null, error: null };
    expect(await createUploadTicket('golden-voice/x.mp4', 'other')).toEqual({
      ok: false,
      reason: 'unavailable',
    });
  });

  it('reports unavailable when credentials are missing', async () => {
    state.clientThrows = true;
    expect(await createUploadTicket('golden-voice/x.mp4', 'other')).toEqual({
      ok: false,
      reason: 'unavailable',
    });
  });
});

describe('claimUploadTicket', () => {
  it('returns the bound object path', async () => {
    expect(await claimUploadTicket('ticket-1', 'other')).toEqual({
      ok: true,
      objectPath: 'golden-voice/x.mp4',
    });
  });

  it('reports invalid when no unconsumed ticket matches', async () => {
    state.claimResult = { data: null, error: null };
    expect(await claimUploadTicket('ticket-1', 'other')).toEqual({ ok: false, reason: 'invalid' });
  });

  it('reports unavailable on a database error', async () => {
    state.claimResult = { data: null, error: { code: '42P01' } };
    expect(await claimUploadTicket('ticket-1', 'other')).toEqual({
      ok: false,
      reason: 'unavailable',
    });
  });

  it('reports unavailable when credentials are missing', async () => {
    state.clientThrows = true;
    expect(await claimUploadTicket('ticket-1', 'other')).toEqual({
      ok: false,
      reason: 'unavailable',
    });
  });
});
