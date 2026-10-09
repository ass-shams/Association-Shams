import type { ServerResponse } from 'node:http';
import { methodNotAllowed, sendJson } from '../_lib/http.js';
import type { ApiRequest } from '../_lib/http.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';
import {
  GOLDEN_VOICE_TABLE,
  isValidVideoPath,
  readJsonBody,
  removeObject,
  verifyVideo,
} from '../_lib/goldenVoice.js';
import { syncRegistrationToSheetBestEffort } from '../_lib/googleSheets.js';
import type { GoldenVoiceSheetRegistration } from '../_lib/googleSheets.js';
import type { RegionValue } from '../../src/pages/competitions/golden-voice/constants.js';
import {
  isRegionValue,
  isVideoRequired,
  normalizeMoroccanPhone,
  validateRegistration,
  VIDEO_NOT_FOUND_MESSAGE,
  VIDEO_REQUIRED_MESSAGE,
} from '../../src/pages/competitions/golden-voice/validation.js';
import type { RegistrationValues } from '../../src/pages/competitions/golden-voice/types.js';

/** Keep the function within its processing window for large uploads. */
export const config = { maxDuration: 60 };

const INVALID_PAYLOAD_MESSAGE = 'المرجو التحقق من صحة البيانات المدخلة.';
const REGION_MISMATCH_MESSAGE = 'لا يمكن إرفاق فيديو لمشاركين من جهة بني ملال خنيفرة.';
const INSERT_FAILED_MESSAGE = 'تعذّر إكمال التسجيل. المرجو المحاولة مرة أخرى.';

/** Guard against oversized text payloads (Vercel also caps the request body). */
const MAX_NAME_LENGTH = 120;
const MAX_CITY_LENGTH = 120;
const MAX_PHONE_LENGTH = 32;

/**
 * Validate the submission, verify the referenced video when required, then
 * insert the registration with the service role.
 *
 * The client sends the object path returned by the uploads endpoint. The path
 * must match the server-generated format and the object must exist, be a valid
 * MP4/WebM container, and have a readable duration within the limit.
 */
export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  const body = readJsonBody(req.body);
  if (!body) {
    return sendJson(res, 400, { message: INVALID_PAYLOAD_MESSAGE });
  }

  const values: RegistrationValues = {
    fullName: typeof body.fullName === 'string' ? body.fullName : '',
    phone: typeof body.phone === 'string' ? body.phone : '',
    age:
      typeof body.age === 'number'
        ? String(body.age)
        : typeof body.age === 'string'
          ? body.age
          : '',
    city: typeof body.city === 'string' ? body.city : '',
    region: isRegionValue(body.region) ? body.region : '',
  };

  if (
    values.fullName.trim().length > MAX_NAME_LENGTH ||
    values.city.trim().length > MAX_CITY_LENGTH ||
    values.phone.trim().length > MAX_PHONE_LENGTH
  ) {
    return sendJson(res, 400, { message: INVALID_PAYLOAD_MESSAGE });
  }

  const fieldErrors = validateRegistration(values);
  if (Object.keys(fieldErrors).length > 0 || !isRegionValue(values.region)) {
    return sendJson(res, 400, { message: INVALID_PAYLOAD_MESSAGE });
  }

  const region: RegionValue = values.region;
  const videoPath = typeof body.videoPath === 'string' ? body.videoPath.trim() : '';

  if (isVideoRequired(region)) {
    return registerWithVideo(res, values, region, videoPath);
  }

  return registerWithoutVideo(res, values, region, videoPath);
}

interface InsertedRegistration {
  id: string;
  created_at: string;
}

async function registerWithVideo(
  res: ServerResponse,
  values: RegistrationValues,
  region: RegionValue,
  videoPath: string,
) {
  if (!videoPath) {
    return sendJson(res, 400, { message: VIDEO_REQUIRED_MESSAGE });
  }

  if (!isValidVideoPath(videoPath)) {
    return sendJson(res, 400, { message: VIDEO_NOT_FOUND_MESSAGE });
  }

  const verification = await verifyVideo(videoPath);
  if (!verification.ok) {
    await removeObject(videoPath);
    return sendJson(res, 400, { message: verification.message });
  }

  const inserted = await insertRegistration(values, region, videoPath);
  if (!inserted) {
    await removeObject(videoPath);
    return sendJson(res, 500, { message: INSERT_FAILED_MESSAGE });
  }

  await syncToSheetBestEffort(inserted, values, region, videoPath);
  return sendJson(res, 201, { ok: true });
}

async function registerWithoutVideo(
  res: ServerResponse,
  values: RegistrationValues,
  region: RegionValue,
  videoPath: string,
) {
  if (videoPath) {
    return sendJson(res, 400, { message: REGION_MISMATCH_MESSAGE });
  }

  const inserted = await insertRegistration(values, region, null);
  if (!inserted) {
    return sendJson(res, 500, { message: INSERT_FAILED_MESSAGE });
  }

  await syncToSheetBestEffort(inserted, values, region, null);
  return sendJson(res, 201, { ok: true });
}

/** Insert the registration and return its UUID and creation timestamp. */
async function insertRegistration(
  values: RegistrationValues,
  region: RegionValue,
  videoPath: string | null,
): Promise<InsertedRegistration | null> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from(GOLDEN_VOICE_TABLE)
      .insert({
        full_name: values.fullName.trim(),
        phone: normalizeMoroccanPhone(values.phone.trim()),
        age: Number(values.age),
        city: values.city.trim(),
        region,
        video_path: videoPath,
      })
      .select('id, created_at')
      .single();

    if (error || !data) {
      console.error('golden-voice: registration insert failed', error?.code ?? 'unknown');
      return null;
    }

    return data as InsertedRegistration;
  } catch (error) {
    console.error(
      'golden-voice: registration insert threw',
      error instanceof Error ? error.name : 'unknown',
    );
    return null;
  }
}

/**
 * Mirror the saved registration into the staff worksheet. Never throws and
 * never affects the HTTP response: Supabase stays the source of truth, and a
 * failed sync is recoverable with the protected reconciliation endpoint.
 */
async function syncToSheetBestEffort(
  inserted: InsertedRegistration,
  values: RegistrationValues,
  region: RegionValue,
  videoPath: string | null,
): Promise<void> {
  const registration: GoldenVoiceSheetRegistration = {
    id: inserted.id,
    fullName: values.fullName.trim(),
    phone: normalizeMoroccanPhone(values.phone.trim()),
    age: Number(values.age),
    city: values.city.trim(),
    region,
    createdAt: inserted.created_at,
    videoPath,
  };

  const synced = await syncRegistrationToSheetBestEffort(registration);
  if (!synced) {
    console.error('golden-voice: Google Sheets sync skipped or failed', inserted.id);
  }
}
