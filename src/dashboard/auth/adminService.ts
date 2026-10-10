import type { AdminIdentity } from './types';

/**
 * Talks to the server-side admin guard. The browser never decides whether an
 * account is an administrator: it asks `/api/admin/me`, which verifies the JWT
 * and the `admin_users` allowlist with the service role.
 *
 * Every request is bounded by a timeout so a stalled API (for example a dev
 * proxy that accepts the connection but never responds) cannot leave the
 * dashboard stuck in a loading state. Each outcome carries a safe,
 * non-sensitive Arabic message; no token or server detail is ever included.
 */
export type AdminCheck =
  | { readonly status: 'admin'; readonly admin: AdminIdentity }
  | { readonly status: 'unauthenticated' }
  | { readonly status: 'forbidden'; readonly message: string }
  | { readonly status: 'unavailable'; readonly message: string }
  | { readonly status: 'network'; readonly message: string }
  | { readonly status: 'timeout'; readonly message: string }
  | { readonly status: 'error'; readonly message: string };

const ADMIN_ME_ENDPOINT = '/api/admin/me';

/** Default ceiling for the verification request. */
export const VERIFY_TIMEOUT_MS = 15_000;

const FORBIDDEN_MESSAGE = 'هذا الحساب غير مصرح له بالوصول إلى لوحة التحكم.';
const SERVER_UNAVAILABLE_MESSAGE =
  'خدمة التحقق من الصلاحيات غير متاحة على الخادم حالياً. المرجو التواصل مع مسؤول النظام.';
const ENDPOINT_MISSING_MESSAGE =
  'تعذّر الوصول إلى خدمة التحقق من الصلاحيات. تأكد من تشغيل الواجهة الخلفية (مثل vercel dev) على المنفذ نفسه.';
const NETWORK_MESSAGE = 'تعذّر الاتصال بالخادم. تحقق من اتصالك ثم حاول مرة أخرى.';
const TIMEOUT_MESSAGE = 'انتهت مدة التحقق من الصلاحيات. المرجو المحاولة مرة أخرى.';
const GENERIC_MESSAGE = 'تعذّر التحقق من الجلسة. المرجو المحاولة مرة أخرى.';

/** True when the response advertises a JSON body. */
function isJsonResponse(response: Response): boolean {
  return (response.headers.get('content-type') ?? '').toLowerCase().includes('application/json');
}

export interface FetchAdminOptions {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
}

export async function fetchAdminIdentity(
  accessToken: string,
  options: FetchAdminOptions = {},
): Promise<AdminCheck> {
  const timeoutMs = options.timeoutMs ?? VERIFY_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const externalSignal = options.signal;
  const forwardAbort = () => controller.abort();
  externalSignal?.addEventListener('abort', forwardAbort);

  let response: Response;
  try {
    response = await fetch(ADMIN_ME_ENDPOINT, {
      method: 'GET',
      headers: { authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch {
    if (externalSignal?.aborted) {
      // The caller cancelled (e.g. component unmounted); not a real failure.
      return { status: 'network', message: NETWORK_MESSAGE };
    }
    if (controller.signal.aborted) {
      return { status: 'timeout', message: TIMEOUT_MESSAGE };
    }
    return { status: 'network', message: NETWORK_MESSAGE };
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener('abort', forwardAbort);
  }

  if (response.status === 401) {
    return { status: 'unauthenticated' };
  }

  if (response.status === 403) {
    return { status: 'forbidden', message: FORBIDDEN_MESSAGE };
  }

  if (response.status === 503) {
    return { status: 'unavailable', message: SERVER_UNAVAILABLE_MESSAGE };
  }

  if (response.status === 404) {
    return { status: 'unavailable', message: ENDPOINT_MISSING_MESSAGE };
  }

  if (!response.ok) {
    return { status: 'error', message: GENERIC_MESSAGE };
  }

  /*
   * A 200 that is not JSON means the request never reached the serverless
   * function. The common local cause is `npm run dev` (Vite), which serves the
   * `api/` source file as a JavaScript module instead of running it.
   */
  if (!isJsonResponse(response)) {
    return { status: 'unavailable', message: ENDPOINT_MISSING_MESSAGE };
  }

  let data: { admin?: Partial<AdminIdentity> };
  try {
    data = (await response.json()) as { admin?: Partial<AdminIdentity> };
  } catch {
    return { status: 'unavailable', message: ENDPOINT_MISSING_MESSAGE };
  }

  if (!data.admin || typeof data.admin.id !== 'string') {
    return { status: 'error', message: GENERIC_MESSAGE };
  }

  return {
    status: 'admin',
    admin: {
      id: data.admin.id,
      email: typeof data.admin.email === 'string' ? data.admin.email : null,
    },
  };
}
