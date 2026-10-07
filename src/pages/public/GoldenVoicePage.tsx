import FinalCTA from '@/components/finalCTA';

const ABOUT_ITEMS = [
  {
    title: 'الهدف',
    text: 'مبادرة ثقافية تهدف إلى اكتشاف المواهب الصوتية الناشئة وتوفير منصة تنافسية تبرز القدرات الفنية لدى المشاركين.',
  },
  {
    title: 'الجمهور',
    text: 'المسابقة موجهة لكل الفئات المهتمة بالغناء والمواهب الصوتية، سواء هواة أو محترفون، من مختلف الفئات العمرية.',
  },
];

const STEPS = [
  { title: 'التسجيل', desc: 'إتمام استمارة التسجيل وتقديم ملف المشاركة الأولي.' },
  { title: 'الاختيار', desc: 'مراجعة الملفات واختيار المشاركين المؤهلين لمراحل لاحقة.' },
  { title: 'التتويج', desc: 'الحفل النهائي حيث يُتوَّج الفائزون في جو احتفالي.' },
];

const IMPORTANT_POINTS = [
  { title: 'الفئة المستهدفة', text: 'جميع الفئات المهتمة بالمواهب الصوتية.' },
  { title: 'طبيعة المشاركة', text: 'فردية، بتقديم عينة صوتية.' },
  { title: 'الملفات المطلوبة', text: 'تأكيد الهوية، عينة صوتية، بيانات الاتصال.' },
  { title: 'آلية التواصل', text: 'عبر صفحة اتصل بنا أو البريد الرسمي.' },
];

export default function GoldenVoicePage() {
  return (
    <>
      <section className="section section--default section--pad-default">
        <div className="container">
          <div className="page-hero">
            <p className="page-hero__eyebrow">مسابقة الصوت الذهبي</p>
            <h1 className="page-hero__title">مسابقة الصوت الذهبي</h1>
            <p className="page-hero__lead">
              مبادرة ثقافية فريدة تهدف إلى اكتشاف وتنمية المواهب الصوتية، وتوفير منصة تنافسية
              تعزز الثقة بالنفس وتُبرز الجانب الإبداعي لدى المشاركين.
            </p>
            <div className="page-hero__actions">
              <a className="btn btn--primary btn--lg" href="/contact">
                سجّل اهتمامك
              </a>
              <a className="btn btn--outline btn--lg" href="/activities">
                الأنشطة
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About the competition */}
      <section className="section section--muted section--pad-default">
        <div className="container">
          <div className="section-heading">
            <h2 className="section-heading__title">عن المسابقة</h2>
            <p className="section-heading__lead">تعرّف على أبرز محاور المبادرة وأهدافها.</p>
          </div>
          <div className="grid">
            {ABOUT_ITEMS.map((item) => (
              <div key={item.title} className="card card--fill">
                <div className="card__body panel">
                  <h3 className="panel__title">{item.title}</h3>
                  <p className="panel__text">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section section--default section--pad-default">
        <div className="container">
          <div className="section-heading">
            <h2 className="section-heading__title">كيف تعمل</h2>
            <p className="section-heading__lead">مراحل المسابقة من التسجيل وحتى التتويج.</p>
          </div>
          <div className="grid grid--260">
            {STEPS.map((step, index) => (
              <div key={step.title} className="card card--fill">
                <div className="card__body step-card">
                  <span className="step-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-text">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Important info */}
      <section className="section section--muted section--pad-default">
        <div className="container">
          <div className="section-heading">
            <h2 className="section-heading__title">معلومات مهمة</h2>
            <p className="section-heading__lead">نقاط أساسية قبل التفكير في المشاركة.</p>
          </div>
          <div className="card">
            <div className="card__body">
              <dl className="info-list">
                {IMPORTANT_POINTS.map((item) => (
                  <div key={item.title} className="info-list__item">
                    <dt className="info-list__label">{item.title}</dt>
                    <dd className="info-list__text">{item.text}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Registration CTA */}
      <section className="section section--default section--pad-default">
        <div className="container">
          <div className="stack stack--column stack--center stack--gap-lg final-cta">
            <span className="badge badge--accent">التسجيل</span>
            <h2 className="final-cta__title">سجّل اهتمامك</h2>
            <p className="final-cta__text">
              فتح باب التسجيل قريباً. يمكنك التسجيل الآن عبر نموذج الاتصال ليكون فريقنا أول من
              يخبرك بموعد الانطلاق الرسمي.
            </p>
            <a className="btn btn--primary btn--lg" href="/contact">
              سجّل اهتمامك
            </a>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <FinalCTA
        title="للاستفسار أكثر"
        text="لديك سؤال حول المسابقة أو طريقة المشاركة؟ فريقنا جاهز للإجابة على جميع استفساراتك."
      />
    </>
  );
}
