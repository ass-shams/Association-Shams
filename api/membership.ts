import type { ServerResponse } from 'node:http';
import { methodNotAllowed, readJsonBody, sendJson } from './_lib/http.js';
import type { ApiRequest } from './_lib/http.js';
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';
import { consumeRateLimit, hashIdentifier } from './_lib/rateLimit.js';
import { firstForwardedIp, verifyTurnstile } from './_lib/turnstile.js';
import { validateMembershipForm } from '../src/pages/public/membership/validation.js';
import { INTEREST_OPTIONS } from '../src/pages/public/membership/constants.js';
import type {
  Gender,
  InterestValue,
  MembershipFormValues,
} from '../src/pages/public/membership/types.js';

export const config = { maxDuration: 15 };

/** Table written only by this endpoint (service role, RLS deny-by-default). */
const MEMBERS_TABLE = 'members';

/** Length limits mirror the `members` CHECK constraints. */
const MAX_FULL_NAME_LENGTH = 120;
const MAX_PHONE_LENGTH = 32;
const MAX_CITY_LENGTH = 120;
const MAX_EXPECTATIONS_LENGTH = 5000;

/** Persistent per-IP ceiling for membership submissions (fixed one-hour window). */
const MEMBERSHIP_RATE_LIMIT = 5;
const MEMBERSHIP_RATE_WINDOW_SECONDS = 60 * 60;

const GENDERS: readonly Gender[] = ['male', 'female'];

const INVALID_MESSAGE = 'المرجو التحقق من صحة البيانات المدخلة.';
const CAPTCHA_FAILED_MESSAGE = 'تعذّر إكمال التحقق. المرجو المحاولة مرة أخرى.';
const TOO_MANY_MESSAGE = 'عدد كبير من المحاولات. المرجو المحاولة لاحقاً.';
const SERVICE_UNAVAILABLE_MESSAGE = 'خدمة الانخراط غير متاحة مؤقتاً. المرجو المحاولة لاحقاً.';
const SUBMIT_FAILED_MESSAGE = 'تعذّر إرسال طلب الانخراط. المرجو المحاولة مرة أخرى.';

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function isGender(value: unknown): value is Gender {
  return typeof value === 'string' && (GENDERS as readonly string[]).includes(value);
}

/**
 * Accept only a non-empty array whose every entry is an approved interest, and
 * de-duplicate while preserving order. Anything else (including a missing
 * field) returns `null` so the submission is rejected instead of silently
 * discarding a value the applicant actually chose.
 */
function parseInterests(value: unknown): InterestValue[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const interests: InterestValue[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !(INTEREST_OPTIONS as readonly string[]).includes(item)) {
      return null;
    }
    const interest = item as InterestValue;
    if (!interests.includes(interest)) {
      interests.push(interest);
    }
  }

  return interests;
}

/**
 * Public submission endpoint for the /membership electronic form.
 *
 * Re-validates every value server-side (the browser check is never trusted),
 * verifies the Cloudflare Turnstile token server-side, enforces a persistent
 * per-IP rate limit, then inserts the application with the service role. The
 * security checks fail closed when Turnstile or the rate-limit infrastructure
 * is unavailable.
 *
 *   201 — stored
 *   400 — invalid payload or failed Turnstile
 *   405 — non-POST
 *   429 — rate limit exceeded
 *   503 — verification/rate-limit infrastructure unavailable
 *   500 — database insert failed (or server credentials unavailable)
 */
export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  const body = readJsonBody(req.body);
  if (!body) {
    return sendJson(res, 400, { message: INVALID_MESSAGE });
  }

  const interests = parseInterests(body.interests);

  const values: MembershipFormValues = {
    fullName: asString(body.fullName),
    phone: asString(body.phone),
    city: asString(body.city),
    age: typeof body.age === 'number' ? String(body.age) : asString(body.age),
    gender: isGender(body.gender) ? body.gender : '',
    interests: interests ?? [],
    expectations: asString(body.expectations),
  };

  if (
    values.fullName.trim().length > MAX_FULL_NAME_LENGTH ||
    values.phone.trim().length > MAX_PHONE_LENGTH ||
    values.city.trim().length > MAX_CITY_LENGTH ||
    values.expectations.trim().length > MAX_EXPECTATIONS_LENGTH
  ) {
    return sendJson(res, 400, { message: INVALID_MESSAGE });
  }

  const fieldErrors = validateMembershipForm(values);
  if (interests === null || Object.keys(fieldErrors).length > 0) {
    return sendJson(res, 400, { message: INVALID_MESSAGE });
  }

  // Server-side Turnstile verification: a client-side success is never trusted.
  const turnstileToken = typeof body.turnstileToken === 'string' ? body.turnstileToken.trim() : '';
  if (!turnstileToken) {
    return sendJson(res, 400, { message: CAPTCHA_FAILED_MESSAGE });
  }

  const remoteIp = firstForwardedIp(req);
  const verification = await verifyTurnstile(turnstileToken, remoteIp);
  if (verification === 'unavailable') {
    return sendJson(res, 503, { message: SERVICE_UNAVAILABLE_MESSAGE });
  }
  if (verification !== 'ok') {
    return sendJson(res, 400, { message: CAPTCHA_FAILED_MESSAGE });
  }

  // Persistent, cross-instance rate limit keyed by the hashed client IP.
  const rate = await consumeRateLimit(
    `membership:${hashIdentifier(remoteIp ?? 'unknown')}`,
    MEMBERSHIP_RATE_LIMIT,
    MEMBERSHIP_RATE_WINDOW_SECONDS,
  );
  if (rate === 'unavailable') {
    return sendJson(res, 503, { message: SERVICE_UNAVAILABLE_MESSAGE });
  }
  if (rate === 'limited') {
    return sendJson(res, 429, { message: TOO_MANY_MESSAGE });
  }

  const expectations = values.expectations.trim();

  try {
    const { error } = await getSupabaseAdmin()
      .from(MEMBERS_TABLE)
      .insert({
        full_name: values.fullName.trim(),
        phone: values.phone.trim(),
        city: values.city.trim(),
        age: Number(values.age),
        gender: values.gender,
        interests,
        expectations: expectations || null,
      });

    if (error) {
      console.error('membership: insert failed', error.code ?? 'unknown');
      return sendJson(res, 500, { message: SUBMIT_FAILED_MESSAGE });
    }
  } catch (error) {
    console.error('membership: insert threw', error instanceof Error ? error.name : 'unknown');
    return sendJson(res, 500, { message: SUBMIT_FAILED_MESSAGE });
  }

  return sendJson(res, 201, { ok: true });
}
