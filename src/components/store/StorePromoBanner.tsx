import { storePromoImage } from '@/data/productService';

/**
 * Promotional / editorial banner. Reusable later for a campaign, a special
 * collection or event-related products. Uses the association's temporary image.
 */
export default function StorePromoBanner() {
  return (
    <section className="section store-promo" aria-labelledby="store-promo-title">
      <div className="container">
        <div className="store-promo__inner">
          <div className="store-promo__content">
            <p className="store-eyebrow store-eyebrow--light">مجموعة خاصة</p>
            <h2 id="store-promo-title" className="store-promo__title">
              منتجات تحمل معنى
            </h2>
            <p className="store-promo__text">
              اكتشف مجموعتنا وكن جزءاً من أثر جمعية شمس للكفيف والمبصر.
            </p>
            <div className="store-promo__actions">
              <a className="btn btn--accent btn--lg" href="#all-products">
                اكتشف المجموعة
              </a>
            </div>
          </div>

          <div className="store-promo__media">
            <img
              src={storePromoImage.src}
              alt={storePromoImage.alt}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
