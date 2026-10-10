import type { ServerResponse } from 'node:http';
import { sendJson } from './http.js';
import type { ApiRequest } from './http.js';
import { getSupabaseAdmin } from './supabaseAdmin.js';

/**
 * Server-side administrator authorization.
 *
 * Authentication is proven by a Supabase Auth access token (verified with
 * `auth.getUser`, which validates the JWT with the project). Authorization is
 * proven by a row in `public.admin_users`, which the browser can never write.
 *
 * This is the ONLY source of truth for admin access. React guards are a UX
 * affordance; every admin endpoint must call `requireAdmin` / `resolveAdmin`.
 */
export const ADMIN_TABLE = 'admin_users';

export interface AdminIdentity {
  readonly id: string;
  readonly email: string | null;
}

export type AdminAuthResult =
  | { readonly status: 'ok'; readonly admin: AdminIdentity }
  | { readonly status: 'unauthenticated' }
  | { readonly status: 'forbidden' }
  | { readonly status: 'unavailable' };

const UNAUTHORIZED_MESSAGE = 'غير مصرح.';
const FORBIDDEN_MESSAGE = 'هذا الحساب غير مصرح له بالوصول إلى لوحة التحكم.';
const UNAVAILABLE_MESSAGE = 'الخدمة غير متاحة مؤقتاً.';

/** Extract a bearer token from the Authorization header, if present. */
function readBearerToken(req: ApiRequest): string | null {
  const header = req.headers['authorization'];
  const value = Array.isArray(header) ? header[0] : header;
  if (typeof value !== 'string') {
    return null;
  }

  const match = /^Bearer\s+(.+)$/i.exec(value.trim());
  return match ? match[1].trim() : null;
}

/** Resolve the authenticated administrator for a request, or a reason why not. */
export async function resolveAdmin(req: ApiRequest): Promise<AdminAuthResult> {
  const token = readBearerToken(req);
  if (!token) {
    return { status: 'unauthenticated' };
  }

  let adminClient;
  try {
    adminClient = getSupabaseAdmin();
  } catch {
    return { status: 'unavailable' };
  }

  const { data: userData, error: userError } = await adminClient.auth.getUser(token);
  if (userError || !userData?.user) {
    return { status: 'unauthenticated' };
  }

  const { data: row, error: rowError } = await adminClient
    .from(ADMIN_TABLE)
    .select('user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (rowError) {
    return { status: 'unavailable' };
  }

  if (!row) {
    return { status: 'forbidden' };
  }

  return {
    status: 'ok',
    admin: { id: userData.user.id, email: userData.user.email ?? null },
  };
}

/**
 * Guard for admin endpoints. Returns the admin identity and sends nothing when
 * authorized; otherwise sends the appropriate JSON error response and returns
 * `null`. Callers must bail out when the result is `null`.
 */
export async function requireAdmin(
  req: ApiRequest,
  res: ServerResponse,
): Promise<AdminIdentity | null> {
  const result = await resolveAdmin(req);

  switch (result.status) {
    case 'ok':
      return result.admin;
    case 'unauthenticated':
      sendJson(res, 401, { message: UNAUTHORIZED_MESSAGE });
      return null;
    case 'forbidden':
      sendJson(res, 403, { message: FORBIDDEN_MESSAGE });
      return null;
    default:
      sendJson(res, 503, { message: UNAVAILABLE_MESSAGE });
      return null;
  }
}
