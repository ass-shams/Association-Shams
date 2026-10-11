import { createHash } from 'node:crypto';
import { getSupabaseAdmin } from './supabaseAdmin.js';

/**
 * Persistent, cross-instance rate limiting backed by Postgres.
 *
 * A serverless deployment runs many isolated instances, so an in-memory counter
 * is not a reliable limit. Instead each check calls the atomic
 * `public.consume_rate_limit` SQL function (fixed window, single upsert with a
 * row lock), which is shared by every instance. The identifier is hashed before
 * it is sent so raw client IPs are never stored.
 *
 * The result is fail-closed: `unavailable` means the limit could not be checked
 * (for example the migration has not been applied) and the caller must reject.
 */
export type RateLimitResult = 'allowed' | 'limited' | 'unavailable';

/** Stable, non-reversible key for a client identifier (for example an IP). */
export function hashIdentifier(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  let client;
  try {
    client = getSupabaseAdmin();
  } catch {
    return 'unavailable';
  }

  try {
    const { data, error } = await client.rpc('consume_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.error('rate-limit: check failed', error.code ?? 'unknown');
      return 'unavailable';
    }

    return data === true ? 'allowed' : 'limited';
  } catch (error) {
    console.error('rate-limit: check threw', error instanceof Error ? error.name : 'unknown');
    return 'unavailable';
  }
}
