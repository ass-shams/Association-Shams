import { useId, useState } from 'react';
import type { Product } from '@/types';
import ProductReviews from '@/components/store/ProductReviews';

type TabKey = 'description' | 'additional' | 'reviews';

const TABS: readonly { readonly key: TabKey; readonly label: string }[] = [
  { key: 'description', label: 'الوصف' },
  { key: 'additional', label: 'معلومات إضافية' },
  { key: 'reviews', label: 'التقييمات' },
];

/** Tabbed product content. All content is read from the product data. */
export default function ProductTabs({ product }: { readonly product: Product }) {
  const [activeTab, setActiveTab] = useState<TabKey>('description');
  const baseId = useId();

  const tabId = (key: TabKey) => `${baseId}-tab-${key}`;
  const panelId = (key: TabKey) => `${baseId}-panel-${key}`;

  const paragraphs = (product.description ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="pd-tabs">
      <div className="pd-tabs__list" role="tablist" aria-label="معلومات المنتج">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={tabId(tab.key)}
            aria-selected={activeTab === tab.key}
            aria-controls={panelId(tab.key)}
            tabIndex={activeTab === tab.key ? 0 : -1}
            className={activeTab === tab.key ? 'pd-tab pd-tab--active' : 'pd-tab'}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.key === 'reviews' ? <span className="pd-tab__count">{product.reviews.length}</span> : null}
          </button>
        ))}
      </div>

      <div
        className="pd-tabs__panel"
        role="tabpanel"
        id={panelId('description')}
        aria-labelledby={tabId('description')}
        hidden={activeTab !== 'description'}
      >
        {paragraphs.length > 0 ? (
          <div className="pd-prose">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <p className="pd-empty">لا يوجد وصف لهذا المنتج حالياً.</p>
        )}
      </div>

      <div
        className="pd-tabs__panel"
        role="tabpanel"
        id={panelId('additional')}
        aria-labelledby={tabId('additional')}
        hidden={activeTab !== 'additional'}
      >
        {product.additionalInformation?.length ? (
          <dl className="pd-attrs">
            {product.additionalInformation.map((attribute) => (
              <div key={attribute.label} className="pd-attrs__row">
                <dt className="pd-attrs__label">{attribute.label}</dt>
                <dd className="pd-attrs__value">{attribute.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="pd-empty">لا توجد معلومات إضافية لهذا المنتج.</p>
        )}
      </div>

      <div
        className="pd-tabs__panel"
        role="tabpanel"
        id={panelId('reviews')}
        aria-labelledby={tabId('reviews')}
        hidden={activeTab !== 'reviews'}
      >
        <ProductReviews reviews={product.reviews} />
      </div>
    </div>
  );
}
