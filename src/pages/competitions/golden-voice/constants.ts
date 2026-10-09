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
 * Video formats the server is able to inspect and verify (duration + container).
 * Keep this list deliberately small and aligned with the private bucket's
 * `allowed_mime_types`. Other formats must be added here only after the
 * server-side parser is confirmed to support them.
 */
export const ACCEPTED_VIDEO_MIME_TYPES = ['video/mp4', 'video/webm'] as const;

/** File extensions matching `ACCEPTED_VIDEO_MIME_TYPES`, used for validation. */
export const ACCEPTED_VIDEO_EXTENSIONS = ['mp4', 'webm'] as const;

/**
 * Maximum accepted video size in bytes (200 MB). Chosen as a generous ceiling
 * for a short performance video while keeping server-side processing bounded.
 * Override on the server with `GOLDEN_VOICE_MAX_VIDEO_BYTES`.
 */
export const VIDEO_MAX_BYTES = 200 * 1024 * 1024;

/** Value for the file input `accept` attribute. */
export const ACCEPT_VIDEO_ATTRIBUTE = ACCEPTED_VIDEO_MIME_TYPES.join(',');
