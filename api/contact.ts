import type { ServerResponse } from 'node:http';
import { methodNotAllowed, readJsonBody, sendJson } from './_lib/http.js';
import type { ApiRequest } from './_lib/http.js';
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';

export const config = { maxDuration: 15 };

/** Table written only by this endpoint (service role, RLS deny-by-default). */
const CONTACT_TABLE = 'contact_requests';

/** Length limits mirror the `contact_requests` CHECK constraints. */
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 32;
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 5000;

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const INVALID_MESSAGE = 'المرجو التحقق من صحة البيانات المدخلة.';
const CAPTCHA_FAILED_MESSAGE = 'تعذّر إكمال التحقق. المرجو المحاولة مرة أخرى.';
const SERVICE_UNAVAILABLE_MESSAGE = 'خدمة الاتصال غير متاحة مؤقتاً. المرجو المحاولة لاحقاً.';
const SUBMIT_FAILED_MESSAGE = 'تعذّر إرسال الرسالة. المرجو المحاولة مرة أخرى.';

interface ContactValues {
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
}

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Validate the payload and normalize optional fields. */
function parseValues(body: Record<string, unknown>): ContactValues | null {
  const name = asTrimmedString(body.name);
  const email = asTrimmedString(body.email).toLowerCase();
  const phone = asTrimmedString(body.phone);
  const subject = asTrimmedString(body.subject);
  const message = asTrimmedString(body.message);

  if (!name || name.length > MAX_NAME_LENGTH) {
    return null;
  }
  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return null;
  }
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return null;
  }
  if (phone.length > MAX_PHONE_LENGTH || subject.length > MAX_SUBJECT_LENGTH) {
    return null;
  }

  return {
    name,
    email,
    phone: phone || null,
    subject: subject || null,
    message,
  };
}

type TurnstileResult = 'ok' | 'failed' | 'unavailable';

/**
 * Verify the Cloudflare Turnstile token server-side. A client-side success
 * state is never trusted. The secret is read from `TURNSTILE_SECRET_KEY`
 * (server-only); when it is missing the endpoint fails closed.
 */
async function verifyTurnstile(token: string, remoteIp: string | null): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error('contact: TURNSTILE_SECRET_KEY is not configured');
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

function firstForwardedIp(req: ApiRequest): string | null {
  const header = req.headers['x-forwarded-for'];
  const value = Array.isArray(header) ? header[0] : header;
  if (typeof value !== 'string' || !value) {
    return null;
  }
  return value.split(',')[0]?.trim() || null;
}

/**
 * Public submission endpoint for the /contact form.
 *
 *   201 — stored
 *   400 — invalid payload or failed Turnstile
 *   405 — non-POST
 *   503 — server not configured (missing Turnstile secret/credentials)
 *   500 — database insert failed
 */
export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  const body = readJsonBody(req.body);
  if (!body) {
    return sendJson(res, 400, { message: INVALID_MESSAGE });
  }

  const values = parseValues(body);
  if (!values) {
    return sendJson(res, 400, { message: INVALID_MESSAGE });
  }

  const turnstileToken = asTrimmedString(body.turnstileToken);
  if (!turnstileToken) {
    return sendJson(res, 400, { message: CAPTCHA_FAILED_MESSAGE });
  }

  const verification = await verifyTurnstile(turnstileToken, firstForwardedIp(req));
  if (verification === 'unavailable') {
    return sendJson(res, 503, { message: SERVICE_UNAVAILABLE_MESSAGE });
  }
  if (verification !== 'ok') {
    return sendJson(res, 400, { message: CAPTCHA_FAILED_MESSAGE });
  }

  try {
    const { error } = await getSupabaseAdmin().from(CONTACT_TABLE).insert({
      name: values.name,
      email: values.email,
      phone: values.phone,
      subject: values.subject,
      message: values.message,
      status: 'new',
    });

    if (error) {
      console.error('contact: insert failed', error.code ?? 'unknown');
      return sendJson(res, 500, { message: SUBMIT_FAILED_MESSAGE });
    }
  } catch (error) {
    console.error('contact: insert threw', error instanceof Error ? error.name : 'unknown');
    return sendJson(res, 500, { message: SUBMIT_FAILED_MESSAGE });
  }

  return sendJson(res, 201, { ok: true });
}
