import ProductGrid from '@/components/store/ProductGrid';
import type { Product } from '@/types';

/** Related products — reuses the same ProductCard/ProductGrid as the Store. */
export default function RelatedProducts({ products }: { readonly products: readonly Product[] }) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="section section--default pd-related" aria-labelledby="pd-related-title">
      <div className="container">
        <div className="store-head">
          <div className="store-head__text">
            <p className="store-eyebrow">اكتشف المزيد</p>
            <h2 id="pd-related-title" className="store-h2">
              منتجات قد تعجبك
            </h2>
          </div>
        </div>

        <ProductGrid products={products} />
      </div>
    </section>
  );
}
