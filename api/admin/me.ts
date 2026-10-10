import type { ServerResponse } from 'node:http';
import { methodNotAllowed, sendJson } from '../_lib/http.js';
import type { ApiRequest } from '../_lib/http.js';
import { resolveAdmin } from '../_lib/adminAuth.js';

export const config = { maxDuration: 15 };

const UNAUTHORIZED_MESSAGE = 'غير مصرح.';
const FORBIDDEN_MESSAGE = 'هذا الحساب غير مصرح له بالوصول إلى لوحة التحكم.';
const UNAVAILABLE_MESSAGE = 'الخدمة غير متاحة مؤقتاً.';

/**
 * Returns the current administrator's identity when the bearer token resolves
 * to an authenticated user present in the `admin_users` allowlist.
 *
 *   200 — authorized administrator
 *   401 — missing or invalid session
 *   403 — authenticated but not an administrator
 *   503 — server credentials unavailable
 *
 * The dashboard calls this after sign-in to decide whether access is granted.
 * It is a read-only check and exposes only the caller's own identity.
 */
export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, 'GET');
  }

  const result = await resolveAdmin(req);

  switch (result.status) {
    case 'ok':
      return sendJson(res, 200, { admin: result.admin });
    case 'unauthenticated':
      return sendJson(res, 401, { message: UNAUTHORIZED_MESSAGE });
    case 'forbidden':
      return sendJson(res, 403, { message: FORBIDDEN_MESSAGE });
    default:
      return sendJson(res, 503, { message: UNAVAILABLE_MESSAGE });
  }
}
