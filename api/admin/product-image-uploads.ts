import type { ServerResponse } from 'node:http';
import { methodNotAllowed, readJsonBody, sendJson } from '../_lib/http.js';
import type { ApiRequest } from '../_lib/http.js';
import { requireAdmin } from '../_lib/adminAuth.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';
import {
  PRODUCT_IMAGES_BUCKET,
  PRODUCT_IMAGE_PUBLIC_PREFIX,
  buildProductImagePath,
  getProductImageExtension,
} from '../_lib/products.js';

export const config = { maxDuration: 15 };

const SERVICE_UNAVAILABLE_MESSAGE = 'الخدمة غير متاحة مؤقتاً.';
const UNSUPPORTED_MESSAGE = 'صيغة الصورة غير مدعومة.';
const UPLOAD_FAILED_MESSAGE = 'تعذّر بدء عملية رفع الصورة. المرجو المحاولة مرة أخرى.';

/**
 * Admin endpoint that issues a short-lived signed upload URL for a new product
 * image. `requireAdmin` runs first; the browser uploads the file directly to the
 * public `product-images` bucket, keeping large files out of the function body.
 *
 *   POST { contentType } → { bucket, path, token, publicUrl }
 */
export default async function handler(req: ApiRequest, res: ServerResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) {
    return;
  }

  if (req.method !== 'POST') {
    return methodNotAllowed(res, 'POST');
  }

  const body = readJsonBody(req.body);
  const contentType =
    body && typeof body.contentType === 'string' ? body.contentType.trim().toLowerCase() : '';

  const extension = getProductImageExtension(contentType);
  if (!extension) {
    return sendJson(res, 415, { message: UNSUPPORTED_MESSAGE });
  }

  if (!PRODUCT_IMAGE_PUBLIC_PREFIX) {
    return sendJson(res, 503, { message: SERVICE_UNAVAILABLE_MESSAGE });
  }

  const objectPath = buildProductImagePath(extension);

  try {
    const adminClient = getSupabaseAdmin();
    const { data, error } = await adminClient.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .createSignedUploadUrl(objectPath, { upsert: false });

    if (error || !data) {
      console.error('product-image-uploads: signed url failed', error?.name ?? 'unknown');
      return sendJson(res, 500, { message: UPLOAD_FAILED_MESSAGE });
    }

    return sendJson(res, 200, {
      bucket: PRODUCT_IMAGES_BUCKET,
      path: data.path,
      token: data.token,
      publicUrl: `${PRODUCT_IMAGE_PUBLIC_PREFIX}${data.path}`,
    });
  } catch (error) {
    console.error(
      'product-image-uploads: handler threw',
      error instanceof Error ? error.name : 'unknown',
    );
    return sendJson(res, 500, { message: UPLOAD_FAILED_MESSAGE });
  }
}
