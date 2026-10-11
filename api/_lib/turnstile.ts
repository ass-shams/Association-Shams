import type { ApiRequest } from './http.js';

/**
 * Server-side Cloudflare Turnstile verification.
 *
 * Mirrors the verification already used by `/api/contact`: the token is checked
 * against Cloudflare with the secret key, and the endpoint fails closed when the
 * secret is missing or the verification cannot complete. Tokens, secrets and
 * signed URLs are never logged.
 */
export type TurnstileResult = 'ok' | 'failed' | 'unavailable';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Client IP derived from trusted deployment headers.
 *
 * Trust assumptions: the endpoints run on Vercel, whose edge network sets
 * `x-vercel-forwarded-for`, `x-real-ip` and `x-forwarded-for` to the client IP
 * and overwrites any client-supplied value (except when an Enterprise "trusted
 * proxy" is explicitly configured). We therefore prefer the platform-controlled
 * `x-vercel-forwarded-for`, then `x-real-ip`, then `x-forwarded-for`, and take
 * the first entry of any comma-separated chain. Arbitrary/unlisted headers are
 * never trusted. When none is present (for example the local dev server) this
 * returns null and callers fall back to a shared bucket.
 */
const TRUSTED_IP_HEADERS = ['x-vercel-forwarded-for', 'x-real-ip', 'x-forwarded-for'] as const;

/** First client IP from the trusted deployment headers, or null when absent. */
export function firstForwardedIp(req: ApiRequest): string | null {
  for (const name of TRUSTED_IP_HEADERS) {
    const header = req.headers[name];
    const value = Array.isArray(header) ? header[0] : header;
    if (typeof value !== 'string' || !value) {
      continue;
    }
    const first = value.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }
  return null;
}

/**
 * Verify a Turnstile token. `unavailable` means the server is not configured or
 * the check could not complete; callers must treat it as fail-closed.
 */
export async function verifyTurnstile(
  token: string,
  remoteIp: string | null,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error('turnstile: TURNSTILE_SECRET_KEY is not configured');
    return 'unavailable';
  }

  const form = new URLSearchParams({ secret, response: token });
  if (remoteIp) {
    form.set('remoteip', remoteIp);
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, { method: 'POST', body: form });
    if (!response.ok) {
      return 'failed';
    }
    const data = (await response.json()) as { success?: unknown };
    return data.success === true ? 'ok' : 'failed';
  } catch {
    return 'failed';
  }
}
