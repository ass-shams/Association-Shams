/**
 * Store presentation images.
 *
 * Product data itself is managed in the dashboard and served from
 * `/api/products`; only the non-managed hero visual lives here.
 */
import image07 from '@/assets/store-images/Window Shopping-pana.webp';
import image07Small from '@/assets/store-images/Window Shopping-pana-800.webp';

/** Temporary visual for the Store hero. Replace with the final Store image. */
export const storeHeroImage = {
  src: image07,
  srcSet: `${image07Small} 800w, ${image07} 1200w`,
  sizes: '(min-width: 900px) 560px, (min-width: 640px) 520px, 92vw',
  alt: 'أعضاء جمعية شمس في لقاء جماعي أمام لافتة الجمعية',
} as const;
