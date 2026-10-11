import type { ServerResponse } from 'node:http';
import { methodNotAllowed, sendJson } from '../_lib/http.js';
import type { ApiRequest } from '../_lib/http.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';
import { resolveGoldenVoiceRegistrationGate } from '../_lib/competitions.js';
import {
  GOLDEN_VOICE_TABLE,
  isValidVideoPath,
  readJsonBody,
  removeObject,
  verifyVideo,
} from '../_lib/goldenVoice.js';
import { claimUploadTicket } from '../_lib/tickets.js';
import { consumeRateLimit, hashIdentifier } from '../_lib/rateLimit.js';
import { firstForwardedIp, verifyTurnstile } from '../_lib/turnstile.js';
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
const VIDEO_TICKET_MESSAGE = 'تعذّر التحقق من رفع الفيديو. المرجو إعادة المحاولة.';
const CAPTCHA_FAILED_MESSAGE = 'تعذّر إكمال التحقق. المرجو المحاولة مرة أخرى.';
const TOO_MANY_MESSAGE = 'عدد كبير من المحاولات. المرجو المحاولة لاحقاً.';
const INSERT_FAILED_MESSAGE = 'تعذّر إكمال التسجيل. المرجو المحاولة مرة أخرى.';
const REGISTRATION_CLOSED_MESSAGE = 'التسجيل في هذه المسابقة غير مفتوح حالياً.';
const SERVICE_UNAVAILABLE_MESSAGE = 'خدمة التسجيل غير متاحة مؤقتاً. المرجو المحاولة لاحقاً.';

/** Persistent per-IP ceiling for registration submissions (fixed one-hour window). */
const REGISTER_RATE_LIMIT = 10;
const REGISTER_RATE_WINDOW_SECONDS = 60 * 60;

/** Guard against oversized text payloads (Vercel also caps the request body). */
const MAX_NAME_LENGTH = 120;
const MAX_CITY_LENGTH = 120;
const MAX_PHONE_LENGTH = 32;

/**
 * Validate the submission and insert the registration with the service role.
 *
 * The video-required region (`other`) must present a one-time upload ticket
 * issued by `/api/golden-voice/uploads` after Turnstile verification; the object
 * path is taken from the claimed ticket, never from the client. The no-video
 * region requires a fresh Turnstile token. Every request is rate limited.
 */
export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  const body = readJsonBody(req.body);
  if (!body) {
    return sendJson(res, 400, { message: INVALID_PAYLOAD_MESSAGE });
  }

  // Verify the competition is accepting registrations before doing any work.
  const gate = await resolveGoldenVoiceRegistrationGate();
  if (gate.ok === false) {
    const { reason } = gate;
    if (reason === 'not-open') {
      return sendJson(res, 403, { message: REGISTRATION_CLOSED_MESSAGE });
    }
    // Missing competition row or database failure: fail closed.
    return sendJson(res, 503, { message: SERVICE_UNAVAILABLE_MESSAGE });
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
  const remoteIp = firstForwardedIp(req);

  const rate = await consumeRateLimit(
    `gv-register:${hashIdentifier(remoteIp ?? 'unknown')}`,
    REGISTER_RATE_LIMIT,
    REGISTER_RATE_WINDOW_SECONDS,
  );
  if (rate === 'unavailable') {
    return sendJson(res, 503, { message: SERVICE_UNAVAILABLE_MESSAGE });
  }
  if (rate === 'limited') {
    return sendJson(res, 429, { message: TOO_MANY_MESSAGE });
  }

  if (isVideoRequired(region)) {
    return registerWithVideo(res, body, values, region, gate.competitionId);
  }

  return registerWithoutVideo(req, res, body, values, region, gate.competitionId);
}

async function registerWithVideo(
  res: ServerResponse,
  body: Record<string, unknown>,
  values: RegistrationValues,
  region: RegionValue,
  competitionId: string,
) {
  const ticketId = typeof body.ticketId === 'string' ? body.ticketId.trim() : '';
  if (!ticketId) {
    return sendJson(res, 400, { message: VIDEO_REQUIRED_MESSAGE });
  }

  const claim = await claimUploadTicket(ticketId, region);
  if (claim.ok === false) {
    if (claim.reason === 'unavailable') {
      return sendJson(res, 503, { message: SERVICE_UNAVAILABLE_MESSAGE });
    }
    return sendJson(res, 400, { message: VIDEO_TICKET_MESSAGE });
  }

  // The path comes from the claimed ticket, never from the client.
  const videoPath = claim.objectPath;
  if (!isValidVideoPath(videoPath)) {
    await removeObject(videoPath);
    return sendJson(res, 400, { message: VIDEO_NOT_FOUND_MESSAGE });
  }

  const verification = await verifyVideo(videoPath);
  if (verification.ok === false) {
    await removeObject(videoPath);
    return sendJson(res, 400, { message: verification.message });
  }

  return insertRegistration(res, values, region, videoPath, competitionId);
}

async function registerWithoutVideo(
  req: ApiRequest,
  res: ServerResponse,
  body: Record<string, unknown>,
  values: RegistrationValues,
  region: RegionValue,
  competitionId: string,
) {
  // The no-video flow must not carry a video path or an upload ticket.
  const strayVideoPath = typeof body.videoPath === 'string' ? body.videoPath.trim() : '';
  const strayTicket = typeof body.ticketId === 'string' ? body.ticketId.trim() : '';
  if (strayVideoPath || strayTicket) {
    return sendJson(res, 400, { message: REGION_MISMATCH_MESSAGE });
  }

  const turnstileToken = typeof body.turnstileToken === 'string' ? body.turnstileToken.trim() : '';
  if (!turnstileToken) {
    return sendJson(res, 400, { message: CAPTCHA_FAILED_MESSAGE });
  }

  const verification = await verifyTurnstile(turnstileToken, firstForwardedIp(req));
  if (verification === 'unavailable') {
    return sendJson(res, 503, { message: SERVICE_UNAVAILABLE_MESSAGE });
  }
  if (verification !== 'ok') {
    return sendJson(res, 400, { message: CAPTCHA_FAILED_MESSAGE });
  }

  return insertRegistration(res, values, region, null, competitionId);
}

async function insertRegistration(
  res: ServerResponse,
  values: RegistrationValues,
  region: RegionValue,
  videoPath: string | null,
  competitionId: string,
) {
  try {
    const { error } = await getSupabaseAdmin()
      .from(GOLDEN_VOICE_TABLE)
      .insert({
        full_name: values.fullName.trim(),
        phone: normalizeMoroccanPhone(values.phone.trim()),
        age: Number(values.age),
        city: values.city.trim(),
        region,
        video_path: videoPath,
        competition_id: competitionId,
      });

    if (error) {
      if (videoPath) {
        await removeObject(videoPath);
      }
      console.error('golden-voice: registration insert failed', error.code ?? 'unknown');
      return sendJson(res, 500, { message: INSERT_FAILED_MESSAGE });
    }
  } catch (error) {
    if (videoPath) {
      await removeObject(videoPath);
    }
    console.error(
      'golden-voice: registration insert threw',
      error instanceof Error ? error.name : 'unknown',
    );
    return sendJson(res, 500, { message: INSERT_FAILED_MESSAGE });
  }

  return sendJson(res, 201, { ok: true });
}
