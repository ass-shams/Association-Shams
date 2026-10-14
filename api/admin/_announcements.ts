import type { ServerResponse } from 'node:http';
import type { SupabaseClient } from '@supabase/supabase-js';
import { methodNotAllowed, readJsonBody, sendJson } from '../_lib/http.js';
import type { ApiRequest } from '../_lib/http.js';
import { requireAdmin } from '../_lib/adminAuth.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';
import {
  ANNOUNCEMENT_FIELDS,
  ANNOUNCEMENT_IMAGES_BUCKET,
  ANNOUNCEMENTS_TABLE,
  announcementImageObjectPath,
  buildAnnouncementSlug,
  isAllowedAnnouncementImageUrl,
  mapAnnouncementRow,
} from '../_lib/announcements.js';
import { parseAnnouncementBody } from '../../src/data/announcementValidation.js';
import type {
  AnnouncementErrors,
  AnnouncementInput,
} from '../../src/data/announcementValidation.js';

export const config = { maxDuration: 15 };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const INVALID_MESSAGE = 'المرجو التحقق من صحة البيانات المدخلة.';
const NOT_FOUND_MESSAGE = 'الإعلان غير موجود.';
const LOAD_FAILED_MESSAGE = 'تعذّر تحميل الإعلانات. المرجو المحاولة مرة أخرى.';
const CREATE_FAILED_MESSAGE = 'تعذّر إضافة الإعلان. المرجو المحاولة مرة أخرى.';
const UPDATE_FAILED_MESSAGE = 'تعذّر تحديث الإعلان. المرجو المحاولة مرة أخرى.';
const DELETE_FAILED_MESSAGE = 'تعذّر حذف الإعلان. المرجو المحاولة مرة أخرى.';
const SERVICE_UNAVAILABLE_MESSAGE = 'الخدمة غير متاحة مؤقتاً.';

/** Convert a validated input into the insert/update column map. */
function toColumns(input: AnnouncementInput, publishedAt: string | null): Record<string, unknown> {
  return {
    title: input.title,
    body: input.body,
    image_url: input.imageUrl,
    status: input.status,
    published_at: publishedAt,
  };
}

/** Server-side image check: only our own bucket URL is accepted. */
function imageError(input: AnnouncementInput): AnnouncementErrors | null {
  if (input.imageUrl && !isAllowedAnnouncementImageUrl(input.imageUrl)) {
    return { imageUrl: 'رابط الصورة غير صالح.' };
  }
  return null;
}

/** Combine parse errors with the server-side image check. */
function mergeErrors(errors: AnnouncementErrors, input: AnnouncementInput): AnnouncementErrors {
  const imageErrors = imageError(input);
  return imageErrors ? { ...errors, ...imageErrors } : errors;
}

/** The `published_at` to store when creating an announcement. */
function resolveCreatePublishedAt(input: AnnouncementInput, now: string): string | null {
  if (input.publishedAt) {
    return input.publishedAt;
  }
  return input.status === 'published' ? now : null;
}

/**
 * Delete an announcement image from Storage when it is no longer referenced.
 *
 * Best-effort: any failure (including a foreign/unknown URL) leaves the object
 * untouched and never fails the caller's request. The URL must belong to our own
 * public bucket before any object is removed.
 */
async function removeImageIfUnused(
  client: SupabaseClient,
  imageUrl: string,
  exceptId?: string,
): Promise<void> {
  const objectPath = announcementImageObjectPath(imageUrl);
  if (!objectPath) {
    return;
  }

  try {
    let query = client.from(ANNOUNCEMENTS_TABLE).select('id').eq('image_url', imageUrl);
    if (exceptId) {
      query = query.neq('id', exceptId);
    }
    const { data, error } = await query.limit(1);
    if (error) {
      return;
    }
    if (Array.isArray(data) && data.length > 0) {
      return;
    }
    await client.storage.from(ANNOUNCEMENT_IMAGES_BUCKET).remove([objectPath]);
  } catch {
    // Cleanup is best-effort only.
  }
}

