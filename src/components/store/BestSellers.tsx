import ProductGrid from '@/components/store/ProductGrid';
import { getBestSellerProducts } from '@/data/productService';

/** Best sellers row — same minimal card, with a subtle rank marker. */
export default function BestSellers() {
  const products = getBestSellerProducts();

  return (
    <section
      className="section section--muted store-best"
      aria-labelledby="store-best-title"
    >
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

        <ProductGrid products={products} variant="ranked" />
      </div>
    </section>
  );
}
