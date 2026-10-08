import { storeHeroImage } from '@/data/productService';

/** Store hero — eyebrow, heading, supporting text, CTA and a temporary visual. */
export default function StoreHero() {
  return (
    <section className="section store-hero" aria-labelledby="store-hero-title">
      <div className="container">
        <div className="store-hero__inner">
          <div className="store-hero__content">
            <p className="store-eyebrow">متجر جمعية شمس</p>
            <h1 id="store-hero-title" className="store-hero__title">
              منتجات تدعم رسالتنا
            </h1>
            <p className="store-hero__lead">
              اكتشف المنتجات والمواد التي تقدمها جمعية شمس للكفيف والمبصر، وساهم من خلال
              اقتنائها في دعم أنشطتها وبرامجها المجتمعية.
            </p>
            <div className="store-hero__actions">
              <a className="btn btn--primary btn--lg" href="#featured-products">
                تصفح المنتجات
              </a>
              <a className="btn btn--outline btn--lg" href="/membership">
                انخرط معنا
              </a>
            </div>
          </div>

          <div className="store-hero__media">
            <img
              src={storeHeroImage.src}
              alt={storeHeroImage.alt}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
