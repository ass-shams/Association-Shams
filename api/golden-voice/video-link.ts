import type { ServerResponse } from 'node:http';
import { methodNotAllowed, sendJson } from '../_lib/http.js';
import type { ApiRequest } from '../_lib/http.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';
import {
  GOLDEN_VOICE_TABLE,
  createVideoViewUrl,
  isValidVideoPath,
  readJsonBody,
} from '../_lib/goldenVoice.js';

export const config = { maxDuration: 30 };

const DEFAULT_EXPIRES_SECONDS = 300;
const MIN_EXPIRES_SECONDS = 30;
const MAX_EXPIRES_SECONDS = 3600;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const UNAUTHORIZED_MESSAGE = 'غير مصرح.';
const SERVICE_UNAVAILABLE_MESSAGE = 'الخدمة غير متاحة مؤقتاً.';
const INVALID_ID_MESSAGE = 'معرّف التسجيل غير صالح.';
const NO_VIDEO_MESSAGE = 'لا يوجد فيديو مرتبط بهذا التسجيل.';
const LINK_FAILED_MESSAGE = 'تعذّر إنشاء رابط الفيديو.';

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
 * Protected staff endpoint that turns a registration ID into a short-lived
 * signed URL for its private video. The worksheet only ever stores the private
 * object path, so staff request a temporary link when they need to watch or
 * download a video.
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

  const body = readJsonBody(req.body);
  const id = typeof body?.id === 'string' ? body.id.trim() : '';

  if (!UUID_PATTERN.test(id)) {
    return sendJson(res, 400, { message: INVALID_ID_MESSAGE });
  }

  const { data, error } = await getSupabaseAdmin()
    .from(GOLDEN_VOICE_TABLE)
    .select('video_path')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('golden-voice: video lookup failed', error.code ?? 'unknown');
    return sendJson(res, 500, { message: LINK_FAILED_MESSAGE });
  }

  const videoPath = (data as { video_path?: string | null } | null)?.video_path ?? null;
  if (!videoPath || !isValidVideoPath(videoPath)) {
    return sendJson(res, 404, { message: NO_VIDEO_MESSAGE });
  }

  const requested = Number(body?.expiresIn);
  const expiresIn = Number.isFinite(requested)
    ? Math.min(Math.max(Math.trunc(requested), MIN_EXPIRES_SECONDS), MAX_EXPIRES_SECONDS)
    : DEFAULT_EXPIRES_SECONDS;

  const url = await createVideoViewUrl(videoPath, expiresIn);
  if (!url) {
    return sendJson(res, 500, { message: LINK_FAILED_MESSAGE });
  }

  return sendJson(res, 200, { url, expiresIn });
}
