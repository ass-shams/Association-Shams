import { OTHER_REGION } from './constants';
import type { RegionValue } from './constants';
import {
  getFileExtension,
  getVideoMimeForExtension,
  isAcceptedVideoMime,
} from './validation';
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

/** Submission stages shown to the visitor. */
export type SubmissionPhase = 'uploading' | 'processing';

export interface SubmissionProgress {
  phase: SubmissionPhase;
  /** Real upload percentage (0–100); only meaningful while uploading. */
  percent: number;
}

export type OnSubmissionProgress = (progress: SubmissionProgress) => void;

const UPLOADS_ENDPOINT = '/api/golden-voice/uploads';
const REGISTER_ENDPOINT = '/api/golden-voice/register';
const JSON_HEADERS = { 'content-type': 'application/json' };

/** Generic Arabic error shown when no safe server message is available. */
export const GENERIC_SUBMIT_ERROR = 'تعذّر إكمال التسجيل. المرجو المحاولة مرة أخرى.';
const VIDEO_REQUIRED_MESSAGE = 'المرجو رفع فيديو المشاركة.';
const UPLOAD_ERROR = 'تعذّر رفع الفيديو. المرجو المحاولة مرة أخرى.';
const CLIENT_NOT_CONFIGURED_ERROR =
  'خدمة رفع الفيديو غير مهيأة حالياً. المرجو المحاولة في وقت لاحق.';
const UPLOAD_CACHE_CONTROL = '3600';

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

/**
 * Build the Storage signed-upload URL exactly like `supabase-js`
 * (`/storage/v1/object/upload/sign/<bucket>/<path>?token=<token>`).
 */
export function buildSignedUploadUrl(
  supabaseUrl: string,
  bucket: string,
  objectPath: string,
  token: string,
): string {
  const base = supabaseUrl.replace(/\/+$/, '');
  const cleanPath = objectPath.replace(/^\/|\/$/g, '').replace(/\/+/g, '/');
  return `${base}/storage/v1/object/upload/sign/${bucket}/${cleanPath}?token=${encodeURIComponent(token)}`;
}

/** Clamp a raw byte ratio to a rounded 0–100 percentage. */
export function uploadPercent(loaded: number, total: number): number {
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(loaded)) {
    return 0;
  }

  const percent = (loaded / total) * 100;
  if (!Number.isFinite(percent)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(percent)));
}

/**
 * Pick the denominator for upload progress.
 *
 * This request is cross-origin and carries extra headers plus an upload
 * listener, so the browser issues a CORS preflight. In that situation some
 * browsers do not expose the request-body size: `lengthComputable` is `false`
 * and `total` is `0`. The previous code only updated progress when
 * `lengthComputable` was true, so the bar stayed at 0% and only the final
 * `onload` fired. We still know the real transmitted bytes (`event.loaded`) and
 * the file size, so fall back to the file size instead of dropping the update.
 */
export function resolveUploadTotal(
  lengthComputable: boolean,
  eventTotal: number,
  fileSize: number,
): number {
  if (lengthComputable && Number.isFinite(eventTotal) && eventTotal > 0) {
    return eventTotal;
  }

  return Number.isFinite(fileSize) && fileSize > 0 ? fileSize : 0;
}

/**
 * Resolve the canonical MIME type sent to Storage. The extension is
 * authoritative (the file was already accepted as a supported video format),
 * which also handles browsers that report an empty `file.type` for Matroska or
 * AVI. This value must stay within the bucket's `allowed_mime_types`.
 */
export function resolveVideoContentType(file: File): string {
  const byExtension = getVideoMimeForExtension(getFileExtension(file.name));
  if (byExtension) {
    return byExtension;
  }

  const type = file.type.trim().toLowerCase();
  return isAcceptedVideoMime(type) ? type : 'video/mp4';
}

