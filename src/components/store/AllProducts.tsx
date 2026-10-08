import ProductGrid from '@/components/store/ProductGrid';
import { getAllProducts } from '@/data/productService';

/** Full catalogue grid. */
export default function AllProducts() {
  const products = getAllProducts();

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

        <ProductGrid products={products} />
      </div>
    </section>
  );
}
