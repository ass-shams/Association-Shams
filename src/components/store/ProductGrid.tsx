import ProductCard from '@/components/store/ProductCard';
import type { Product } from '@/types';

export interface ProductGridProps {
  readonly products: readonly Product[];
  /** `ranked` adds the subtle rank marker used by the Best Sellers row. */
  readonly variant?: 'default' | 'ranked';
}

/** Responsive product grid — 2 columns on mobile up to 4 on desktop. */
export default function ProductGrid({ products, variant = 'default' }: ProductGridProps) {
  const className = variant === 'ranked' ? 'product-grid product-grid--ranked' : 'product-grid';

  return (
    <div className={className}>
      {products.map((product, index) => (
        <ProductCard
          key={`${product.id}-${index}`}
          product={product}
          rank={variant === 'ranked' ? index + 1 : undefined}
        />
      ))}
    </div>
  );
}
