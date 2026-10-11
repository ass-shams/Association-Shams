import { useState } from 'react';
import type { ProductImage } from '@/types';

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export interface ProductGalleryProps {
  readonly images: readonly ProductImage[];
  readonly productName: string;
}

/**
 * Product image gallery: one large stage image plus thumbnails.
 * Handles any number of images (including a single one) without fixed counts.
 */
export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return <div className="pd-gallery__empty" role="img" aria-label={productName} />;
  }

  const safeIndex = Math.min(activeIndex, images.length - 1);
  const active = images[safeIndex];
  const hasMultiple = images.length > 1;

  const goPrevious = () => setActiveIndex((safeIndex - 1 + images.length) % images.length);
  const goNext = () => setActiveIndex((safeIndex + 1) % images.length);

  return (
    <div className="pd-gallery">
      <div className="pd-gallery__stage">
        <img
          key={active.src}
          src={active.src}
          srcSet={active.srcSet}
          sizes="(min-width: 1024px) 560px, (min-width: 640px) 48vw, 92vw"
          alt={active.alt}
          style={active.position ? { objectPosition: active.position } : undefined}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          draggable={false}
          onError={(event) => {
            const fallback = active.fallbackSrc;
            if (fallback && event.currentTarget.src !== fallback) {
              event.currentTarget.removeAttribute('srcset');
              event.currentTarget.src = fallback;
            }
          }}
        />

        {hasMultiple ? (
          <>
            <button
              type="button"
              className="pd-gallery__nav pd-gallery__nav--prev"
              onClick={goPrevious}
              aria-label="الصورة السابقة"
            >
              <ChevronRight />
            </button>
            <button
              type="button"
              className="pd-gallery__nav pd-gallery__nav--next"
              onClick={goNext}
              aria-label="الصورة التالية"
            >
              <ChevronLeft />
            </button>
          </>
        ) : null}
      </div>

      {hasMultiple ? (
        <ul className="pd-gallery__thumbs">
          {images.map((image, index) => (
            <li key={`${image.src}-${index}`}>
              <button
                type="button"
                className={
                  index === safeIndex
                    ? 'pd-gallery__thumb pd-gallery__thumb--active'
                    : 'pd-gallery__thumb'
                }
                onClick={() => setActiveIndex(index)}
                aria-label={`عرض الصورة ${index + 1}`}
                aria-current={index === safeIndex ? 'true' : undefined}
              >
                <img
                  src={image.src}
                  srcSet={image.srcSet}
                  sizes="80px"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  onError={(event) => {
                    const fallback = image.fallbackSrc;
                    if (fallback && event.currentTarget.src !== fallback) {
                      event.currentTarget.removeAttribute('srcset');
                      event.currentTarget.src = fallback;
                    }
                  }}
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
