import type { ServerResponse } from 'node:http';
import { methodNotAllowed, sendJson } from '../_lib/http.js';
import type { ApiRequest } from '../_lib/http.js';
import { requireAdmin } from '../_lib/adminAuth.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';
import { GOLDEN_VOICE_TABLE } from '../_lib/goldenVoice.js';

export const config = { maxDuration: 15 };

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

/**
 * `video_path` is selected only to derive `hasVideo`; the private storage path
 * itself never leaves the server. The browser asks the video endpoint for a
 * short-lived signed URL by participant id.
 */
const SELECT_FIELDS = 'id, full_name, phone, age, city, region, video_path, created_at';

const LOAD_FAILED_MESSAGE = 'تعذّر تحميل المشاركين. المرجو المحاولة مرة أخرى.';
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

interface ParticipantRow {
  id: string;
  full_name: string;
  phone: string;
  age: number;
  city: string;
  region: string;
  video_path: string | null;
  created_at: string;
}

/** Strip the private storage path before the record reaches the browser. */
function toParticipant(row: ParticipantRow) {
  return {
    id: row.id,
    full_name: row.full_name,
    phone: row.phone,
    age: row.age,
    city: row.city,
    region: row.region,
    created_at: row.created_at,
    hasVideo: Boolean(row.video_path),
  };
}

/**
 * Admin Golden Voice participants endpoint (server-side authorization required).
 *
 *   GET ?[q=…][page=…][pageSize=…] → paginated list (newest first)
 *
 * `requireAdmin` verifies the bearer token and the `admin_users` allowlist
 * before any participant data is read. Search matches the full name, phone
 * number or city.
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
    .from(GOLDEN_VOICE_TABLE)
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
    console.error('participants: list failed', error.code ?? 'unknown');
    return sendJson(res, 500, { message: LOAD_FAILED_MESSAGE });
  }

  const rows = Array.isArray(data) ? (data as ParticipantRow[]) : [];

  return sendJson(res, 200, {
    data: rows.map(toParticipant),
    count: count ?? 0,
    page,
    pageSize,
  });
}