/**
 * Admin announcements endpoint (server-side authorization required).
 *
 *   GET              → all announcements (newest first)
 *   POST  { …fields } → create
 *   PATCH { id, …fields } → edit content/status
 *   PATCH { id, status }  → publish / unpublish only
 *   DELETE ?id=<uuid> → delete
 *
 * `requireAdmin` verifies the bearer token and the `admin_users` allowlist
 * before any read or write. Every field is re-validated server-side.
 */
export default async function handler(req: ApiRequest, res: ServerResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) {
    return;
  }

  if (req.method === 'GET') {
    return handleGet(res);
  }
  if (req.method === 'POST') {
    return handleCreate(req, res);
  }
  if (req.method === 'PATCH') {
    return handleUpdate(req, res);
  }
  if (req.method === 'DELETE') {
    return handleDelete(req, res);
  }

  return methodNotAllowed(res, 'GET, POST, PATCH, DELETE');
}

async function handleGet(res: ServerResponse) {
  let client;
  try {
    client = getSupabaseAdmin();
  } catch {
    return sendJson(res, 503, { message: SERVICE_UNAVAILABLE_MESSAGE });
  }

  const { data, error } = await client
    .from(ANNOUNCEMENTS_TABLE)
    .select(ANNOUNCEMENT_FIELDS)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('announcements: list failed', error.code ?? 'unknown');
    return sendJson(res, 500, { message: LOAD_FAILED_MESSAGE });
  }

  const rows = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  return sendJson(res, 200, { data: rows.map(mapAnnouncementRow) });
}

async function handleCreate(req: ApiRequest, res: ServerResponse) {
  const { input, errors } = parseAnnouncementBody(readJsonBody(req.body));
  if (!input) {
    return sendJson(res, 400, { message: INVALID_MESSAGE });
  }
  const merged = mergeErrors(errors, input);
  if (Object.keys(merged).length > 0) {
    return sendJson(res, 400, { message: INVALID_MESSAGE });
  }

  let client;
  try {
    client = getSupabaseAdmin();
  } catch {
    return sendJson(res, 503, { message: SERVICE_UNAVAILABLE_MESSAGE });
  }

  const now = new Date().toISOString();
  const columns = toColumns(input, resolveCreatePublishedAt(input, now));

  const { data, error } = await client
    .from(ANNOUNCEMENTS_TABLE)
    .insert({ ...columns, slug: buildAnnouncementSlug(input.title) })
    .select(ANNOUNCEMENT_FIELDS)
    .maybeSingle();

  if (error || !data) {
    console.error('announcements: create failed', error?.code ?? 'unknown');
    return sendJson(res, 500, { message: CREATE_FAILED_MESSAGE });
  }

  return sendJson(res, 201, {
    announcement: mapAnnouncementRow(data as Record<string, unknown>),
  });
}

