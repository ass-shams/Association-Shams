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

/** First client IP from `x-forwarded-for`, or null when it is absent. */
export function firstForwardedIp(req: ApiRequest): string | null {
  const header = req.headers['x-forwarded-for'];
  const value = Array.isArray(header) ? header[0] : header;
  if (typeof value !== 'string' || !value) {
    return null;
  }
  return value.split(',')[0]?.trim() || null;
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
