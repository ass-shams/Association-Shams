/**
 * Store data layer.
 *
 * This is the ONLY module the UI talks to for product data. It reads the
 * dashboard-managed catalogue from `/api/products` (server-side service role)
 * and exposes it through a cached `useProducts()` hook, so the public store
 * always shows the same products the dashboard manages.
 */
import { useCallback, useEffect, useState } from 'react';
import type { Product, ProductImage, ProductReview } from '@/types';
import { storeHeroImage, storePromoImage } from '@/data/productCatalog';

export { storeHeroImage, storePromoImage };

export const CURRENCY_LABEL = 'درهم';

/** Formats a numeric price for display (e.g. "150 درهم"). */
export function formatPrice(value: number): string {
  return `${value.toLocaleString('en-US')} ${CURRENCY_LABEL}`;
}

/** Shape returned by the public `/api/products` endpoint. */
export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  compareAtPrice: number | null;
  isAvailable: boolean;
  shortDescription: string | null;
  description: string | null;
  additionalInformation: { label: string; value: string }[];
  tags: string[];
  imageUrl: string | null;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  createdAt: string;
  updatedAt: string;
}

const ENDPOINT = '/api/products';
const LOAD_ERROR = 'تعذّر تحميل المنتجات. المرجو المحاولة مرة أخرى.';

/** Map a managed product to the storefront `Product` shape. */
export function mapApiProduct(item: ApiProduct): Product {
  const image: ProductImage | null = item.imageUrl
    ? { src: item.imageUrl, alt: item.name }
    : null;

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    category: item.category,
    images: image ? [image] : [],
    price: item.price,
    compareAtPrice: item.compareAtPrice ?? undefined,
    shortDescription: item.shortDescription ?? undefined,
    description: item.description ?? undefined,
    additionalInformation: item.additionalInformation.length
      ? item.additionalInformation
      : undefined,
    stock: item.isAvailable ? 1 : 0,
    stockStatus: item.isAvailable ? 'in_stock' : 'out_of_stock',
    tags: item.tags,
    isFeatured: item.isFeatured,
    isBestSeller: item.isBestSeller,
    isNew: item.isNew,
    reviews: [],
  };
}

let cache: Product[] | null = null;
let inflight: Promise<Product[]> | null = null;

/** Fetch the catalogue once, sharing the result across every store section. */
export async function fetchProducts(force = false): Promise<Product[]> {
  if (!force && cache) {
    return cache;
  }
  if (!force && inflight) {
    return inflight;
  }

  inflight = (async () => {
    const response = await fetch(ENDPOINT, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(LOAD_ERROR);
    }
    const payload = (await response.json()) as { data?: ApiProduct[] };
    const list = (payload.data ?? []).map(mapApiProduct);
    cache = list;
    return list;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export interface ProductsState {
  readonly products: Product[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly reload: () => void;
}

/** Subscribe to the managed catalogue with loading/error state. */
export function useProducts(): ProductsState {
  const [products, setProducts] = useState<Product[]>(cache ?? []);
  const [loading, setLoading] = useState(cache === null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((force: boolean) => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchProducts(force)
      .then((list) => {
        if (active) {
          setProducts(list);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : LOAD_ERROR);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => load(false), [load]);

  const reload = useCallback(() => {
    load(true);
  }, [load]);

  return { products, loading, error, reload };
}

/** Products flagged for the Store "منتجات مميزة" row. */
export function getFeaturedProducts(products: readonly Product[]): readonly Product[] {
  return products.filter((product) => product.isFeatured && product.stockStatus !== 'out_of_stock');
}

/** Products flagged for the "الأكثر مبيعاً" row. */
export function getBestSellerProducts(products: readonly Product[]): readonly Product[] {
  return products.filter(
    (product) => product.isBestSeller && product.stockStatus !== 'out_of_stock',
  );
}

/**
 * Related products for a Product Details page.
 *
 * Explicit `relatedSlugs` win; remaining slots are filled with same-category
 * products first, then the rest of the catalogue.
 */
export function getRelatedProducts(
  products: readonly Product[],
  product: Product,
  limit = 4,
): readonly Product[] {
  const explicit = (product.relatedSlugs ?? [])
    .map((slug) => products.find((candidate) => candidate.slug === slug))
    .filter((candidate): candidate is Product => {
      if (!candidate) {
        return false;
      }
      return candidate.id !== product.id;
    });

  const sameCategory = products.filter(
    (candidate) => candidate.id !== product.id && candidate.category === product.category,
  );
  const others = products.filter(
    (candidate) => candidate.id !== product.id && candidate.category !== product.category,
  );

  const seen = new Set<string>();
  const result: Product[] = [];
  for (const candidate of [...explicit, ...sameCategory, ...others]) {
    if (seen.has(candidate.id)) continue;
    seen.add(candidate.id);
    result.push(candidate);
    if (result.length === limit) break;
  }

  return result;
}

/** Average star rating (0 when there are no reviews). */
export function getAverageRating(reviews: readonly ProductReview[]): number {
  if (reviews.length === 0) return 0;
  const total = reviews.reduce((sum, item) => sum + item.rating, 0);
  return total / reviews.length;
}

export interface RatingDistributionEntry {
  readonly stars: number;
  readonly count: number;
  readonly percentage: number;
}

/** Counts and percentages for the 5→1 star rows of the rating summary. */
export function getRatingDistribution(
  reviews: readonly ProductReview[],
): readonly RatingDistributionEntry[] {
  const total = reviews.length;
  return [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((item) => Math.round(item.rating) === stars).length;
    return { stars, count, percentage: total ? Math.round((count / total) * 100) : 0 };
  });
}
