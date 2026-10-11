import { useState } from 'react';
import type { Product, StockStatus } from '@/types';
import { formatPrice, getAverageRating } from '@/data/productService';
import { getWhatsAppLink } from '@/data/whatsapp';
import QuantitySelector from '@/components/store/QuantitySelector';
import Stars from '@/components/store/Stars';

const STOCK_BADGES: Record<StockStatus, { readonly label: string; readonly className: string }> = {
  in_stock: { label: 'متوفر', className: 'badge badge--success' },
  low_stock: { label: 'كمية محدودة', className: 'badge badge--warning' },
  out_of_stock: { label: 'غير متوفر', className: 'badge badge--danger' },
};

const WHATSAPP_LABEL = 'شراء عبر واتساب';

function HeartIcon({ filled }: { readonly filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 21s-7-4.35-9.4-8.5A5 5 0 0 1 12 6a5 5 0 0 1 9.4 6.5C19 16.65 12 21 12 21Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

/**
 * Right-side product information block.
 *
 * Purchase happens entirely through WhatsApp: there is no cart or online
 * checkout. The quantity stepper is kept so the prefilled message can include
 * the requested quantity.
 */
export default function ProductInfo({ product }: { readonly product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);

  const stockBadge = STOCK_BADGES[product.stockStatus];
  const reviewCount = product.reviews.length;
  const average = getAverageRating(product.reviews);
  const outOfStock = product.stockStatus === 'out_of_stock';
  const maxQuantity = product.stock > 0 ? product.stock : undefined;

  const whatsappMessage = `السلام عليكم، بغيت نطلب هاد المنتج: ${product.name}. الكمية: ${quantity}. المرجو تزويدي بمعلومات الطلب والتوصيل. شكراً.`;
  const whatsappHref = getWhatsAppLink(whatsappMessage);

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
            className={wishlisted ? 'pd-wish pd-wish--active' : 'pd-wish'}
            onClick={() => setWishlisted((value) => !value)}
            aria-pressed={wishlisted}
            aria-label={wishlisted ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          >
            <HeartIcon filled={wishlisted} />
          </button>
        </div>

        {outOfStock ? (
          <span className="btn btn--lg btn--full pd-info__whatsapp" aria-disabled="true">
            <WhatsAppIcon />
            <span className="btn__label">{WHATSAPP_LABEL}</span>
          </span>
        ) : (
          <a
            className="btn btn--lg btn--full pd-info__whatsapp"
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon />
            <span className="btn__label">{WHATSAPP_LABEL}</span>
          </a>
        )}
      </div>
    </div>
  );
}
