import { adminFetch, readAdminError } from './adminApi';
import type { ProductInput } from '@/data/productValidation';

/** A managed product as returned by the admin API. */
export interface AdminProduct {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly category: string;
  readonly price: number;
  readonly compareAtPrice: number | null;
  readonly isAvailable: boolean;
  readonly shortDescription: string | null;
  readonly description: string | null;
  readonly additionalInformation: { label: string; value: string }[];
  readonly tags: string[];
  readonly imageUrl: string | null;
  readonly isFeatured: boolean;
  readonly isBestSeller: boolean;
  readonly isNew: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const ENDPOINT = '/api/admin/products';
const UPLOAD_ENDPOINT = '/api/admin/product-image-uploads';

const LOAD_ERROR = 'تعذّر تحميل المنتجات. المرجو المحاولة مرة أخرى.';
const CREATE_ERROR = 'تعذّر إضافة المنتج. المرجو المحاولة مرة أخرى.';
const UPDATE_ERROR = 'تعذّر تحديث المنتج. المرجو المحاولة مرة أخرى.';
const DELETE_ERROR = 'تعذّر حذف المنتج. المرجو المحاولة مرة أخرى.';
const IMAGE_ERROR = 'تعذّر رفع الصورة. المرجو المحاولة مرة أخرى.';
const IMAGE_CONFIG_ERROR = 'خدمة رفع الصور غير مهيأة حالياً. المرجو المحاولة لاحقاً.';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** List all managed products (newest first). */
export async function listProducts(): Promise<AdminProduct[]> {
  const response = await adminFetch(ENDPOINT);
  if (!response.ok) {
    throw await readAdminError(response, LOAD_ERROR);
  }
  const payload = (await response.json()) as { data?: AdminProduct[] };
  return Array.isArray(payload.data) ? payload.data : [];
}

/** Total number of managed products (for the dashboard metric). */
export async function countProducts(): Promise<number> {
  return (await listProducts()).length;
}

/** Create a product; returns the stored record. */
export async function createProduct(input: ProductInput): Promise<AdminProduct> {
  const response = await adminFetch(ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw await readAdminError(response, CREATE_ERROR);
  }
  const payload = (await response.json()) as { product: AdminProduct };
  return payload.product;
}

/** Update a product; returns the stored record. */
export async function updateProduct(id: string, input: ProductInput): Promise<AdminProduct> {
  const response = await adminFetch(ENDPOINT, {
    method: 'PATCH',
    body: JSON.stringify({ id, ...input }),
  });
  if (!response.ok) {
    throw await readAdminError(response, UPDATE_ERROR);
  }
  const payload = (await response.json()) as { product: AdminProduct };
  return payload.product;
}

/** Delete a product by id. */
export async function deleteProduct(id: string): Promise<void> {
  const params = new URLSearchParams({ id });
  const response = await adminFetch(`${ENDPOINT}?${params.toString()}`, { method: 'DELETE' });
  if (!response.ok) {
    throw await readAdminError(response, DELETE_ERROR);
  }
}

/** Build the Storage signed-upload URL for a direct browser PUT. */
function buildSignedUploadUrl(
  supabaseUrl: string,
  bucket: string,
  objectPath: string,
  token: string,
): string {
  const base = supabaseUrl.replace(/\/+$/, '');
  const cleanPath = objectPath.replace(/^\/|\/$/g, '').replace(/\/+/g, '/');
  return `${base}/storage/v1/object/upload/sign/${bucket}/${cleanPath}?token=${encodeURIComponent(token)}`;
}

/**
 * Upload a product image through a short-lived signed URL and return its public
 * URL. Validates type/size client-side; the server re-validates the MIME type.
 */
export async function uploadProductImage(file: File): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('صيغة الصورة غير مدعومة.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('حجم الصورة كبير جداً (الحد الأقصى 5 ميغابايت).');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!supabaseUrl || !anonKey) {
    throw new Error(IMAGE_CONFIG_ERROR);
  }

  const response = await adminFetch(UPLOAD_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ contentType: file.type }),
  });
  if (!response.ok) {
    throw await readAdminError(response, IMAGE_ERROR);
  }

  const data = (await response.json()) as {
    bucket?: string;
    path?: string;
    token?: string;
    publicUrl?: string;
  };
  if (!data.bucket || !data.path || !data.token || !data.publicUrl) {
    throw new Error(IMAGE_ERROR);
  }

  const upload = await fetch(
    buildSignedUploadUrl(supabaseUrl, data.bucket, data.path, data.token),
    {
      method: 'PUT',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'x-upsert': 'false',
        'content-type': file.type,
      },
      body: file,
    },
  );

  if (!upload.ok) {
    throw new Error(IMAGE_ERROR);
  }

  return data.publicUrl;
}
