import type { ServerResponse } from 'node:http';
import { methodNotAllowed, sendJson } from './_lib/http.js';
import type { ApiRequest } from './_lib/http.js';
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';
import {
  ANNOUNCEMENT_FIELDS,
  ANNOUNCEMENTS_TABLE,
  mapAnnouncementRow,
} from './_lib/announcements.js';

export const config = { maxDuration: 15 };

const SERVICE_UNAVAILABLE_MESSAGE = 'الخدمة غير متاحة مؤقتاً.';
const NOT_FOUND_MESSAGE = 'الإعلان غير موجود.';

/** Upper bound on the public listing so the response stays small. */
const PUBLIC_LIMIT = 100;

/**
 * Public read-only announcements endpoint.
 *
 *   GET                → published, due announcements (newest first)
 *   GET ?slug=<slug>   → one published, due announcement
 *
 * Only announcements whose `status` is `published` and whose `published_at` is
 * set and not in the future are ever returned; drafts and scheduled
 * announcements are invisible. The service role reads the RLS-protected table
 * server-side; the browser never queries it directly.
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

  const url = new URL(req.url ?? '/', 'http://localhost');
  const slug = (url.searchParams.get('slug') ?? '').trim();
  const now = new Date().toISOString();

  if (slug) {
    const { data, error } = await client
      .from(ANNOUNCEMENTS_TABLE)
      .select(ANNOUNCEMENT_FIELDS)
      .eq('slug', slug)
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .lte('published_at', now)
      .maybeSingle();

    if (error) {
      console.error('announcements: public detail failed', error.code ?? 'unknown');
      return sendJson(res, 500, { message: SERVICE_UNAVAILABLE_MESSAGE });
    }
    if (!data) {
      return sendJson(res, 404, { message: NOT_FOUND_MESSAGE });
    }

    return sendJson(
      res,
      200,
      { announcement: mapAnnouncementRow(data as Record<string, unknown>) },
      { cacheControl: 'public, s-maxage=60, stale-while-revalidate=300' },
    );
  }

  const { data, error } = await client
    .from(ANNOUNCEMENTS_TABLE)
    .select(ANNOUNCEMENT_FIELDS)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', now)
    .order('published_at', { ascending: false })
    .limit(PUBLIC_LIMIT);

  if (error) {
    console.error('announcements: public list failed', error.code ?? 'unknown');
    return sendJson(res, 500, { message: SERVICE_UNAVAILABLE_MESSAGE });
  }

  const rows = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  return sendJson(
    res,
    200,
    { data: rows.map(mapAnnouncementRow) },
    { cacheControl: 'public, s-maxage=60, stale-while-revalidate=300' },
  );
}
