import { getSupabaseAdmin } from './supabaseAdmin.js';
import {
  getAviDurationFromAvih,
  getMp4DurationFromMoov,
  getWebmDurationFromInfo,
} from './mediaDuration.js';
import {
  VideoTooLargeError,
  collectAviMetadata,
  collectMp4Metadata,
  collectWebmMetadata,
  createByteReader,
  detectContainer,
} from './metadataStream.js';
import {
  ACCEPTED_VIDEO_EXTENSIONS,
  VIDEO_MAX_BYTES,
  VIDEO_MAX_DURATION_SECONDS,
} from '../../src/pages/competitions/golden-voice/constants.js';
import {
  VIDEO_DURATION_UNVERIFIABLE_MESSAGE,
  VIDEO_FORMAT_MESSAGE,
  VIDEO_NOT_FOUND_MESSAGE,
  VIDEO_SIZE_MESSAGE,
  VIDEO_TOO_LONG_MESSAGE,
} from '../../src/pages/competitions/golden-voice/validation.js';

/** Dedicated database table for Golden Voice registrations. */
export const GOLDEN_VOICE_TABLE = 'golden_voice_registrations';

/** Private Storage bucket holding participation videos. */
export const GOLDEN_VOICE_BUCKET =
  process.env.GOLDEN_VOICE_VIDEO_BUCKET?.trim() || 'golden-voice-videos';

/** Object-key prefix inside the bucket. */
export const VIDEO_PATH_PREFIX = 'golden-voice';

/**
 * Upper bound on the structural metadata retained in memory (16 MB). A real
 * `moov`/`Info` for a short audition is far smaller; anything larger is treated
 * as unverifiable rather than allowed to exhaust function memory.
 */
const MAX_METADATA_BYTES = 16 * 1024 * 1024;

/** Configurable maximum accepted video size, defaulting to the shared limit. */
const MAX_VIDEO_BYTES = resolveMaxBytes(process.env.GOLDEN_VOICE_MAX_VIDEO_BYTES);

/** Server-generated object paths: `golden-voice/<uuid>.<supported-extension>`. */
const VIDEO_PATH_PATTERN = new RegExp(
  `^golden-voice/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(${ACCEPTED_VIDEO_EXTENSIONS.join('|')})$`,
);

function resolveMaxBytes(raw: string | undefined): number {
  if (!raw) {
    return VIDEO_MAX_BYTES;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : VIDEO_MAX_BYTES;
}

/** Parse a JSON request body regardless of whether the platform pre-parsed it. */
export function readJsonBody(body: unknown): Record<string, unknown> | null {
  if (body && typeof body === 'object') {
    return body as Record<string, unknown>;
  }

  if (typeof body === 'string') {
    try {
      const parsed: unknown = JSON.parse(body);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  return null;
}

/** Reject object paths that were not produced by the uploads endpoint. */
export function isValidVideoPath(path: string): boolean {
  return VIDEO_PATH_PATTERN.test(path);
}

export type VideoVerification = { ok: true } | { ok: false; message: string };

/**
 * Verify an already-uploaded object: real container magic bytes, size, and
 * duration read from the container metadata.
 *
 * The object is streamed from a short-lived signed URL. Only the structural
 * metadata (MP4 `moov` / WebM `Info`) is retained, so memory stays bounded no
 * matter how large the video is. This is the strongest verification the Vercel
 * Node runtime can perform without an FFmpeg binary.
 */
export async function verifyVideo(path: string): Promise<VideoVerification> {
  const admin = getSupabaseAdmin();

  // Best-effort metadata read; older Storage deployments may lack the endpoint.
  try {
    const { data } = await admin.storage.from(GOLDEN_VOICE_BUCKET).info(path);
    if (data && typeof data.size === 'number' && data.size > MAX_VIDEO_BYTES) {
      return { ok: false, message: VIDEO_SIZE_MESSAGE };
    }
  } catch {
    // Fall through to the streaming size check below.
  }

  const { data: signed, error } = await admin.storage
    .from(GOLDEN_VOICE_BUCKET)
    .createSignedUrl(path, 60);

  if (error || !signed?.signedUrl) {
    return { ok: false, message: VIDEO_NOT_FOUND_MESSAGE };
  }

  let response: Response;
  try {
    response = await fetch(signed.signedUrl);
  } catch {
    return { ok: false, message: VIDEO_NOT_FOUND_MESSAGE };
  }

  if (!response.ok || !response.body) {
    return { ok: false, message: VIDEO_NOT_FOUND_MESSAGE };
  }

  const reader = createByteReader(response.body, MAX_VIDEO_BYTES);

  try {
    const head = await reader.peek(12);
    const container = head ? detectContainer(head) : null;

    if (!container) {
      await reader.cancel();
      return { ok: false, message: VIDEO_FORMAT_MESSAGE };
    }

    const metadata =
      container === 'ebml'
        ? await collectWebmMetadata(reader, MAX_METADATA_BYTES)
        : container === 'avi'
          ? await collectAviMetadata(reader, MAX_METADATA_BYTES)
          : await collectMp4Metadata(reader, MAX_METADATA_BYTES);

    await reader.cancel();

    if (!metadata) {
      return { ok: false, message: VIDEO_DURATION_UNVERIFIABLE_MESSAGE };
    }

    const duration =
      container === 'ebml'
        ? getWebmDurationFromInfo(metadata)
        : container === 'avi'
          ? getAviDurationFromAvih(metadata)
          : getMp4DurationFromMoov(metadata);

    if (duration === null) {
      return { ok: false, message: VIDEO_DURATION_UNVERIFIABLE_MESSAGE };
    }

    if (duration > VIDEO_MAX_DURATION_SECONDS) {
      return { ok: false, message: VIDEO_TOO_LONG_MESSAGE };
    }

    return { ok: true };
  } catch (error) {
    await reader.cancel();

    if (error instanceof VideoTooLargeError) {
      return { ok: false, message: VIDEO_SIZE_MESSAGE };
    }

    return { ok: false, message: VIDEO_NOT_FOUND_MESSAGE };
  }
}

/**
 * Best-effort delete used for compensating cleanup. Callers must only pass an
 * object path derived from a ticket the current submission owns. Failures are
 * logged without exposing the object path or credentials.
 */
export async function removeObject(path: string): Promise<void> {
  try {
    const { error } = await getSupabaseAdmin().storage.from(GOLDEN_VOICE_BUCKET).remove([path]);
    if (error) {
      console.error('golden-voice: cleanup delete failed', error.name);
    }
  } catch (error) {
    console.error('golden-voice: cleanup delete threw', error instanceof Error ? error.name : 'unknown');
  }
}

/**
 * Create a short-lived signed URL for a private video object. Only used by the
 * protected staff endpoint; it is never part of the public registration flow,
 * so viewer links are not permanent and not stored anywhere.
 */
export async function createVideoViewUrl(
  path: string,
  expiresInSeconds = 300,
): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin()
    .storage.from(GOLDEN_VOICE_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}
