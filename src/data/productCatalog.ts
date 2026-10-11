/**
 * Store presentation images.
 *
 * Product data itself is managed in the dashboard and served from
 * `/api/products`; only the non-managed hero and promotional visuals live here.
 */
import image03 from '@/assets/aboutimage/image03.jpg';
import image07 from '@/assets/aboutimage/image07.jpg';

/** Temporary visual for the Store hero. Replace with the final Store image. */
export const storeHeroImage = {
  src: image07,
  alt: 'أعضاء جمعية شمس في لقاء جماعي أمام لافتة الجمعية',
} as const;

/** Temporary visual for the promotional banner. Replace when ready. */
export const storePromoImage = {
  src: image03,
  alt: 'مستفيدون في فضاء تعلم تابع لجمعية شمس',
} as const;
