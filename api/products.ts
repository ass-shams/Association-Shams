import type { ServerResponse } from 'node:http';
import { methodNotAllowed, sendJson } from './_lib/http.js';
import type { ApiRequest } from './_lib/http.js';
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';
import { PRODUCT_FIELDS, PRODUCTS_TABLE, mapProductRow } from './_lib/products.js';

export const config = { maxDuration: 15 };

const SERVICE_UNAVAILABLE_MESSAGE = 'الخدمة غير متاحة مؤقتاً.';

/**
 * Public read-only store products endpoint.
 *
 * Returns the managed catalogue for the storefront. The service role reads the
 * RLS-protected table server-side; the browser never queries it directly and
 * cannot create, edit or delete products.
 */
export default async function handler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, 'GET');
  }

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
    console.error('products: public list failed', error.code ?? 'unknown');
    return sendJson(res, 500, { message: SERVICE_UNAVAILABLE_MESSAGE });
  }

  const rows = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  return sendJson(res, 200, { data: rows.map(mapProductRow) });
}
