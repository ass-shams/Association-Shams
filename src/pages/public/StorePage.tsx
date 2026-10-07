import FinalCTA from '@/components/finalCTA';

interface PlaceholderProduct {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

const PLACEHOLDER_PRODUCTS: readonly PlaceholderProduct[] = [
  {
    id: 'annual-report-book',
    name: 'كتاب التقرير السنوي',
    description: 'منشور مطبوع يلخص أبرز أنشطة الجمعية ومشاريعها خلال العام.',
  },
  {
    id: 'association-shirt',
    name: 'قميص الجمعية',
    description: 'قطعة موحدة بتصميم الجمعية تُرتدى في الفعاليات والمناسبات.',
  },
  {
    id: 'shams-cup',
    name: 'كوب شمس',
    description: 'كوب عملي يحمل هوية الجمعية للاستخدام اليومي.',
  },
  {
    id: 'awareness-poster',
    name: 'ملصق توعوي',
    description: 'ملصق يُستخدم في الحملات والفعاليات المجتمعية.',
  },
  {
    id: 'association-bag',
    name: 'حقيبة الجمعية',
    description: 'حقيبة قابلة لإعادة الاستخدام تحمل شعار الجمعية.',
  },
  {
    id: 'membership-pin',
    name: 'شارة العضوية',
    description: 'شارة تعريفية يرتديها الأعضاء خلال الأنشطة والفعاليات.',
  },
];

export default function StorePage() {
  return (
    <>
      <section className="section section--default section--pad-default">
        <div className="container">
          <div className="page-hero">
            <p className="page-hero__eyebrow">المتجر</p>
            <h1 className="page-hero__title">المتجر</h1>
            <p className="page-hero__lead">
              استعرض منتجات الجمعية ومواد الدعم الخاصة بها، وساهم من خلال اقتنائها في دعم
              أنشطتها وبرامجها المجتمعية.
            </p>
            <div className="page-hero__actions">
              <a className="btn btn--primary btn--lg" href="/membership">
                الانخراط في الجمعية
              </a>
              <a className="btn btn--outline btn--lg" href="/contact">
                اتصل بنا
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Product grid */}
      <section className="section section--muted section--pad-default">
        <div className="container">
          <div className="section-heading">
            <h2 className="section-heading__title">منتجات المتجر</h2>
            <p className="section-heading__lead">
              مجموعة من المنتجات والمواد الداعمة للجمعية. الأسعار والكميات المتاحة سيتم تحديدها
              لاحقًا.
            </p>
          </div>
          <div className="grid grid--260">
            {PLACEHOLDER_PRODUCTS.map((product) => (
              <div key={product.id} className="card card--fill">
                <div className="card__media media-placeholder">
                  <span className="media-mark" aria-hidden="true" />
                  <span>صورة المنتج</span>
                </div>
                <div className="card__header">
                  <h3 className="product-title">{product.name}</h3>
                </div>
                <div className="card__body">
                  <p className="product-desc">{product.description}</p>
                </div>
                <div className="card__footer product-footer">
                  <span className="product-price">السعر: غير محدد</span>
                  <span className="badge badge--neutral">غير متوفر</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Update note */}
      <section className="section section--default section--pad-default">
        <div className="container">
          <div className="store-note">
            <div className="stack stack--row stack--center stack--wrap stack--gap-sm">
              <span className="badge badge--info">قريبًا</span>
              <h2 className="store-note__title">المتجر قيد التحديث</h2>
            </div>
            <p className="store-note__text">
              ستُضاف المنتجات الحقيقية مع أسعارها إلى المتجر قريبًا. تفضل بزيارة الصفحة لاحقًا
              للاطلاع على المستجدات.
            </p>
          </div>
        </div>
      </section>

      {/* Support CTA */}
      <FinalCTA
        title="ادعم الجمعية"
        text="باقتناء منتجات المتجر تساهم في دعم أنشطة الجمعية ومشاريعها الخدمية، وتساعدها على مواصلة عملها لخدمة المجتمع."
      />
    </>
  );
}
