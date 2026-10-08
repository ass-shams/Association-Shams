import ProductGrid from '@/components/store/ProductGrid';
import { getFeaturedProducts } from '@/data/productService';

/** Visual-only filter controls. No filtering logic yet (deferred to a later stage). */
const FILTERS = ['الكل', 'الأكثر طلباً', 'الجديد'] as const;

/** Featured products section with a visual filter row and the product grid. */
export default function FeaturedProducts() {
  const products = getFeaturedProducts();

  return (
    <section
      id="featured-products"
      className="section section--muted store-featured"
      aria-labelledby="store-featured-title"
    >
      <div className="container">
        <div className="store-head store-head--split">
          <div className="store-head__text">
            <p className="store-eyebrow">مختارات المتجر</p>
            <h2 id="store-featured-title" className="store-h2">
              منتجات مميزة
            </h2>
            <p className="store-head__lead">
              اكتشف مجموعة مختارة من منتجات متجر جمعية شمس.
            </p>
          </div>

          <div className="store-filters" role="group" aria-label="تصفية المنتجات">
            {FILTERS.map((filter, index) => (
              <button
                key={filter}
                type="button"
                className={index === 0 ? 'store-filter store-filter--active' : 'store-filter'}
                aria-pressed={index === 0}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <ProductGrid products={products} />
      </div>
    </section>
  );
}