async function handleUpdate(req: ApiRequest, res: ServerResponse) {
  const body = readJsonBody(req.body);
  if (!body) {
    return sendJson(res, 400, { message: INVALID_MESSAGE });
  }

  const id = typeof body.id === 'string' ? body.id.trim() : '';
  if (!UUID_PATTERN.test(id)) {
    return sendJson(res, 400, { message: INVALID_MESSAGE });
  }

  let client;
  try {
    client = getSupabaseAdmin();
  } catch {
    return sendJson(res, 503, { message: SERVICE_UNAVAILABLE_MESSAGE });
  }

  const { data: existing, error: fetchError } = await client
    .from(ANNOUNCEMENTS_TABLE)
    .select(ANNOUNCEMENT_FIELDS)
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    console.error('announcements: update lookup failed', fetchError.code ?? 'unknown');
    return sendJson(res, 500, { message: UPDATE_FAILED_MESSAGE });
  }
  if (!existing) {
    return sendJson(res, 404, { message: NOT_FOUND_MESSAGE });
  }

  const row = existing as Record<string, unknown>;
  const existingPublishedAt =
    typeof row.published_at === 'string' ? row.published_at : null;

  // Status-only update (publish / unpublish) when no content fields are sent.
  if (body.title === undefined && body.body === undefined && body.imageUrl === undefined) {
    const status = body.status === 'published' ? 'published' : body.status === 'draft' ? 'draft' : null;
    if (!status) {
      return sendJson(res, 400, { message: INVALID_MESSAGE });
    }

    const publishedAt =
      status === 'published' ? (existingPublishedAt ?? new Date().toISOString()) : existingPublishedAt;

    const { data, error } = await client
      .from(ANNOUNCEMENTS_TABLE)
      .update({ status, published_at: publishedAt })
      .eq('id', id)
      .select(ANNOUNCEMENT_FIELDS)
      .maybeSingle();

    if (error) {
      console.error('announcements: status update failed', error.code ?? 'unknown');
      return sendJson(res, 500, { message: UPDATE_FAILED_MESSAGE });
    }
    if (!data) {
      return sendJson(res, 404, { message: NOT_FOUND_MESSAGE });
    }

    return sendJson(res, 200, {
      announcement: mapAnnouncementRow(data as Record<string, unknown>),
    });
  }

  // Full content update.
  const { input, errors } = parseAnnouncementBody(body);
  if (!input) {
    return sendJson(res, 400, { message: INVALID_MESSAGE });
  }
  const merged = mergeErrors(errors, input);
  if (Object.keys(merged).length > 0) {
    return sendJson(res, 400, { message: INVALID_MESSAGE });
  }

  let publishedAt: string | null;
  if (row.status === 'published' && existingPublishedAt) {
    // Preserve the original publication date of an already-published item.
    publishedAt = existingPublishedAt;
  } else if (input.status === 'published') {
    publishedAt = input.publishedAt ?? new Date().toISOString();
  } else {
    publishedAt = input.publishedAt;
  }

  const oldImageUrl = typeof row.image_url === 'string' ? row.image_url : '';

  // The slug is intentionally not updated, so existing URLs stay stable.
  const { data, error } = await client
    .from(ANNOUNCEMENTS_TABLE)
    .update(toColumns(input, publishedAt))
    .eq('id', id)
    .select(ANNOUNCEMENT_FIELDS)
    .maybeSingle();

  if (error) {
    console.error('announcements: update failed', error.code ?? 'unknown');
    return sendJson(res, 500, { message: UPDATE_FAILED_MESSAGE });
  }
  if (!data) {
    return sendJson(res, 404, { message: NOT_FOUND_MESSAGE });
  }

  if (oldImageUrl && oldImageUrl !== input.imageUrl) {
    await removeImageIfUnused(client, oldImageUrl, id);
  }

  return sendJson(res, 200, {
    announcement: mapAnnouncementRow(data as Record<string, unknown>),
  });
}

async function handleDelete(req: ApiRequest, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const body = readJsonBody(req.body);
  const id =
    (url.searchParams.get('id') ?? (typeof body?.id === 'string' ? body.id : '')).trim();

  if (!UUID_PATTERN.test(id)) {
    return sendJson(res, 400, { message: INVALID_MESSAGE });
  }

  let client;
  try {
    client = getSupabaseAdmin();
  } catch {
    return sendJson(res, 503, { message: SERVICE_UNAVAILABLE_MESSAGE });
  }

  const { data, error } = await client
    .from(ANNOUNCEMENTS_TABLE)
    .delete()
    .eq('id', id)
    .select('id, image_url')
    .maybeSingle();

  if (error) {
    console.error('announcements: delete failed', error.code ?? 'unknown');
    return sendJson(res, 500, { message: DELETE_FAILED_MESSAGE });
  }
  if (!data) {
    return sendJson(res, 404, { message: NOT_FOUND_MESSAGE });
  }

  const imageUrl =
    typeof (data as Record<string, unknown>).image_url === 'string'
      ? ((data as Record<string, unknown>).image_url as string)
      : '';
  if (imageUrl) {
    await removeImageIfUnused(client, imageUrl);
  }

  return sendJson(res, 200, { ok: true });
}
