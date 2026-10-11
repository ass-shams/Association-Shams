/**
 * Store presentation images.
 *
 * Product data itself is managed in the dashboard and served from
 * `/api/products`; only the non-managed hero visual lives here.
 */
import image07 from '@/assets/store-images/Window Shopping-pana.webp';

/** Temporary visual for the Store hero. Replace with the final Store image. */
export const storeHeroImage = {
  src: image07,
  alt: 'أعضاء جمعية شمس في لقاء جماعي أمام لافتة الجمعية',
} as const;
