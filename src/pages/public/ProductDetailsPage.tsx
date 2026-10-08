import { Link, useParams } from 'react-router-dom';
import Breadcrumb from '@/components/Breadcrumb';
import ProductGallery from '@/components/store/ProductGallery';
import ProductInfo from '@/components/store/ProductInfo';
import ProductMeta from '@/components/store/ProductMeta';
import ProductTabs from '@/components/store/ProductTabs';
import RelatedProducts from '@/components/store/RelatedProducts';
import { getProductBySlug, getRelatedProducts } from '@/data/productService';

/**
 * Dynamic Product Details page. Reads the product from the slug in the URL via
 * the product service, so a single component renders every product. Product
 * content is never hardcoded here — it all comes from the data layer.
 *
 * Cart, checkout and review submission are intentionally not implemented yet.
 */
export default function ProductDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const product = slug ? getProductBySlug(slug) : undefined;

  if (!product) {
    return (
      <section className="section section--default section--pad-default">
        <div className="container">
          <div className="error-box">
            <h1>المنتج غير موجود</h1>
            <p>عذراً، لم نتمكن من العثور على المنتج المطلوب. ربما تمت إزالته أو تغيّر رابطه.</p>
            <Link className="error-link" to="/store">
              العودة إلى المتجر
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const relatedProducts = getRelatedProducts(product, 4);

  return (
    <>
      <section className="section section--default pd-section">
        <div className="container">
          <Breadcrumb
            items={[
              { label: 'الرئيسية', to: '/' },
              { label: 'المتجر', to: '/store' },
              { label: product.name },
            ]}
          />

          <div className="pd-layout">
            <div className="pd-layout__gallery">
              <ProductGallery images={product.images} productName={product.name} />
            </div>
            <div className="pd-layout__info">
              <ProductInfo product={product} />
            </div>
          </div>

          <ProductMeta product={product} />
        </div>
      </section>

      <section className="section section--muted pd-tabs-section">
        <div className="container">
          <ProductTabs product={product} />
        </div>
      </section>

      <RelatedProducts products={relatedProducts} />
    </>
  );
}
