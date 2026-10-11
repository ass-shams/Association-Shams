import type { ServerResponse } from 'node:http';
import { methodNotAllowed, sendJson } from './_lib/http.js';
import type { ApiRequest } from './_lib/http.js';
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';
import { GOLDEN_VOICE_TABLE } from './_lib/goldenVoice.js';
import { COMPETITIONS_TABLE } from './_lib/competitions.js';
import {
  isCompetitionStatus,
  resolveEffectiveStatus,
} from '../src/pages/competitions/status.js';

export const config = { maxDuration: 15 };

const SERVICE_UNAVAILABLE_MESSAGE = 'الخدمة غير متاحة مؤقتاً.';

const PUBLIC_FIELDS = 'id, slug, title, description, status, registration_deadline, created_at';

interface CompetitionRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: unknown;
  registration_deadline: string | null;
  created_at: string;
}

/**
 * Public read-only competitions endpoint.
 *
 * Returns only public-safe fields, the server-computed effective status, and
 * the real participant count. The service role reads the RLS-protected table
 * server-side; the browser never queries the table directly. Writes are not
 * supported here.
 */
export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, 'GET');
  }

  let client;
  try {
    client = getSupabaseAdmin();
  } catch {
    return sendJson(res, 503, { message: SERVICE_UNAVAILABLE_MESSAGE });
  }

  const { data, error } = await client
    .from(COMPETITIONS_TABLE)
    .select(PUBLIC_FIELDS)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('competitions: public list failed', error.code ?? 'unknown');
    return sendJson(res, 500, { message: SERVICE_UNAVAILABLE_MESSAGE });
  }

  const rows = (Array.isArray(data) ? data : []) as CompetitionRow[];

  const counts = await Promise.all(
    rows.map((row) =>
      client
        .from(GOLDEN_VOICE_TABLE)
        .select('id', { count: 'exact', head: true })
        .eq('competition_id', row.id),
    ),
  );

  if (counts.some((result) => result.error)) {
    console.error('competitions: public participant count failed');
    return sendJson(res, 500, { message: SERVICE_UNAVAILABLE_MESSAGE });
  }

  const competitions = rows.map((row, index) => {
    const status = isCompetitionStatus(row.status) ? row.status : 'closed';
    return {
      slug: row.slug,
      title: row.title,
      description: row.description,
      status,
      effectiveStatus: resolveEffectiveStatus(status, row.registration_deadline),
      registrationDeadline: row.registration_deadline,
      participantsCount: counts[index].count ?? 0,
    };
  });

  return sendJson(res, 200, { data: competitions });
}
