import type { ServerResponse } from 'node:http';
import { methodNotAllowed, readJsonBody, sendJson } from '../_lib/http.js';
import type { ApiRequest } from '../_lib/http.js';
import { requireAdmin } from '../_lib/adminAuth.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';
import { GOLDEN_VOICE_TABLE } from '../_lib/goldenVoice.js';
import { COMPETITIONS_TABLE } from '../_lib/competitions.js';
import { isCompetitionStatus } from '../../src/pages/competitions/status.js';

export const config = { maxDuration: 15 };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const MAX_TITLE_LENGTH = 200;

const INVALID_MESSAGE = 'المرجو التحقق من صحة البيانات المدخلة.';
const NOT_FOUND_MESSAGE = 'المسابقة غير موجودة.';
const LOAD_FAILED_MESSAGE = 'تعذّر تحميل المسابقات. المرجو المحاولة مرة أخرى.';
const UPDATE_FAILED_MESSAGE = 'تعذّر تحديث بيانات المسابقة. المرجو المحاولة مرة أخرى.';
const SERVICE_UNAVAILABLE_MESSAGE = 'الخدمة غير متاحة مؤقتاً.';

const COMPETITION_FIELDS =
  'id, slug, title, description, status, registration_deadline, created_at, updated_at';

interface CompetitionRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: unknown;
  registration_deadline: string | null;
  created_at: string;
  updated_at: string;
}

/** Normalise a DB row to the client shape (snake_case → camelCase). */
function toCompetition(row: CompetitionRow, participantCount: number) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    status: isCompetitionStatus(row.status) ? row.status : 'closed',
    registrationDeadline: row.registration_deadline,
    participantCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Parse a deadline value: `null`/empty clears it, otherwise a valid ISO date. */
function parseDeadline(value: unknown): { ok: true; value: string | null } | { ok: false } {
  if (value === null || value === undefined || value === '') {
    return { ok: true, value: null };
  }
  if (typeof value !== 'string') {
    return { ok: false };
  }
  const date = new Date(value.trim());
  if (Number.isNaN(date.getTime())) {
    return { ok: false };
  }
  return { ok: true, value: date.toISOString() };
}

/**
 * Admin competitions endpoint (server-side authorization required).
 *
 *   GET                         → competitions with participant counts
 *   PATCH { id, title?, status?, registrationDeadline? } → update settings
 *
 * `requireAdmin` verifies the bearer token and the `admin_users` allowlist
 * before any competition data is read or written. Participant counts come from
 * the real `golden_voice_registrations` records linked by `competition_id`.
 */
export default async function handler(req: ApiRequest, res: ServerResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) {
    return;
  }

  if (req.method === 'GET') {
    return handleGet(res);
  }

  if (req.method === 'PATCH') {
    return handlePatch(req, res);
  }

  return methodNotAllowed(res, 'GET, PATCH');
}

async function handleGet(res: ServerResponse) {
  let client;
  try {
    client = getSupabaseAdmin();
  } catch {
    return sendJson(res, 503, { message: SERVICE_UNAVAILABLE_MESSAGE });
  }

  const { data, error } = await client
    .from(COMPETITIONS_TABLE)
    .select(COMPETITION_FIELDS)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('competitions: list failed', error.code ?? 'unknown');
    return sendJson(res, 500, { message: LOAD_FAILED_MESSAGE });
  }

  const rows = (Array.isArray(data) ? data : []) as CompetitionRow[];

  // Count the real participant records for each competition. A failed count is
  // never silently reported as zero: it fails the whole request.
  const counts = await Promise.all(
    rows.map((row) =>
      client
        .from(GOLDEN_VOICE_TABLE)
        .select('id', { count: 'exact', head: true })
        .eq('competition_id', row.id),
    ),
  );

  if (counts.some((result) => result.error)) {
    console.error('competitions: participant count failed');
    return sendJson(res, 500, { message: LOAD_FAILED_MESSAGE });
  }

  const competitions = rows.map((row, index) =>
    toCompetition(row, counts[index].count ?? 0),
  );

  return sendJson(res, 200, { data: competitions });
}

async function handlePatch(req: ApiRequest, res: ServerResponse) {
  const body = readJsonBody(req.body);
  if (!body) {
    return sendJson(res, 400, { message: INVALID_MESSAGE });
  }

  const id = typeof body.id === 'string' ? body.id.trim() : '';
  if (!UUID_PATTERN.test(id)) {
    return sendJson(res, 400, { message: INVALID_MESSAGE });
  }

  const patch: Record<string, unknown> = {};

  if ('title' in body) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title || title.length > MAX_TITLE_LENGTH) {
      return sendJson(res, 400, { message: INVALID_MESSAGE });
    }
    patch.title = title;
  }

  if ('status' in body) {
    if (!isCompetitionStatus(body.status)) {
      return sendJson(res, 400, { message: INVALID_MESSAGE });
    }
    patch.status = body.status;
  }

  if ('registrationDeadline' in body) {
    const deadline = parseDeadline(body.registrationDeadline);
    if (!deadline.ok) {
      return sendJson(res, 400, { message: INVALID_MESSAGE });
    }
    patch.registration_deadline = deadline.value;
  }

  if (Object.keys(patch).length === 0) {
    return sendJson(res, 400, { message: INVALID_MESSAGE });
  }

  let client;
  try {
    client = getSupabaseAdmin();
  } catch {
    return sendJson(res, 503, { message: SERVICE_UNAVAILABLE_MESSAGE });
  }

  const { data, error } = await client
    .from(COMPETITIONS_TABLE)
    .update(patch)
    .eq('id', id)
    .select(COMPETITION_FIELDS)
    .maybeSingle();

  if (error) {
    console.error('competitions: update failed', error.code ?? 'unknown');
    return sendJson(res, 500, { message: UPDATE_FAILED_MESSAGE });
  }

  if (!data) {
    return sendJson(res, 404, { message: NOT_FOUND_MESSAGE });
  }

  const updated = data as CompetitionRow;

  const { count, error: countError } = await client
    .from(GOLDEN_VOICE_TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('competition_id', updated.id);

  if (countError) {
    console.error('competitions: participant count failed');
    return sendJson(res, 500, { message: UPDATE_FAILED_MESSAGE });
  }

  return sendJson(res, 200, { competition: toCompetition(updated, count ?? 0) });
}
