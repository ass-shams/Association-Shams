import type { ServerResponse } from 'node:http';
import { methodNotAllowed, sendJson } from '../_lib/http.js';
import type { ApiRequest } from '../_lib/http.js';
import { requireAdmin } from '../_lib/adminAuth.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';
import {
  GOLDEN_VOICE_TABLE,
  createVideoViewUrl,
  isValidVideoPath,
} from '../_lib/goldenVoice.js';

export const config = { maxDuration: 30 };

const DEFAULT_EXPIRES_SECONDS = 300;
const MIN_EXPIRES_SECONDS = 30;
const MAX_EXPIRES_SECONDS = 3600;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const INVALID_ID_MESSAGE = 'معرّف المشارك غير صالح.';
const NOT_FOUND_MESSAGE = 'المشارك غير موجود.';
const NO_VIDEO_MESSAGE = 'لا يوجد فيديو مرتبط بهذا المشارك.';
const LINK_FAILED_MESSAGE = 'تعذّر إنشاء رابط الفيديو.';
const SERVICE_UNAVAILABLE_MESSAGE = 'الخدمة غير متاحة مؤقتاً.';

interface VideoRow {
  full_name: string | null;
  video_path: string | null;
}

/** Lower-case extension taken from the stored object path, defaulting to mp4. */
function fileExtension(path: string): string {
  const base = path.split('/').pop() ?? '';
  const dot = base.lastIndexOf('.');
  return dot >= 0 ? base.slice(dot + 1).toLowerCase() : 'mp4';
}

/**
 * Build a readable, header-safe attachment filename. The extension always
 * matches the stored object; the participant name is a convenience prefix.
 */
function buildDownloadName(fullName: string | null, path: string, id: string): string {
  const extension = fileExtension(path);
  const safeName =
    typeof fullName === 'string'
      ? fullName
          .replace(/[^\p{L}\p{N} _-]/gu, '')
          .trim()
          .replace(/\s+/g, '-')
          .slice(0, 60)
      : '';

  return `${safeName || `golden-voice-${id}`}.${extension}`;
}

/**
 * Admin endpoint that turns a participant id into a short-lived signed URL for
 * that participant's private video.
 *
 *   GET ?id=<uuid>[&download=1][&expiresIn=<seconds>]
 *
 * `requireAdmin` runs first. The object path is read from the participant's own
 * record (never from the client) and re-checked against the server-generated
 * path format, so a client cannot request another participant's video or an
 * arbitrary storage path. The signed URL is short-lived and never permanent.
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
  const id = (url.searchParams.get('id') ?? '').trim();
  if (!UUID_PATTERN.test(id)) {
    return sendJson(res, 400, { message: INVALID_ID_MESSAGE });
  }

  const wantsDownload = url.searchParams.get('download') === '1';

  let client;
  try {
    client = getSupabaseAdmin();
  } catch {
    return sendJson(res, 503, { message: SERVICE_UNAVAILABLE_MESSAGE });
  }

  const { data, error } = await client
    .from(GOLDEN_VOICE_TABLE)
    .select('full_name, video_path')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('participant-video: lookup failed', error.code ?? 'unknown');
    return sendJson(res, 500, { message: LINK_FAILED_MESSAGE });
  }

  if (!data) {
    return sendJson(res, 404, { message: NOT_FOUND_MESSAGE });
  }

  const row = data as VideoRow;
  const videoPath = row.video_path;

  if (!videoPath || !isValidVideoPath(videoPath)) {
    return sendJson(res, 404, { message: NO_VIDEO_MESSAGE });
  }

  const rawExpiry = url.searchParams.get('expiresIn');
  const requested = rawExpiry === null ? Number.NaN : Number(rawExpiry);
  const expiresIn = Number.isFinite(requested)
    ? Math.min(Math.max(Math.trunc(requested), MIN_EXPIRES_SECONDS), MAX_EXPIRES_SECONDS)
    : DEFAULT_EXPIRES_SECONDS;

  const download = wantsDownload ? buildDownloadName(row.full_name, videoPath, id) : undefined;
  const signedUrl = await createVideoViewUrl(videoPath, expiresIn, download);

  if (!signedUrl) {
    return sendJson(res, 500, { message: LINK_FAILED_MESSAGE });
  }

  return sendJson(res, 200, { url: signedUrl, expiresIn });
}
