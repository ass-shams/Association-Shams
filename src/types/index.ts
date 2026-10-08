export type Role = 'visitor' | 'member' | 'admin'

export interface SessionUser {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  role: Role
  member_number: string | null
}

export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

export interface PaginatedResult<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
}

/**
 * Store domain types.
 *
 * These describe the shape the Admin Panel / database will eventually provide.
 * The UI only ever receives these through `src/data/productService.ts`, so the
 * local temporary data can be swapped for a real data source without touching
 * any component.
 */

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

export interface ProductImage {
  src: string
  alt: string
  /** Optional CSS object-position used when the gallery crops the image. */
  position?: string
}

export interface ProductAttribute {
  label: string
  value: string
}

export interface ProductReview {
  id: string
  author: string
  /** Whole number from 1 to 5. */
  rating: number
  /** ISO date (yyyy-mm-dd). */
  date: string
  comment: string
  images?: ProductImage[]
}

export interface Product {
  id: string
  slug: string
  name: string
  category: string
  images: ProductImage[]
  price: number
  compareAtPrice?: number
  shortDescription?: string
  /** Plain text; blank lines separate paragraphs. */
  description?: string
  additionalInformation?: ProductAttribute[]
  stock: number
  stockStatus: StockStatus
  sku?: string
  tags: string[]
  isFeatured?: boolean
  isNew?: boolean
  isBestSeller?: boolean
  reviews: ProductReview[]
  /** Explicit relationships; when omitted the service derives them. */
  relatedSlugs?: string[]
}
