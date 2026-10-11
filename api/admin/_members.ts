import type { ServerResponse } from 'node:http';
import { methodNotAllowed, sendJson } from '../_lib/http.js';
import type { ApiRequest } from '../_lib/http.js';
import { requireAdmin } from '../_lib/adminAuth.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';

export const config = { maxDuration: 15 };

const MEMBERS_TABLE = 'members';
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

const SELECT_FIELDS =
  'id, full_name, phone, city, age, gender, interests, expectations, created_at';

const LOAD_FAILED_MESSAGE = 'تعذّر تحميل المنخرطين. المرجو المحاولة مرة أخرى.';
const SERVICE_UNAVAILABLE_MESSAGE = 'الخدمة غير متاحة مؤقتاً.';

/** Keep only characters that are safe inside a PostgREST `or`/`ilike` filter. */
function sanitizeSearch(raw: string): string {
  return raw.replace(/[,()\\*%]/g, ' ').trim().slice(0, 100);
}

function parsePositiveInt(raw: string | null, fallback: number, max: number): number {
  const value = Number.parseInt(raw ?? '', 10);
  if (!Number.isFinite(value) || value < 1) {
    return fallback;
  }
  return Math.min(value, max);
}

/**
 * Admin members endpoint (server-side authorization required).
 *
 *   GET ?[q=…][page=…][pageSize=…] → paginated list (newest first)
 *
 * `requireAdmin` verifies the bearer token and the `admin_users` allowlist
 * before any member data is read. Search matches the full name, phone number
 * or city.
 */
export default async function handler(req: ApiRequest, res: ServerResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) {
    return;
  }

  if (req.method !== 'GET') {
    return methodNotAllowed(res, 'GET');
  }

  const url = new URL(req.url ?? '/', 'http://localhost');
  const searchTerm = sanitizeSearch(url.searchParams.get('q') ?? '');
  const page = parsePositiveInt(url.searchParams.get('page'), 1, 100000);
  const pageSize = parsePositiveInt(
    url.searchParams.get('pageSize'),
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
  );

  let client;
  try {
    client = getSupabaseAdmin();
  } catch {
    return sendJson(res, 503, { message: SERVICE_UNAVAILABLE_MESSAGE });
  }

  let query = client
    .from(MEMBERS_TABLE)
    .select(SELECT_FIELDS, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (searchTerm) {
    query = query.or(
      `full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`,
    );
  }

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('members: list failed', error.code ?? 'unknown');
    return sendJson(res, 500, { message: LOAD_FAILED_MESSAGE });
  }

  return sendJson(res, 200, {
    data: data ?? [],
    count: count ?? 0,
    page,
    pageSize,
  });
}
