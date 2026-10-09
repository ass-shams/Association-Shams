import { randomUUID } from 'node:crypto';
import type { ServerResponse } from 'node:http';
import { methodNotAllowed, sendJson } from '../_lib/http.js';
import type { ApiRequest } from '../_lib/http.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';
import { GOLDEN_VOICE_BUCKET, VIDEO_PATH_PREFIX, readJsonBody } from '../_lib/goldenVoice.js';
import { OTHER_REGION } from '../../src/pages/competitions/golden-voice/constants.js';
import {
  getVideoExtensionForMime,
  isRegionValue,
  VIDEO_FORMAT_MESSAGE,
} from '../../src/pages/competitions/golden-voice/validation.js';

const SERVICE_UNAVAILABLE_MESSAGE = 'الخدمة غير متاحة مؤقتاً. المرجو المحاولة لاحقاً.';

/**
 * Issue a short-lived signed upload URL for a brand-new, non-guessable object
 * path. The browser uploads the video directly to the private bucket, which
 * keeps large videos out of the serverless request/response body limit.
 *
 * Participants from Beni Mellal-Khenifra receive `videoPath: null`.
 */
export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  const body = readJsonBody(req.body);
  const region = body?.region;

  if (!isRegionValue(region)) {
    return sendJson(res, 400, { message: 'المرجو اختيار جهة صحيحة.' });
  }

  if (region !== OTHER_REGION) {
    return sendJson(res, 200, { videoPath: null });
  }

  const contentType =
    typeof body?.contentType === 'string' ? body.contentType.trim().toLowerCase() : '';

  const extension = getVideoExtensionForMime(contentType);
  if (!extension) {
    return sendJson(res, 415, { message: VIDEO_FORMAT_MESSAGE });
  }

  const objectPath = `${VIDEO_PATH_PREFIX}/${randomUUID()}.${extension}`;

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.storage
      .from(GOLDEN_VOICE_BUCKET)
      .createSignedUploadUrl(objectPath, { upsert: false });

    if (error || !data) {
      console.error('golden-voice: signed upload url failed', error?.name ?? 'unknown');
      return sendJson(res, 500, {
        message: 'تعذّر بدء عملية رفع الفيديو. المرجو المحاولة مرة أخرى.',
      });
    }

    return sendJson(res, 200, {
      bucket: GOLDEN_VOICE_BUCKET,
      path: data.path,
      token: data.token,
    });
  } catch (error) {
    console.error(
      'golden-voice: uploads handler threw',
      error instanceof Error ? error.name : 'unknown',
    );
    return sendJson(res, 500, { message: SERVICE_UNAVAILABLE_MESSAGE });
  }
}
