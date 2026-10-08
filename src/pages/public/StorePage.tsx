import FinalCTA from '@/components/finalCTA';
import AllProducts from '@/components/store/AllProducts';
import BestSellers from '@/components/store/BestSellers';
import FeaturedProducts from '@/components/store/FeaturedProducts';
import StoreBenefits from '@/components/store/StoreBenefits';
import StoreHero from '@/components/store/StoreHero';
import StorePromoBanner from '@/components/store/StorePromoBanner';

/**
 * Store page — storefront UI only (جمعية شمس للكفيف والمبصر).
 *
 * This stage builds the Store layout: hero, trust strip, featured products,
 * promotional banner, full catalogue, best sellers and a closing CTA. Product
 * details, cart, checkout and filtering logic are intentionally deferred to a
 * later stage. All product data comes from `src/data/productService.ts`, so the
 * temporary catalogue can be swapped for the Admin Panel / database later.
 */
export default function StorePage() {
  return (
    <>
      <StoreHero />
      <StoreBenefits />
      <FeaturedProducts />
      <StorePromoBanner />
      <AllProducts />
      <BestSellers />
      <FinalCTA
        title="ادعم الجمعية"
        text="باقتناء منتجات المتجر تساهم في دعم أنشطة الجمعية ومشاريعها الخدمية، وتساعدها على مواصلة عملها لخدمة المجتمع."
      />
    </>
  );
}
