import type { CSSProperties } from 'react';
import type { ProductReview } from '@/types';
import { getAverageRating, getRatingDistribution } from '@/data/productService';
import Stars from '@/components/store/Stars';

/** Average rating, total count and the 5→1 star distribution bars. */
export default function RatingSummary({ reviews }: { readonly reviews: readonly ProductReview[] }) {
  const average = getAverageRating(reviews);
  const total = reviews.length;
  const distribution = getRatingDistribution(reviews);

  return (
    <div className="pd-rating">
      <div className="pd-rating__score">
        <span className="pd-rating__value">{average.toFixed(1)}</span>
        <Stars value={average} size={18} />
        <span className="pd-rating__total">{total} تقييم</span>
      </div>

      <ul className="pd-rating__bars">
        {distribution.map((entry) => (
          <li key={entry.stars} className="pd-rating__bar-row">
            <span className="pd-rating__bar-label">{entry.stars} نجوم</span>
            <span className="pd-rating__bar-track">
              <span
                className="pd-rating__bar-fill"
                style={{ '--fill': `${entry.percentage}%` } as CSSProperties}
              />
            </span>
            <span className="pd-rating__bar-count">{entry.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
