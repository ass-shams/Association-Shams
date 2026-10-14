import { randomUUID } from 'node:crypto';

/** Dedicated table for managed announcements. */
export const ANNOUNCEMENTS_TABLE = 'announcements';

/** Public Storage bucket holding announcement images. */
export const ANNOUNCEMENT_IMAGES_BUCKET =
  process.env.ANNOUNCEMENT_IMAGE_BUCKET?.trim() || 'announcement-images';

/** Object-key prefix inside the bucket. */
export const ANNOUNCEMENT_IMAGE_PREFIX = 'announcements';

/** Columns selected for every announcement read. */
export const ANNOUNCEMENT_FIELDS =
  'id, title, slug, body, image_url, status, published_at, created_at, updated_at';

/** Canonical MIME types accepted for announcement images. */
export const ANNOUNCEMENT_IMAGE_MIME_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const ANNOUNCEMENT_IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const supabaseUrl = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '').replace(
  /\/+$/,
  '',
);

/** Public URL prefix for objects in the announcement-images bucket. */
export const ANNOUNCEMENT_IMAGE_PUBLIC_PREFIX = supabaseUrl
  ? `${supabaseUrl}/storage/v1/object/public/${ANNOUNCEMENT_IMAGES_BUCKET}/`
  : '';

export function getAnnouncementImageExtension(mime: string): string | null {
  return ANNOUNCEMENT_IMAGE_EXTENSIONS[mime.trim().toLowerCase()] ?? null;
}

/** True when a URL points at our own public announcement-images bucket. */
export function isAllowedAnnouncementImageUrl(url: string): boolean {
  return (
    ANNOUNCEMENT_IMAGE_PUBLIC_PREFIX.length > 0 &&
    url.startsWith(ANNOUNCEMENT_IMAGE_PUBLIC_PREFIX)
  );
}

/** Object key for a brand-new announcement image. */
export function buildAnnouncementImagePath(extension: string): string {
  return `${ANNOUNCEMENT_IMAGE_PREFIX}/${randomUUID()}.${extension}`;
}

/**
 * Extract the Storage object key from a public announcement-image URL.
 *
 * Returns `null` for any URL that does not point at our own bucket, so a
 * client-supplied URL can never be used to delete an arbitrary object.
 */
export function announcementImageObjectPath(url: string): string | null {
  if (!isAllowedAnnouncementImageUrl(url)) {
    return null;
  }
  const key = url.slice(ANNOUNCEMENT_IMAGE_PUBLIC_PREFIX.length).split('?')[0];
  return key && !key.includes('..') ? key : null;
}

/** URL-safe slug base with a short random suffix to guarantee uniqueness. */
export function buildAnnouncementSlug(title: string): string {
  const base =
    title
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120) || 'announcement';
  return `${base}-${randomUUID().replace(/-/g, '').slice(0, 8)}`;
}

export type AnnouncementStatus = 'draft' | 'published';

export interface AnnouncementDto {
  id: string;
  title: string;
  slug: string;
  body: string;
  imageUrl: string;
  status: AnnouncementStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Normalise a DB row to the client shape (snake_case → camelCase). */
export function mapAnnouncementRow(row: Record<string, unknown>): AnnouncementDto {
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    body: String(row.body),
    imageUrl: String(row.image_url),
    status: row.status === 'published' ? 'published' : 'draft',
    publishedAt: typeof row.published_at === 'string' ? row.published_at : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}
