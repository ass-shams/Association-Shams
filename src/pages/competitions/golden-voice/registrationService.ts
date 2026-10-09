import { getBrowserSupabaseClient } from '@/lib/supabase';
import { OTHER_REGION } from './constants';
import type { RegionValue } from './constants';
import type { SelectedVideo } from './types';

/** Fields sent to the serverless registration endpoint. */
export interface GoldenVoiceSubmissionValues {
  fullName: string;
  phone: string;
  age: number;
  city: string;
  region: RegionValue;
}

interface SignedUpload {
  bucket: string;
  path: string;
  token: string;
}

const UPLOADS_ENDPOINT = '/api/golden-voice/uploads';
const REGISTER_ENDPOINT = '/api/golden-voice/register';
const JSON_HEADERS = { 'content-type': 'application/json' };

/** Generic Arabic error shown when no safe server message is available. */
export const GENERIC_SUBMIT_ERROR = 'تعذّر إكمال التسجيل. المرجو المحاولة مرة أخرى.';
const VIDEO_REQUIRED_MESSAGE = 'المرجو رفع فيديو المشاركة.';
const UPLOAD_ERROR = 'تعذّر رفع الفيديو. المرجو المحاولة مرة أخرى.';
const CLIENT_NOT_CONFIGURED_ERROR =
  'خدمة رفع الفيديو غير مهيأة حالياً. المرجو المحاولة في وقت لاحق.';

/** Read a safe Arabic error message from an API response, if present. */
async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (data && typeof data === 'object' && 'message' in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }
  } catch {
    // Ignore non-JSON bodies; fall back to the generic message.
  }

  return fallback;
}

/** Request a signed upload URL for one new, server-generated object path. */
async function createSignedUpload(contentType: string): Promise<SignedUpload> {
  const response = await fetch(UPLOADS_ENDPOINT, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ region: OTHER_REGION, contentType }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, GENERIC_SUBMIT_ERROR));
  }

  const data = (await response.json()) as Partial<SignedUpload>;
  if (!data.bucket || !data.path || !data.token) {
    throw new Error(GENERIC_SUBMIT_ERROR);
  }

  return { bucket: data.bucket, path: data.path, token: data.token };
}

/** POST the registration payload and surface any safe Arabic server message. */
async function register(payload: Record<string, unknown>): Promise<void> {
  const response = await fetch(REGISTER_ENDPOINT, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, GENERIC_SUBMIT_ERROR));
  }
}

/**
 * Full submission flow.
 *
 * `region === "other"`:
 *   1. request a signed upload URL from the server,
 *   2. upload the video straight to the private bucket (never through Vercel),
 *   3. register with the resulting object path, which the server re-validates.
 * `region` inside Beni Mellal-Khenifra: register without a video.
 *
 * The server performs the authoritative validation and is the only component
 * allowed to write to the database with privileged credentials.
 */
export async function submitGoldenVoiceRegistration(
  values: GoldenVoiceSubmissionValues,
  video: SelectedVideo | null,
): Promise<void> {
  if (values.region === OTHER_REGION) {
    if (!video) {
      throw new Error(VIDEO_REQUIRED_MESSAGE);
    }

    const upload = await createSignedUpload(video.file.type);

    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      throw new Error(CLIENT_NOT_CONFIGURED_ERROR);
    }

    const { error } = await supabase.storage
      .from(upload.bucket)
      .uploadToSignedUrl(upload.path, upload.token, video.file, {
        contentType: video.file.type,
        upsert: false,
      });

    if (error) {
      throw new Error(UPLOAD_ERROR);
    }

    await register({ ...values, videoPath: upload.path });
    return;
  }

  await register({ ...values });
}
