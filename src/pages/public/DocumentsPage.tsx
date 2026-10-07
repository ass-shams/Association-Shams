import { useState } from 'react';
import FinalCTA from '@/components/finalCTA';

function FileTextIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

interface DocumentItem {
  id: string;
  title: string;
  category: string;
  description: string;
  format: string;
  date: string;
}

const CATEGORIES = ['الكل', 'التقارير', 'القرارات', 'النماذج'] as const;
type Category = (typeof CATEGORIES)[number];

const DOCUMENTS: DocumentItem[] = [
  {
    id: '1',
    title: 'التقرير السنوي',
    category: 'التقارير',
    description: 'تقرير شامل يغطي أنشطة وإنجازات الجمعية خلال السنة.',
    format: 'PDF',
    date: 'غير محدد',
  },
  {
    id: '2',
    title: 'محضر الجمعية العامة',
    category: 'القرارات',
    description: 'محضر اجتماع الجمعية العامة العادية مع القرارات المتخذة.',
    format: 'PDF',
    date: 'غير محدد',
  },
  {
    id: '3',
    title: 'نموذج طلب الانخراط',
    category: 'النماذج',
    description: 'نموذج رسمي لطلب العضوية في الجمعية.',
    format: 'PDF',
    date: 'غير محدد',
  },
  {
    id: '4',
    title: 'القوانين الأساسية',
    category: 'القرارات',
    description: 'النظام الأساسي للجمعية يحدد أهدافها وهيكلها وقواعد عملها.',
    format: 'PDF',
    date: 'غير محدد',
  },
  {
    id: '5',
    title: 'تقرير الأنشطة',
    category: 'التقارير',
    description: 'تقرير دوري يلخص الأنشطة والفعاليات المنجزة.',
    format: 'PDF',
    date: 'غير محدد',
  },
  {
    id: '6',
    title: 'ميزانية السنة',
    category: 'التقارير',
    description: 'البيان المالي السنوي يوضح الإيرادات والمصروفات.',
    format: 'PDF',
    date: 'غير محدد',
  },
];

const CATEGORY_TONES: Record<string, string> = {
  التقارير: 'info',
  القرارات: 'warning',
  النماذج: 'accent',
};

export default function DocumentsPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('الكل');

  const visibleDocuments = DOCUMENTS.filter(
    (doc) => activeCategory === 'الكل' || doc.category === activeCategory,
  );

  return (
    <>
      <section className="section section--default section--pad-default">
        <div className="container">
          <div className="page-hero">
            <p className="page-hero__eyebrow">الوثائق الإدارية</p>
            <h1 className="page-hero__title">الوثائق الإدارية</h1>
            <p className="page-hero__lead">
              تتيح لك هذه الصفحة الوصول إلى الوثائق الإدارية الرسمية للجمعية، بما في ذلك التقارير
              والقرارات والنماذج، ويتم نشرها بانتظام لضمان الشفافية.
            </p>
            <div className="page-hero__actions">
              <a className="btn btn--outline btn--lg" href="/contact">
                استفسار عن وثيقة
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Filter + list */}
      <section className="section section--muted section--pad-default">
        <div className="container">
          <div className="section-heading">
            <h2 className="section-heading__title">الوثائق المتاحة</h2>
            <p className="section-heading__lead">
              تصفّح الوثائق الإدارية المتاحة. اضغط على "تحميل" للحصول على نسخة من الوثيقة.
            </p>
          </div>

          <div className="filter" role="group" aria-label="تصنيف الوثائق">
            {CATEGORIES.map((category) => {
              const isActive = category === activeCategory;

              return (
                <button
                  key={category}
                  type="button"
                  className={isActive ? 'filter__button filter__button--active' : 'filter__button'}
                  aria-pressed={isActive}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {visibleDocuments.length === 0 ? (
            <div className="card empty">
              <div className="card__body empty__body">
                <FileTextIcon />
                <h3 className="empty__title">لا توجد وثائق في هذا التصنيف</h3>
                <p className="empty__text">
                  لم يتم نشر أي وثيقة ضمن هذا التصنيف بعد. يرجى اختيار تصنيف آخر أو مراجعة
                  الصفحة لاحقاً.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid--320">
              {visibleDocuments.map((doc) => (
                <div key={doc.id} className="card card--fill">
                  <div className="card__header doc-card__header">
                    <span className="icon-tile icon-tile--sm" aria-hidden="true">
                      <FileTextIcon />
                    </span>
                    <div className="doc-card__title-wrap">
                      <h3 className="doc-card__title">{doc.title}</h3>
                      <span className={`badge badge--${CATEGORY_TONES[doc.category] ?? 'neutral'}`}>
                        {doc.category}
                      </span>
                    </div>
                  </div>
                  <div className="card__body doc-card__body">
                    <p className="doc-card__desc">{doc.description}</p>
                    <dl className="meta-list">
                      <div className="meta-row">
                        <dt>تاريخ الإصدار</dt>
                        <dd>{doc.date}</dd>
                      </div>
                      <div className="meta-row">
                        <dt>الصيغة</dt>
                        <dd>{doc.format}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="card__footer card__footer--stretch">
                    <button type="button" className="btn btn--outline btn--sm btn--full" disabled>
                      <span className="btn__label">
                        <DownloadIcon />
                        تحميل
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Help CTA */}
      <FinalCTA
        tone="default"
        title="تحتاج مساعدة؟"
        text="إذا لم تجد الوثيقة التي تبحث عنها، أو كنت بحاجة إلى توضيح حول أي وثيقة إدارية، يرجى عدم التردد في التواصل معنا."
      />
    </>
  );
}
