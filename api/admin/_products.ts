import type { ServerResponse } from 'node:http';
import { methodNotAllowed, readJsonBody, sendJson } from '../_lib/http.js';
import type { ApiRequest } from '../_lib/http.js';
import { requireAdmin } from '../_lib/adminAuth.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';
import {
  PRODUCT_FIELDS,
  PRODUCTS_TABLE,
  buildProductSlug,
  isAllowedProductImageUrl,
  mapProductRow,
} from '../_lib/products.js';
import { parseProductBody } from '../../src/data/productValidation.js';
import type { ProductErrors, ProductInput } from '../../src/data/productValidation.js';

export const config = { maxDuration: 15 };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const INVALID_MESSAGE = 'المرجو التحقق من صحة البيانات المدخلة.';
const NOT_FOUND_MESSAGE = 'المنتج غير موجود.';
const LOAD_FAILED_MESSAGE = 'تعذّر تحميل المنتجات. المرجو المحاولة مرة أخرى.';
const CREATE_FAILED_MESSAGE = 'تعذّر إضافة المنتج. المرجو المحاولة مرة أخرى.';
const UPDATE_FAILED_MESSAGE = 'تعذّر تحديث المنتج. المرجو المحاولة مرة أخرى.';
const DELETE_FAILED_MESSAGE = 'تعذّر حذف المنتج. المرجو المحاولة مرة أخرى.';
const SERVICE_UNAVAILABLE_MESSAGE = 'الخدمة غير متاحة مؤقتاً.';

/** Convert a DB-shaped normalized input into the insert/update column map. */
function toColumns(input: ProductInput): Record<string, unknown> {
  return {
    name: input.name,
    category: input.category,
    price: input.price,
    compare_at_price: input.compareAtPrice,
    is_available: input.isAvailable,
    short_description: input.shortDescription,
    description: input.description,
    additional_information: input.additionalInformation,
    tags: input.tags,
    image_url: input.imageUrl,
    is_featured: input.isFeatured,
    is_best_seller: input.isBestSeller,
    is_new: input.isNew,
  };
}

/** Server-side image check: only our own bucket URL (or null) is accepted. */
function imageError(input: ProductInput): ProductErrors | null {
  if (input.imageUrl && !isAllowedProductImageUrl(input.imageUrl)) {
    return { imageUrl: 'رابط الصورة غير صالح.' };
  }
  return null;
}

/** Combine parse errors with the server-side image check. */
function mergeErrors(errors: ProductErrors, input: ProductInput): ProductErrors {
  const imageErrors = imageError(input);
  return imageErrors ? { ...errors, ...imageErrors } : errors;
}

/**
 * Admin store products endpoint (server-side authorization required).
 *
 *   GET              → all products (newest first)
 *   POST  { …fields } → create
 *   PATCH { id, …fields } → update
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
    .from(PRODUCTS_TABLE)
    .select(PRODUCT_FIELDS)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('products: list failed', error.code ?? 'unknown');
    return sendJson(res, 500, { message: LOAD_FAILED_MESSAGE });
  }

  const rows = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  return sendJson(res, 200, { data: rows.map(mapProductRow) });
}

async function handleCreate(req: ApiRequest, res: ServerResponse) {
  const { input, errors } = parseProductBody(readJsonBody(req.body));
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

  const { data, error } = await client
    .from(PRODUCTS_TABLE)
    .insert({ ...toColumns(input), slug: buildProductSlug(input.name) })
    .select(PRODUCT_FIELDS)
    .maybeSingle();

  if (error || !data) {
    console.error('products: create failed', error?.code ?? 'unknown');
    return sendJson(res, 500, { message: CREATE_FAILED_MESSAGE });
  }

  return sendJson(res, 201, { product: mapProductRow(data as Record<string, unknown>) });
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

  const { input, errors } = parseProductBody(body);
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

  // The slug is intentionally not updated, so existing product URLs stay stable.
  const { data, error } = await client
    .from(PRODUCTS_TABLE)
    .update(toColumns(input))
    .eq('id', id)
    .select(PRODUCT_FIELDS)
    .maybeSingle();

  if (error) {
    console.error('products: update failed', error.code ?? 'unknown');
    return sendJson(res, 500, { message: UPDATE_FAILED_MESSAGE });
  }
  if (!data) {
    return sendJson(res, 404, { message: NOT_FOUND_MESSAGE });
  }

  return sendJson(res, 200, { product: mapProductRow(data as Record<string, unknown>) });
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
    .from(PRODUCTS_TABLE)
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('products: delete failed', error.code ?? 'unknown');
    return sendJson(res, 500, { message: DELETE_FAILED_MESSAGE });
  }
  if (!data) {
    return sendJson(res, 404, { message: NOT_FOUND_MESSAGE });
  }

  return sendJson(res, 200, { ok: true });
}
