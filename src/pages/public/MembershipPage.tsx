import FinalCTA from '@/components/finalCTA';

const VALUES = [
  { title: 'انتماء', text: 'انضم إلى مجتمع فاعل وشارك في تحقيق أهداف مشتركة.' },
  { title: 'مشاركة', text: 'شارك في الأنشطة والفعاليات المتنوعة التي تنظمها الجمعية.' },
  { title: 'تطوير', text: 'طوّر مهاراتك وساهم في النمو الشخصي والمجتمعي.' },
];

const STEPS = [
  {
    number: 1,
    title: 'اقرأ عن الجمعية',
    text: 'تعرف على رسالتنا ورؤيتنا وقيمنا قبل اتخاذ قرار الانخراط.',
    link: '/about',
    linkLabel: 'تصفح صفحتنا',
  },
  {
    number: 2,
    title: 'أكمل استمارة الانخراط',
    text: 'استمارة الانخراط ستُتاح قريباً. يمكنك التواصل معنا مسبقاً للتسجيل.',
  },
  {
    number: 3,
    title: 'تواصل معنا',
    text: 'فريقنا جاهز للإجابة على أسئلتك ومساعدتك في إتمام إجراءات الانخراط.',
    link: '/contact',
    linkLabel: 'تواصل معنا',
  },
];

const BENEFITS = [
  'الوصول إلى الأنشطة والفعاليات',
  'استلام نشرات الجمعية ومستجداتها',
  'المشاركة في التصويت داخل الجمعية',
  'الوصول إلى الوثائق والموارد',
];

const FAQ = [
  {
    question: 'كيف يمكنني الانخراط؟',
    answer: 'تواصل معنا عبر صفحة الاتصال وسيساعدك فريقنا في إتمام الإجراءات.',
  },
  {
    question: 'ما هي شروط الانخراط؟',
    answer: 'ستُعلن الشروط لاحقاً. يرجى متابعة صفحاتنا للاطلاع على المستجدات.',
  },
  {
    question: 'هل هناك رسوم انخراط؟',
    answer: 'ستُعلن التفاصيل لاحقاً. يرجى التواصل معنا لمعرفة المزيد.',
  },
];

export default function MembershipPage() {
  return (
    <>
      <section className="section section--default section--pad-default">
        <div className="container">
          <div className="page-hero">
            <p className="page-hero__eyebrow">الانخراط</p>
            <h1 className="page-hero__title">الانخراط في الجمعية</h1>
            <p className="page-hero__lead">
              انضم إلى جمعية شمس وكن جزءاً من مجتمعنا الفاعل. يمنحك الانخراط فرصة المشاركة في
              الأنشطة والتطوير الشخصي والمجتمعي.
            </p>
            <div className="page-hero__actions">
              <a className="btn btn--primary btn--lg" href="/contact">
                تواصل معنا
              </a>
              <a className="btn btn--outline btn--lg" href="/about">
                عن الجمعية
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why join */}
      <section className="section section--muted section--pad-default">
        <div className="container">
          <div className="section-heading">
            <h2 className="section-heading__title">لماذا تنضم؟</h2>
            <p className="section-heading__lead">
              قيم ومبادئ نؤمن بها ونعمل على تعزيزها داخل مجتمعنا.
            </p>
          </div>
          <div className="grid grid--240">
            {VALUES.map((item) => (
              <div key={item.title} className="card value-card">
                <div className="card__body">
                  <h3 className="value-title">{item.title}</h3>
                  <p className="value-text">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="section section--default section--pad-default">
        <div className="container">
          <div className="section-heading">
            <h2 className="section-heading__title">خطوات الانخراط</h2>
            <p className="section-heading__lead">ثلاث خطوات بسيطة لتصبح عضواً في جمعية شمس.</p>
          </div>
          <div className="grid grid--260">
            {STEPS.map((step) => (
              <div key={step.number} className="card card--fill">
                <div className="card__body step-card">
                  <span className="step-number step-number--lg" aria-hidden="true">
                    {step.number}
                  </span>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-text">{step.text}</p>
                  {step.link ? (
                    <a className="btn btn--outline btn--sm" href={step.link}>
                      {step.linkLabel}
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section section--muted section--pad-default">
        <div className="container">
          <div className="section-heading">
            <h2 className="section-heading__title">مزايا الانخراط</h2>
            <p className="section-heading__lead">
              استفد من مجموعة من المزايا كعضو في الجمعية.
            </p>
          </div>
          <div className="card">
            <div className="card__body">
              <ul className="benefits">
                {BENEFITS.map((benefit) => (
                  <li key={benefit} className="benefit">
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section--default section--pad-default">
        <div className="container">
          <div className="section-heading">
            <h2 className="section-heading__title">أسئلة شائعة</h2>
            <p className="section-heading__lead">
              إجابات على بعض الأسئلة الأكثر شيوعاً حول الانخراط.
            </p>
          </div>
          <dl className="faq">
            {FAQ.map((item) => (
              <div key={item.question} className="faq__item">
                <dt className="faq__question">{item.question}</dt>
                <dd className="faq__answer">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA */}
      <FinalCTA
        title="جاهز للانضمام؟"
        text="إذا كنت مهتماً بالانخراط في جمعية شمس، فلا تتردد في التواصل معنا. فريقنا جاهز لمساعدتك في إتمام الإجراءات."
      />
    </>
  );
}
