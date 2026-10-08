import type { ProductReview } from '@/types';
import Stars from '@/components/store/Stars';

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat('ar-MA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/** List of individual reviews. */
export default function ReviewList({ reviews }: { readonly reviews: readonly ProductReview[] }) {
  return (
    <ul className="pd-review-list">
      {reviews.map((item) => (
        <li key={item.id} className="pd-review">
          <div className="pd-review__head">
            <span className="pd-review__avatar" aria-hidden="true">
              {item.author.trim().charAt(0)}
            </span>
            <span className="pd-review__meta">
              <span className="pd-review__author">{item.author}</span>
              <Stars value={item.rating} size={14} />
            </span>
            <time className="pd-review__date" dateTime={item.date}>
              {formatDate(item.date)}
            </time>
          </div>

          <p className="pd-review__text">{item.comment}</p>

          {item.images?.length ? (
            <ul className="pd-review__images">
              {item.images.map((image, index) => (
                <li key={`${item.id}-image-${index}`}>
                  <img src={image.src} alt={image.alt} loading="lazy" decoding="async" draggable={false} />
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
