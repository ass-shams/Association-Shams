/**
 * Store data layer.
 *
 * This is the ONLY module the UI talks to for product data. Today it reads the
 * temporary local catalogue; later it can read from Supabase (or any Admin
 * Panel source) without changing a single component. Keep data access in here.
 */
import type { Product, ProductReview } from '@/types';
import { products, storeHeroImage, storePromoImage } from '@/data/productCatalog';

export { storeHeroImage, storePromoImage };

export const CURRENCY_LABEL = 'درهم';

/** Formats a numeric price for display (e.g. "150 درهم"). */
export function formatPrice(value: number): string {
  return `${value.toLocaleString('en-US')} ${CURRENCY_LABEL}`;
}

/** Every product in the catalogue. */
export function getAllProducts(): readonly Product[] {
  return products;
}

/** Single product by its public URL slug. */
export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

/** Single product by its stable id. */
export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}

/** Products flagged for the Store "منتجات مميزة" row. */
export function getFeaturedProducts(): readonly Product[] {
  return products.filter((product) => product.isFeatured);
}

/** Products flagged for the "الأكثر مبيعاً" row. */
export function getBestSellerProducts(): readonly Product[] {
  return products.filter((product) => product.isBestSeller);
}

/** Products flagged as new. */
export function getNewProducts(): readonly Product[] {
  return products.filter((product) => product.isNew);
}

/**
 * Related products for a Product Details page.
 *
 * Explicit `relatedSlugs` win; remaining slots are filled with same-category
 * products first, then the rest of the catalogue. Later the Admin Panel can
 * provide the relationship instead.
 */
export function getRelatedProducts(product: Product, limit = 4): readonly Product[] {
  const explicit = (product.relatedSlugs ?? [])
    .map((slug) => getProductBySlug(slug))
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
