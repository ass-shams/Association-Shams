import { useState } from 'react';
import type { Product, StockStatus } from '@/types';
import { formatPrice, getAverageRating } from '@/data/productService';
import QuantitySelector from '@/components/store/QuantitySelector';
import Stars from '@/components/store/Stars';

const STOCK_BADGES: Record<StockStatus, { readonly label: string; readonly className: string }> = {
  in_stock: { label: 'متوفر', className: 'badge badge--success' },
  low_stock: { label: 'كمية محدودة', className: 'badge badge--warning' },
  out_of_stock: { label: 'غير متوفر', className: 'badge badge--danger' },
};

function HeartIcon({ filled }: { readonly filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 21s-7-4.35-9.4-8.5A5 5 0 0 1 12 6a5 5 0 0 1 9.4 6.5C19 16.65 12 21 12 21Z" />
    </svg>
  );
}

/** Right-side product information block (UI only — no cart yet). */
export default function ProductInfo({ product }: { readonly product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);

  const stockBadge = STOCK_BADGES[product.stockStatus];
  const reviewCount = product.reviews.length;
  const average = getAverageRating(product.reviews);
  const outOfStock = product.stockStatus === 'out_of_stock';
  const maxQuantity = product.stock > 0 ? product.stock : undefined;

  return (
    <div className="pd-info">
      <p className="pd-info__category">{product.category}</p>
      <h1 className="pd-info__name">{product.name}</h1>

      <div className="pd-info__status">
        <span className={stockBadge.className}>{stockBadge.label}</span>
        {reviewCount > 0 ? (
          <span className="pd-info__rating">
            <Stars value={average} size={15} />
            <span className="pd-info__rating-count">({reviewCount} تقييم)</span>
          </span>
        ) : null}
      </div>

      {product.shortDescription ? (
        <p className="pd-info__short">{product.shortDescription}</p>
      ) : null}

      <div className="pd-info__price">
        <span className="pd-info__price-current">{formatPrice(product.price)}</span>
        {product.compareAtPrice ? (
          <s className="pd-info__price-old">{formatPrice(product.compareAtPrice)}</s>
        ) : null}
      </div>

      <div className="pd-info__actions">
        <div className="pd-info__purchase">
          <QuantitySelector value={quantity} onChange={setQuantity} max={maxQuantity} />
          <button
            type="button"
            className="btn btn--primary btn--lg pd-info__add"
            disabled={outOfStock}
          >
            أضف إلى السلة
          </button>
          <button
            type="button"
            className={wishlisted ? 'pd-wish pd-wish--active' : 'pd-wish'}
            onClick={() => setWishlisted((value) => !value)}
            aria-pressed={wishlisted}
            aria-label={wishlisted ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          >
            <HeartIcon filled={wishlisted} />
          </button>
        </div>

        <button type="button" className="btn btn--outline btn--lg btn--full" disabled={outOfStock}>
          شراء الآن
        </button>
      </div>
    </div>
  );
}
