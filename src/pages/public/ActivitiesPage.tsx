import FinalCTA from '@/components/finalCTA';

interface ActivityItem {
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly tone: string;
}

const ACTIVITIES: readonly ActivityItem[] = [
  {
    title: 'نشاط ثقافي',
    description: 'فعالية ثقافية تعزز الحوار وتتيح للمشاركين تبادل الخبرات والأفكار.',
    category: 'ثقافة',
    tone: 'info',
  },
  {
    title: 'ورشة عمل',
    description: 'ورشة تطبيقية تتيح اكتساب مهارات جديدة في أجواء تفاعلية مشجعة.',
    category: 'تدريب',
    tone: 'success',
  },
  {
    title: 'فعالية خيرية',
    description: 'نشاط تضامني يجمع أفراد المجتمع حول دعم الفئات المحتاجة.',
    category: 'تضامن',
    tone: 'warning',
  },
  {
    title: 'حملة توعوية',
    description: 'مبادرة لنشر الوعي حول قضايا تهم المجتمع وتشجيع المشاركة المدنية.',
    category: 'توعية',
    tone: 'neutral',
  },
  {
    title: 'لقاء مجتمعي',
    description: 'لقاء مفتوح يتيح للأعضاء والزوار النقاش وتبادل الأفكار بحرية.',
    category: 'مجتمع',
    tone: 'accent',
  },
  {
    title: 'مبادرة رياضية',
    description: 'نشاط رياضي يشجع على نمط حياة صحي ويعزز قيم العمل الجماعي.',
    category: 'رياضة',
    tone: 'info',
  },
];

interface InfoBlock {
  readonly title: string;
  readonly text: string;
  readonly link?: { readonly label: string; readonly href: string };
}

const INFO_BLOCKS: readonly InfoBlock[] = [
  {
    title: 'البرمجة',
    text: 'تُبرمج الجمعية أنشطتها بشكل منتظم عبر برامج متنوعة المجالات تلبّي اهتمامات الأعضاء والزوار.',
  },
  {
    title: 'المشاركة',
    text: 'يستطيع الأعضاء والجمهور المشاركة في الأنشطة وفق الشروط التي تعلنها الجمعية.',
  },
  {
    title: 'التواصل',
    text: 'تابع آخر الإعلانات وتفاصيل الأنشطة القادمة أولاً بأول.',
    link: { label: 'صفحة الأخبار', href: '/news' },
  },
];

export default function ActivitiesPage() {
  return (
    <>
      <section className="section section--default section--pad-default">
        <div className="container">
          <div className="page-hero">
            <p className="page-hero__eyebrow">أنشطتنا</p>
            <h1 className="page-hero__title">أنشطتنا</h1>
            <p className="page-hero__lead">
              تنظم جمعية شمس أنشطة متنوعة تجمع بين الثقافة والتضامن والمجتمع، وتفتح باب
              المشاركة للأعضاء والزوار على حد سواء.
            </p>
            <div className="page-hero__actions">
              <a className="btn btn--primary btn--lg" href="/membership">
                انضم إلينا
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Featured activity */}
      <section className="section section--muted section--pad-default">
        <div className="container">
          <div className="card featured-card">
            <div className="card__header">
              <span className="badge badge--accent">نشاط مميز</span>
              <h2 className="featured-card__title">نشاط مميز ضمن برامج الجمعية</h2>
            </div>
            <div className="card__body">
              <p className="card-text">
                يُبرز هذا النشاط ضمن برامج الجمعية، ويوفر فرصة للقاء المشاركين وتبادل الخبرات في
                أجواء تفاعلية تخدم الصالح العام.
              </p>
            </div>
            <div className="card__footer card__footer--stretch">
              <a className="btn btn--primary btn--md btn--full" href="/activities">
                اكتشف المزيد
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Activities grid */}
      <section className="section section--default section--pad-default">
        <div className="container">
          <div className="section-heading">
            <h2 className="section-heading__title">أنشطة متنوعة</h2>
            <p className="section-heading__lead">
              مجموعة من الأنشطة التي تنظمها الجمعية في مجالات مختلفة.
            </p>
          </div>
          <div className="grid">
            {ACTIVITIES.map((item) => (
              <div key={item.title} className="card card--fill">
                <div className="card__header">
                  <span className={`badge badge--${item.tone}`}>{item.category}</span>
                  <h3 className="card-title">{item.title}</h3>
                </div>
                <div className="card__body">
                  <p className="card-text">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section section--muted section--pad-default">
        <div className="container">
          <div className="section-heading">
            <h2 className="section-heading__title">كيف تشارك</h2>
            <p className="section-heading__lead">
              نظرة عامة على طريقة تنظيم الأنشطة والمشاركة فيها.
            </p>
          </div>
          <div className="grid grid--240">
            {INFO_BLOCKS.map((item) => (
              <div key={item.title} className="card card--fill">
                <div className="card__body">
                  <h3 className="card-title">{item.title}</h3>
                  <p className="card-text">{item.text}</p>
                  {item.link ? (
                    <a className="info-link" href={item.link.href}>
                      {item.link.label}
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <FinalCTA
        tone="default"
        title="انضم إلى أنشطتنا"
        text="سواء كنت عضواً في الجمعية أو زائراً، تتيح لك أنشطتنا فرصة المشاركة والتفاعل وبناء علاقات جديدة مع المجتمع."
      />
    </>
  );
}
