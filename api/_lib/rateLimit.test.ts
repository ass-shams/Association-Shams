import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  clientThrows: false,
  rpcResult: { data: true, error: null } as { data: unknown; error: unknown },
}));

vi.mock('./supabaseAdmin.js', () => ({
  getSupabaseAdmin: () => {
    if (state.clientThrows) {
      throw new Error('Supabase server credentials are not configured.');
    }
    return { rpc: async () => state.rpcResult };
  },
}));

import { consumeRateLimit, hashIdentifier } from './rateLimit.js';

beforeEach(() => {
  state.clientThrows = false;
  state.rpcResult = { data: true, error: null };
});

describe('hashIdentifier', () => {
  it('is deterministic, fixed-length and does not expose the raw value', () => {
    const hashed = hashIdentifier('203.0.113.7');
    expect(hashed).toBe(hashIdentifier('203.0.113.7'));
    expect(hashed).not.toContain('203.0.113.7');
    expect(hashed).toHaveLength(64);
  });
});

describe('consumeRateLimit', () => {
  it('allows a request within the limit', async () => {
    expect(await consumeRateLimit('key', 5, 3600)).toBe('allowed');
  });

  it('reports limited when the counter function returns false', async () => {
    state.rpcResult = { data: false, error: null };
    expect(await consumeRateLimit('key', 5, 3600)).toBe('limited');
  });

  it('fails closed on a database error', async () => {
    state.rpcResult = { data: null, error: { code: 'PGRST202' } };
    expect(await consumeRateLimit('key', 5, 3600)).toBe('unavailable');
  });

  it('fails closed when credentials are missing', async () => {
    state.clientThrows = true;
    expect(await consumeRateLimit('key', 5, 3600)).toBe('unavailable');
  });
});
