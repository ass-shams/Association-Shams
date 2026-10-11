import type { ServerResponse } from 'node:http';
import { methodNotAllowed, readJsonBody, sendJson } from '../_lib/http.js';
import type { ApiRequest } from '../_lib/http.js';
import { requireAdmin } from '../_lib/adminAuth.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';

export const config = { maxDuration: 15 };

const CONTACT_TABLE = 'contact_requests';
const STATUSES = ['new', 'in_progress', 'resolved'] as const;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SELECT_FIELDS = 'id, name, email, phone, subject, message, status, created_at, updated_at';

const INVALID_MESSAGE = 'المرجو التحقق من صحة البيانات المدخلة.';
const NOT_FOUND_MESSAGE = 'الطلب غير موجود.';
const LOAD_FAILED_MESSAGE = 'تعذّر تحميل طلبات الاتصال. المرجو المحاولة مرة أخرى.';
const UPDATE_FAILED_MESSAGE = 'تعذّر تحديث حالة الطلب. المرجو المحاولة مرة أخرى.';
const SERVICE_UNAVAILABLE_MESSAGE = 'الخدمة غير متاحة مؤقتاً.';

type ContactStatus = (typeof STATUSES)[number];

function isContactStatus(value: unknown): value is ContactStatus {
  return typeof value === 'string' && (STATUSES as readonly string[]).includes(value);
}

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
 * Admin contact-requests endpoint (server-side authorization required).
 *
 *   GET  ?[id=<uuid>]                         → detail
 *   GET  ?[status=…][q=…][page=…][pageSize=…] → paginated list (newest first)
 *   PATCH { id, status }                      → update workflow status
 *
 * `requireAdmin` verifies the bearer token and the `admin_users` allowlist
 * before any contact data is read or written.
 */
export default async function handler(req: ApiRequest, res: ServerResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) {
    return;
  }

  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  if (req.method === 'PATCH') {
    return handlePatch(req, res);
  }

  return methodNotAllowed(res, 'GET, PATCH');
}

async function handleGet(req: ApiRequest, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost');

  let client;
  try {
    client = getSupabaseAdmin();
  } catch {
    return sendJson(res, 503, { message: SERVICE_UNAVAILABLE_MESSAGE });
  }

  const id = url.searchParams.get('id');
  if (id) {
    if (!UUID_PATTERN.test(id)) {
      return sendJson(res, 400, { message: INVALID_MESSAGE });
    }

    const { data, error } = await client
      .from(CONTACT_TABLE)
      .select(SELECT_FIELDS)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('contact-requests: detail failed', error.code ?? 'unknown');
      return sendJson(res, 500, { message: LOAD_FAILED_MESSAGE });
    }
    if (!data) {
      return sendJson(res, 404, { message: NOT_FOUND_MESSAGE });
    }

    return sendJson(res, 200, { request: data });
  }

  const statusFilter = url.searchParams.get('status');
  const searchTerm = sanitizeSearch(url.searchParams.get('q') ?? '');
  const page = parsePositiveInt(url.searchParams.get('page'), 1, 100000);
  const pageSize = parsePositiveInt(url.searchParams.get('pageSize'), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

  let query = client
    .from(CONTACT_TABLE)
    .select(SELECT_FIELDS, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (isContactStatus(statusFilter)) {
    query = query.eq('status', statusFilter);
  }

  if (searchTerm) {
    query = query.or(
      `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,subject.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`,
    );
  }

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('contact-requests: list failed', error.code ?? 'unknown');
    return sendJson(res, 500, { message: LOAD_FAILED_MESSAGE });
  }

  return sendJson(res, 200, {
    data: data ?? [],
    count: count ?? 0,
    page,
    pageSize,
  });
}

async function handlePatch(req: ApiRequest, res: ServerResponse) {
  const body = readJsonBody(req.body);
  if (!body) {
    return sendJson(res, 400, { message: INVALID_MESSAGE });
  }

  const id = typeof body.id === 'string' ? body.id.trim() : '';
  if (!UUID_PATTERN.test(id) || !isContactStatus(body.status)) {
    return sendJson(res, 400, { message: INVALID_MESSAGE });
  }

  let client;
  try {
    client = getSupabaseAdmin();
  } catch {
    return sendJson(res, 503, { message: SERVICE_UNAVAILABLE_MESSAGE });
  }

  const { data, error } = await client
    .from(CONTACT_TABLE)
    .update({ status: body.status })
    .eq('id', id)
    .select(SELECT_FIELDS)
    .maybeSingle();

  if (error) {
    console.error('contact-requests: update failed', error.code ?? 'unknown');
    return sendJson(res, 500, { message: UPDATE_FAILED_MESSAGE });
  }
  if (!data) {
    return sendJson(res, 404, { message: NOT_FOUND_MESSAGE });
  }

  return sendJson(res, 200, { request: data });
}
