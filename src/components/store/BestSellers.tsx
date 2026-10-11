import ProductGrid from '@/components/store/ProductGrid';
import { getBestSellerProducts, useProducts } from '@/data/productService';

/** Best sellers row — same minimal card, with a subtle rank marker. */
export default function BestSellers() {
  const { products, loading, error } = useProducts();

  const available = products.filter((product) => product.stockStatus !== 'out_of_stock');
  const flagged = getBestSellerProducts(products);
  const shown = flagged.length > 0 ? flagged : available.slice(0, 4);

  return (
    <section className="section section--muted store-best" aria-labelledby="store-best-title">
      <div className="container">
        <div className="store-head">
          <div className="store-head__text">
            <p className="store-eyebrow">اختيار الزوار</p>
            <h2 id="store-best-title" className="store-h2">
              الأكثر مبيعاً
            </h2>
            <p className="store-head__lead">
              المنتجات التي يطلبها زوار المتجر أكثر من غيرها.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="store-state" role="status">
            جارٍ تحميل المنتجات…
          </p>
        ) : error ? (
          <p className="store-state store-state--error" role="alert">
            {error}
          </p>
        ) : shown.length === 0 ? (
          <p className="store-state">لا توجد منتجات متاحة حالياً.</p>
        ) : (
          <ProductGrid products={shown} variant="ranked" />
        )}
      </div>
    </section>
  );
}
