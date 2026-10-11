import { randomUUID } from 'node:crypto';

/** Dedicated table for managed store products. */
export const PRODUCTS_TABLE = 'products';

/** Public Storage bucket holding product images. */
export const PRODUCT_IMAGES_BUCKET =
  process.env.PRODUCT_IMAGE_BUCKET?.trim() || 'product-images';

/** Object-key prefix inside the bucket. */
export const PRODUCT_IMAGE_PREFIX = 'products';

/** Columns selected for every product read. */
export const PRODUCT_FIELDS =
  'id, name, slug, category, price, compare_at_price, is_available, short_description, description, additional_information, tags, image_url, is_featured, is_best_seller, is_new, created_at, updated_at';

/** Canonical MIME types accepted for product images. */
export const PRODUCT_IMAGE_MIME_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const PRODUCT_IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const supabaseUrl = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '').replace(
  /\/+$/,
  '',
);

/** Public URL prefix for objects in the product-images bucket. */
export const PRODUCT_IMAGE_PUBLIC_PREFIX = supabaseUrl
  ? `${supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`
  : '';

export function getProductImageExtension(mime: string): string | null {
  return PRODUCT_IMAGE_EXTENSIONS[mime.trim().toLowerCase()] ?? null;
}

/** True when a URL points at our own public product-images bucket. */
export function isAllowedProductImageUrl(url: string): boolean {
  return PRODUCT_IMAGE_PUBLIC_PREFIX.length > 0 && url.startsWith(PRODUCT_IMAGE_PUBLIC_PREFIX);
}

/** Object key for a brand-new product image. */
export function buildProductImagePath(extension: string): string {
  return `${PRODUCT_IMAGE_PREFIX}/${randomUUID()}.${extension}`;
}

/** URL-safe slug base with a short random suffix to guarantee uniqueness. */
export function buildProductSlug(name: string): string {
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'product';
  return `${base}-${randomUUID().replace(/-/g, '').slice(0, 8)}`;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export interface AdditionalInfoEntry {
  label: string;
  value: string;
}

export interface ProductDto {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  compareAtPrice: number | null;
  isAvailable: boolean;
  shortDescription: string | null;
  description: string | null;
  additionalInformation: AdditionalInfoEntry[];
  tags: string[];
  imageUrl: string | null;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Normalise a DB row to the client shape (snake_case → camelCase). */
export function mapProductRow(row: Record<string, unknown>): ProductDto {
  const additional = Array.isArray(row.additional_information)
    ? (row.additional_information as unknown[])
        .filter(
          (entry): entry is AdditionalInfoEntry =>
            Boolean(entry) &&
            typeof entry === 'object' &&
            typeof (entry as AdditionalInfoEntry).label === 'string' &&
            typeof (entry as AdditionalInfoEntry).value === 'string',
        )
        .map((entry) => ({ label: entry.label, value: entry.value }))
    : [];

  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    category: String(row.category),
    price: toNumber(row.price) ?? 0,
    compareAtPrice: toNumber(row.compare_at_price),
    isAvailable: row.is_available === true,
    shortDescription: typeof row.short_description === 'string' ? row.short_description : null,
    description: typeof row.description === 'string' ? row.description : null,
    additionalInformation: additional,
    tags: Array.isArray(row.tags)
      ? (row.tags as unknown[]).filter((tag): tag is string => typeof tag === 'string')
      : [],
    imageUrl: typeof row.image_url === 'string' ? row.image_url : null,
    isFeatured: row.is_featured === true,
    isBestSeller: row.is_best_seller === true,
    isNew: row.is_new === true,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}
