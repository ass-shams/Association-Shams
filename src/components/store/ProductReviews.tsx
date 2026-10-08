import type { ProductReview } from '@/types';
import RatingSummary from '@/components/store/RatingSummary';
import ReviewList from '@/components/store/ReviewList';

/** Reviews panel: summary on top, review list below. */
export default function ProductReviews({ reviews }: { readonly reviews: readonly ProductReview[] }) {
  if (reviews.length === 0) {
    return <p className="pd-empty">لا توجد تقييمات بعد لهذا المنتج.</p>;
  }

  return (
    <div className="pd-reviews">
      <RatingSummary reviews={reviews} />
      <ReviewList reviews={reviews} />
    </div>
  );
}
