import type { ServerResponse } from 'node:http';
import { methodNotAllowed, sendJson } from '../_lib/http.js';
import type { ApiRequest } from '../_lib/http.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';
import { GOLDEN_VOICE_TABLE } from '../_lib/goldenVoice.js';
import { syncGoldenVoiceRegistrations } from '../_lib/googleSheets.js';
import type { GoldenVoiceSheetRegistration } from '../_lib/googleSheets.js';

/** Reconciliation over every registration can take a little longer. */
export const config = { maxDuration: 60 };

const UNAUTHORIZED_MESSAGE = 'غير مصرح.';
const SERVICE_UNAVAILABLE_MESSAGE = 'الخدمة غير متاحة مؤقتاً.';
const READ_FAILED_MESSAGE = 'تعذّر جلب التسجيلات.';
const SYNC_FAILED_MESSAGE = 'تعذّرت مزامنة الجدول.';

interface RegistrationRow {
  id: string;
  full_name: string;
  phone: string;
  age: number;
  city: string;
  region: string;
  video_path: string | null;
  created_at: string;
}

function isAuthorized(req: ApiRequest): boolean {
  const secret = process.env.GOLDEN_VOICE_ADMIN_SECRET;
  if (!secret) {
    return false;
  }

  const header = req.headers['authorization'];
  const value = Array.isArray(header) ? header[0] : header;
  return typeof value === 'string' && value === `Bearer ${secret}`;
}

/**
 * Protected reconciliation endpoint.
 *
 * Re-reads every registration from Supabase (the source of truth) and upserts
 * it into the shared worksheet by registration UUID. Because the upsert is
 * idempotent, this safely repairs any row whose best-effort sync failed when it
 * was first registered, without creating duplicates.
 */
export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  if (!process.env.GOLDEN_VOICE_ADMIN_SECRET) {
    console.error('golden-voice: GOLDEN_VOICE_ADMIN_SECRET is not configured');
    return sendJson(res, 503, { message: SERVICE_UNAVAILABLE_MESSAGE });
  }

  if (!isAuthorized(req)) {
    return sendJson(res, 401, { message: UNAUTHORIZED_MESSAGE });
  }

  let rows: RegistrationRow[];
  try {
    const { data, error } = await getSupabaseAdmin()
      .from(GOLDEN_VOICE_TABLE)
      .select('id, full_name, phone, age, city, region, video_path, created_at')
      .order('created_at', { ascending: true });

    if (error || !data) {
      throw error ?? new Error('no-data');
    }

    rows = data as RegistrationRow[];
  } catch (error) {
    console.error(
      'golden-voice: reconcile read failed',
      error instanceof Error ? error.name : 'unknown',
    );
    return sendJson(res, 500, { message: READ_FAILED_MESSAGE });
  }

  const registrations: GoldenVoiceSheetRegistration[] = rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    age: row.age,
    city: row.city,
    region: row.region,
    createdAt: row.created_at,
    videoPath: row.video_path,
  }));

  const result = await syncGoldenVoiceRegistrations(registrations);
  if (!result.ok) {
    console.error('golden-voice: reconcile sync failed', result.reason);
    return sendJson(res, 502, { message: SYNC_FAILED_MESSAGE, reason: result.reason });
  }

  return sendJson(res, 200, { ok: true, synced: result.synced });
}
