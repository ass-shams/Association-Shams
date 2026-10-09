/**
 * Golden Voice registration — shared constants.
 *
 * These values are the single source of truth for both the browser form and
 * the serverless submission endpoints. The region identifiers must match the
 * CHECK constraint on `public.golden_voice_registrations.region`.
 */

export const REGION_OPTIONS = [
  { value: 'beni_mellal_khenifra', label: 'جهة بني ملال خنيفرة' },
  { value: 'other', label: 'جهة أخرى' },
] as const;

export type RegionValue = (typeof REGION_OPTIONS)[number]['value'];

/** Participants from this region do not need to attach a video. */
export const BENI_MELLAL_KHENIFRA_REGION: RegionValue = 'beni_mellal_khenifra';

/** Participants from any other region must attach a video. */
export const OTHER_REGION: RegionValue = 'other';

/**
 * Server-side technical maximum accepted video duration in seconds (4 minutes).
 *
 * The website instructs visitors to keep videos within 3 minutes, but the
 * server tolerates a little extra and rejects anything longer than this value.
 */
export const VIDEO_MAX_DURATION_SECONDS = 240;

/**
 * Maximum accepted video size in bytes (200 MB). Chosen as a generous ceiling
 * for a short performance video while keeping server-side processing bounded.
 * Override on the server with `GOLDEN_VOICE_MAX_VIDEO_BYTES`.
 */
export const VIDEO_MAX_BYTES = 200 * 1024 * 1024;

/**
 * Video containers the server can inspect for structure and duration, mapped to
 * the canonical MIME type and file extension used across the app.
 *
 * `video/x-matroska` and `video/x-msvideo` are the conventional MIME types for
 * Matroska and AVI; some browsers report an empty type for them, which is why
 * the extension is also part of the acceptance check.
 *
 * MPEG program/transport streams (`.mpeg`, `.mpg`) are intentionally excluded:
 * their duration cannot be read reliably from the container without decoding,
 * so they are rejected instead of being silently accepted.
 */
export const VIDEO_FORMATS = [
  { mime: 'video/mp4', extension: 'mp4' },
  { mime: 'video/quicktime', extension: 'mov' },
  { mime: 'video/x-m4v', extension: 'm4v' },
  { mime: 'video/3gpp', extension: '3gp' },
  { mime: 'video/3gpp2', extension: '3g2' },
  { mime: 'video/webm', extension: 'webm' },
  { mime: 'video/x-matroska', extension: 'mkv' },
  { mime: 'video/x-msvideo', extension: 'avi' },
] as const;

export type VideoMimeType = (typeof VIDEO_FORMATS)[number]['mime'];
export type VideoExtension = (typeof VIDEO_FORMATS)[number]['extension'];

/** Canonical MIME types accepted by the browser and the upload endpoint. */
export const ACCEPTED_VIDEO_MIME_TYPES: readonly string[] = VIDEO_FORMATS.map(
  (format) => format.mime,
);

/** File extensions matching `ACCEPTED_VIDEO_MIME_TYPES`. */
export const ACCEPTED_VIDEO_EXTENSIONS: readonly string[] = VIDEO_FORMATS.map(
  (format) => format.extension,
);

/** Value for the file input `accept` attribute (MIME types and extensions). */
export const ACCEPT_VIDEO_ATTRIBUTE = [
  ...ACCEPTED_VIDEO_MIME_TYPES,
  ...ACCEPTED_VIDEO_EXTENSIONS.map((extension) => `.${extension}`),
].join(',');

/** Human-readable list of supported formats for participant instructions. */
export const SUPPORTED_FORMATS_LABEL = 'MP4، MOV، M4V، 3GP، WebM، MKV، AVI';

/** Maximum file size rounded to whole megabytes, for participant instructions. */
export const VIDEO_MAX_MB_LABEL = `${Math.round(VIDEO_MAX_BYTES / (1024 * 1024))} ميغابايت`;
