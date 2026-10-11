import ProductGrid from '@/components/store/ProductGrid';
import { useProducts } from '@/data/productService';

/** Full catalogue grid, driven by the dashboard-managed products. */
export default function AllProducts() {
  const { products, loading, error } = useProducts();

  return (
    <section
      id="all-products"
      className="section section--default store-all"
      aria-labelledby="store-all-title"
    >
      <div className="container">
        <div className="store-head">
          <div className="store-head__text">
            <p className="store-eyebrow">الكتالوج</p>
            <h2 id="store-all-title" className="store-h2">
              جميع المنتجات
            </h2>
            <p className="store-head__lead">
              تصفح مختلف المنتجات والمواد التي توفرها جمعية شمس.
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
        ) : products.length === 0 ? (
          <p className="store-state">لا توجد منتجات متاحة حالياً.</p>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </section>
  );
}
