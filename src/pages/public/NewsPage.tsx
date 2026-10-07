import FinalCTA from '@/components/finalCTA';

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 2v4" />
      <path d="M16 2v4" />
    </svg>
  );
}

interface NewsItem {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly category: string;
  readonly tone: string;
}

const NEWS_ITEMS: readonly NewsItem[] = [
  {
    id: 'event-report',
    title: 'تقرير عن الفعالية الأخيرة',
    summary: 'ملخص افتراضي للخبر يُعرض هنا، ويُستبدل لاحقاً بالمحتوى الفعلي من إدارة الموقع.',
    category: 'تقارير',
    tone: 'neutral',
  },
  {
    id: 'registration-opening',
    title: 'إعلان عن افتتاح التسجيل',
    summary: 'نص مختصر يلخص الإعلان، ويُستبدل لاحقاً بالتفاصيل الرسمية عند نشرها.',
    category: 'إعلانات',
    tone: 'info',
  },
  {
    id: 'national-conference',
    title: 'مشاركة في مؤتمر وطني',
    summary: 'ملخص افتراضي للخبر يُعرض هنا، ويُستبدل لاحقاً بالمحتوى الفعلي من إدارة الموقع.',
    category: 'فعاليات',
    tone: 'success',
  },
  {
    id: 'volunteer-honoring',
    title: 'تكريم المتطوعين',
    summary: 'نص مختصر يلخص الخبر، ويُستبدل لاحقاً بالتفاصيل الكاملة من إدارة الموقع.',
    category: 'مجتمع',
    tone: 'accent',
  },
  {
    id: 'new-partnership',
    title: 'شراكة جديدة',
    summary: 'ملخص افتراضي للخبر يُعرض هنا، ويُستبدل لاحقاً بالمحتوى الفعلي عند توفره.',
    category: 'إعلانات',
    tone: 'info',
  },
  {
    id: 'half-yearly-report',
    title: 'تقرير نصف السنوي',
    summary: 'نص مختصر يلخص التقرير، ويُستبدل لاحقاً بالنسخة الكاملة من إدارة الموقع.',
    category: 'تقارير',
    tone: 'neutral',
  },
];

export default function NewsPage() {
  return (
    <>
      <section className="section section--default section--pad-default">
        <div className="container">
          <div className="page-hero">
            <p className="page-hero__eyebrow">الأخبار</p>
            <h1 className="page-hero__title">آخر الأخبار</h1>
            <p className="page-hero__lead">
              صفحة مخصصة لنشر آخر الأخبار والمستجدات المتعلقة بأنشطة الجمعية وفعالياتها، حيث تجد
              ملخصات مختصرة تُعرض بأسلوب واضح ومنظم.
            </p>
            <div className="page-hero__actions">
              <a className="btn btn--primary btn--lg" href="/contact">
                تواصل معنا
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Featured news */}
      <section className="section section--muted section--pad-default">
        <div className="container">
          <div className="section-heading">
            <h2 className="section-heading__title">أبرز الأخبار</h2>
            <p className="section-heading__lead">
              نسلط الضوء هنا على خبر واحد من أخبار الجمعية، ويُحدَّث المحتوى لاحقاً من إدارة
              الموقع.
            </p>
          </div>
          <div className="featured-panel">
            <div className="card">
              <div className="card__header">
                <span className="badge badge--accent">مميز</span>
                <h3 className="featured-panel__title">خبر مميز</h3>
              </div>
              <div className="card__body">
                <p>
                  محتوى افتراضي يمثل خبرًا من أخبار الجمعية، ويُستبدل لاحقاً بالتفاصيل الكاملة
                  والوسائط المرافقة من إدارة الموقع.
                </p>
              </div>
              <div className="card__footer card__footer--stretch">
                <a className="btn btn--primary btn--md btn--full" href="/news">
                  اقرأ المزيد
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* News grid */}
      <section className="section section--default section--pad-default">
        <div className="container">
          <div className="section-heading">
            <h2 className="section-heading__title">جميع الأخبار</h2>
            <p className="section-heading__lead">
              تصفح آخر المستجدات والفعاليات الصادرة عن الجمعية.
            </p>
          </div>
          <div className="grid grid--300">
            {NEWS_ITEMS.map((item) => (
              <div key={item.id} className="card card--fill">
                <div className="card__header">
                  <div className="news-meta">
                    <span className={`badge badge--${item.tone}`}>{item.category}</span>
                    <span className="news-date">
                      <CalendarIcon />
                      تاريخ النشر قيد التحديث
                    </span>
                  </div>
                  <h3 className="card-title">{item.title}</h3>
                </div>
                <div className="card__body">
                  <p className="card-text">{item.summary}</p>
                </div>
                <div className="card__footer card__footer--stretch">
                  <a className="btn btn--ghost btn--md btn--full" href="/news">
                    اقرأ المزيد
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <FinalCTA
        title="ابق على اطلاع"
        text="تابع آخر الأخبار والمستجدات عبر هذه الصفحة، أو تواصل معنا للاستفسارات والاقتراحات."
      />
    </>
  );
}