/**
 * Upload the file to the signed URL with real byte-level progress.
 *
 * `supabase-js`'s `uploadToSignedUrl` uses `fetch`, which exposes no upload
 * progress. This performs the same signed request through `XMLHttpRequest`,
 * whose upload progress events give the actual transmitted-bytes ratio.
 *
 * The file is sent as the raw request body. Supabase Storage parses the signed
 * upload route and the regular upload route with the same pipeline, and raw
 * bodies are supported there; the previous hand-built multipart body was
 * rejected because the `Blob` type is lowercased, so the boundary in the
 * `Content-Type` header no longer matched the boundary in the body
 * ("Unexpected end of multipart data"). Sending the raw `File` lets the browser
 * manage framing and set `Content-Length` from the known size, which also keeps
 * upload progress computable. The security model is unchanged: the upload still
 * targets one server-issued, non-guessable object path with `upsert: false`.
 */
export function uploadToSignedUrlWithProgress(
  upload: SignedUpload,
  file: File,
  onPercent: (percent: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!supabaseUrl || !anonKey) {
    return Promise.reject(new Error(CLIENT_NOT_CONFIGURED_ERROR));
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', buildSignedUploadUrl(supabaseUrl, upload.bucket, upload.path, upload.token), true);
    xhr.setRequestHeader('apikey', anonKey);
    xhr.setRequestHeader('Authorization', `Bearer ${anonKey}`);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.setRequestHeader('cache-control', `max-age=${UPLOAD_CACHE_CONTROL}`);
    xhr.setRequestHeader('content-type', resolveVideoContentType(file));

    if (signal) {
      if (signal.aborted) {
        reject(new Error('aborted'));
        return;
      }
      signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }

    // Attach upload listeners before send() or no upload progress is emitted.
    xhr.upload.addEventListener(
      'progress',
      (event) => {
        const total = resolveUploadTotal(event.lengthComputable, event.total, file.size);
        if (total > 0) {
          onPercent(uploadPercent(event.loaded, total));
        }
      },
      false,
    );

    // The body has been fully transmitted once the upload emits `load`.
    xhr.upload.addEventListener('load', () => onPercent(100), false);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onPercent(100);
        resolve();
      } else {
        reject(new Error(UPLOAD_ERROR));
      }
    };

    xhr.onerror = () => reject(new Error(UPLOAD_ERROR));
    xhr.onabort = () => reject(new Error(UPLOAD_ERROR));
    xhr.ontimeout = () => reject(new Error(UPLOAD_ERROR));

    xhr.send(file);
  });
}

/** POST the registration payload and surface any safe Arabic server message. */
async function register(payload: Record<string, unknown>, signal?: AbortSignal): Promise<void> {
  const response = await fetch(REGISTER_ENDPOINT, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
    signal,
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
 *   2. upload the video straight to the private bucket with real progress,
 *   3. register with the resulting object path, which the server re-validates.
 * `region` inside Beni Mellal-Khenifra: register without a video and report a
 * plain processing state (no upload percentage).
 *
 * The server performs the authoritative validation and is the only component
 * allowed to write to the database with privileged credentials.
 */
export async function submitGoldenVoiceRegistration(
  values: GoldenVoiceSubmissionValues,
  video: SelectedVideo | null,
  onProgress?: OnSubmissionProgress,
  signal?: AbortSignal,
): Promise<void> {
  const report = onProgress ?? (() => undefined);

  if (values.region === OTHER_REGION) {
    if (!video) {
      throw new Error(VIDEO_REQUIRED_MESSAGE);
    }

    const upload = await createSignedUpload(resolveVideoContentType(video.file));

    report({ phase: 'uploading', percent: 0 });
    await uploadToSignedUrlWithProgress(
      upload,
      video.file,
      (percent) => {
        report({ phase: 'uploading', percent });
      },
      signal,
    );

    report({ phase: 'processing', percent: 100 });
    await register({ ...values, videoPath: upload.path }, signal);
    return;
  }

  report({ phase: 'processing', percent: 0 });
  await register({ ...values }, signal);
}
