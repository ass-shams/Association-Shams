import { Link } from 'react-router-dom';
import type { Product } from '@/types';
import { formatPrice } from '@/data/productService';

export interface ProductCardProps {
  readonly product: Product;
  /** Optional rank shown as a small corner marker (used by Best Sellers). */
  readonly rank?: number;
}

/**
 * Minimal store card: image, optional badge/rank, name and price.
 * The whole card links to the product's dynamic details page.
 */
export default function ProductCard({ product, rank }: ProductCardProps) {
  const image = product.images[0];
  const badge = product.isNew ? 'جديد' : product.isBestSeller ? 'الأكثر طلباً' : undefined;

  return (
    <Link className="product-card" to={`/store/${product.slug}`} aria-label={product.name}>
      <div className="product-card__media">
        {image ? (
          <img
            src={image.src}
            alt={image.alt}
            style={image.position ? { objectPosition: image.position } : undefined}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ) : null}

        {badge ? <span className="product-card__badge">{badge}</span> : null}
        {rank ? (
          <span className="product-card__rank" aria-label={`المرتبة ${rank}`}>
            {rank}
          </span>
        ) : null}
      </div>

      <div className="product-card__body">
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__price">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
