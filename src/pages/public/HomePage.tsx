import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactElement, ReactNode } from 'react';
import FinalCTA from '@/components/finalCTA';

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 2v4" />
      <path d="M16 2v4" />
    </svg>
  );
}

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

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 17v4" />
      <path d="M8 21h8" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
      <path d="M16 3.1a4 4 0 0 1 0 7.8" />
    </svg>
  );
}

/** Neutral outline star — placeholder only, it must not imply an actual rating. */
function StarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 2.6l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.1l6.1-.9z" />
    </svg>
  );
}

/** Checkmark used by the local interest-form success state. */
function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </svg>
  );
}

function SmartphoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function ScissorsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="6" cy="6" r="3" />
      <path d="M8.12 8.12 12 12" />
      <path d="M20 4 8.12 15.88" />
      <circle cx="6" cy="18" r="3" />
      <path d="M14.8 14.8 20 20" />
    </svg>
  );
}

function SmileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" x2="9.01" y1="9" y2="9" />
      <line x1="15" x2="15.01" y1="9" y2="9" />
    </svg>
  );
}

function MessagesSquareIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z" />
      <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
    </svg>
  );
}

type IconComponent = () => ReactElement;

const QUICK_LINKS: readonly {
  title: string;
  description: string;
  to: string;
  icon: IconComponent;
}[] = [
  {
    title: 'الوثائق الإدارية',
    description: 'استعرض الوثائق والنماذج الإدارية الرسمية للجمعية.',
    to: '/documents',
    icon: FileTextIcon,
  },
  {
    title: 'المحاضر والاجتماعات',
    description: 'اطلع على محاضر الاجتماعات والتقارير الدورية.',
    to: '/meetings',
    icon: CalendarIcon,
  },
  {
    title: 'الانخراط',
    description: 'تعرف على شروط الانخراط وأكمل إجراءات تسجيلك.',
    to: '/membership',
    icon: UsersIcon,
  },
  {
    title: 'مسابقة الصوت الذهبي',
    description: 'شارك في مسابقاتنا الثقافية والفنية المميزة.',
    to: '/golden-voice',
    icon: MicIcon,
  },
];

const ACTIVITIES: readonly {
  title: string;
  text: string;
  icon: IconComponent;
}[] = [
  {
    title: 'الدورات التدريبية والتعليمية',
    text: 'ورشات مجانية لتعلم وإتقان قراءة وكتابة طريقة برايل، بالإضافة إلى تعلم مهارات استخدام الحاسوب والتقنيات التعويضية والإعلاميات.',
    icon: BookOpenIcon,
  },
  {
    title: 'التكوين التكنولوجي والرقمنة',
    text: 'تدريب الأشخاص في وضعية إعاقة بصرية على استخدام الهواتف الذكية والتقنيات الميسّرة لمواكبة التطور التكنولوجي.',
    icon: SmartphoneIcon,
  },
  {
    title: 'ورشات الحرف اليدوية والصناعة التقليدية',
    text: 'ورشات تفاعلية لتعليم مهارات الصياغة والتركيب، وتمكين المستفيدين من تطوير مهاراتهم وإبراز قدراتهم الإبداعية.',
    icon: ScissorsIcon,
  },
  {
    title: 'الأنشطة التربوية والترفيهية للأطفال',
    text: 'صبيحات تربوية وتشجيعية للأطفال، تشمل الأناشيد والألعاب والورشات التفاعلية، إضافة إلى المخيمات والخرجات الاستكشافية.',
    icon: SmileIcon,
  },
  {
    title: 'اللقاءات الثقافية والتوعوية',
    text: 'تنظيم لقاءات وأمسيات ثقافية وفنية وتخليد المناسبات الخاصة بالمكفوفين وضعاف البصر بهدف نشر الوعي وتعزيز الإدماج.',
    icon: MessagesSquareIcon,
  },
];

type FaqItem = {
  question: string;
  answer: ReactNode;
};

const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: 'ما هي جمعية شمس للكفيف والمبصر؟',
    answer:
      'جمعية شمس للكفيف والمبصر هي منظمة مغربية بمدينة بني ملال، تهدف إلى دعم إدماج المكفوفين وضعاف البصر في المجتمع، من خلال أنشطة وبرامج تعليمية وتربوية وتقنية واجتماعية.',
  },
  {
    question: 'ما هي أبرز الأنشطة التي تنظمها الجمعية؟',
    answer:
      'تنظم الجمعية مجموعة متنوعة من الأنشطة، من بينها دورات تعلم طريقة برايل، والتكوين في مجال الحاسوب والتقنيات، والورشات الحرفية، والأنشطة التربوية والترفيهية للأطفال، واللقاءات الثقافية والتوعوية.',
  },
  {
    question: 'هل تقدم الجمعية دورات تدريبية؟',
    answer:
      'نعم، تنظم الجمعية دورات وورشات تدريبية لفائدة المكفوفين وضعاف البصر، تشمل مجالات تعليمية وتقنية مختلفة.',
  },
  {
    question: 'هل يمكن للأطفال الاستفادة من أنشطة الجمعية؟',
    answer:
      'نعم، تنظم الجمعية أنشطة تربوية وترفيهية موجهة للأطفال، تشمل الألعاب والورشات التفاعلية والصبيحات التربوية والمخيمات والخرجات الاستكشافية.',
  },
  {
    question: 'كيف يمكنني الانخراط في الجمعية؟',
    answer: (
      <>
        يمكنك الاطلاع على معلومات الانخراط وشروطه من خلال{' '}
        <a className="home-faq__link" href="/membership">
          صفحة الانخراط
        </a>{' '}
        في الموقع.
      </>
    ),
  },
  {
    question: 'كيف يمكنني التواصل مع الجمعية؟',
    answer: (
      <>
        يمكنك التواصل مع الجمعية عبر{' '}
        <a className="home-faq__link" href="/contact">
          صفحة التواصل
        </a>{' '}
        الموجودة في الموقع.
      </>
    ),
  },
];

const GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/pJLmCJcz61CLmcyz5';

export default function HomePage() {
  const [interestSubmitted, setInterestSubmitted] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (interestSubmitted) {
      successRef.current?.focus();
    }
  }, [interestSubmitted]);

  function handleInterestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const fullName = String(data.get('fullName') ?? '').trim();
    const phone = String(data.get('phone') ?? '').trim();

    if (!fullName || !phone) {
      return;
    }

    setInterestSubmitted(true);
  }

  return (
    <>
      {/* 1. Hero — Golden Voice */}
      <section
        className="section section--plain section--pad-none home-hero-section"
        style={{ backgroundColor: '#f2bc2d' }}
      >
        <div className="container">
          <div className="home-hero">
            {/* Right side in RTL: competition message */}
            <div className="home-hero__content">
              <div className="home-hero__intro">
                <p className="home-hero__eyebrow">مسابقة الصوت الذهبي</p>
                <h1 className="home-hero__title">صوتك يستحق أن يُسمع</h1>
                <p className="home-hero__lead">
                  اكتشف مسابقة الصوت الذهبي، وامنح صوتك فرصة ليصل ويترك أثرًا.
                </p>
              </div>

              <div className="home-hero__actions">
                <a className="btn btn--primary btn--lg" href="/golden-voice">
                  اكتشف المسابقة
                </a>
                <a className="btn btn--secondary btn--lg" href="/contact">
                  تواصل معنا
                </a>
              </div>

              <a
                className="maps-proof"
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="maps-proof__row">
                  <span className="maps-proof__stars" aria-hidden="true">
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                  </span>
                  <span className="maps-proof__name">Google Maps</span>
                </span>
                <span className="maps-proof__meta">التقييم وعدد المراجعات قيد التحديث</span>
                <span className="maps-proof__cta">
                  شاهد آراء الزوار <span aria-hidden="true">←</span>
                </span>
              </a>
            </div>

            {/* Left side in RTL: competition interest card */}
            <div className="card home-hero__card">
              {interestSubmitted ? (
                <div
                  ref={successRef}
                  className="home-hero__success"
                  role="status"
                  tabIndex={-1}
                >
                  <span className="home-hero__success-icon" aria-hidden="true">
                    <CheckIcon />
                  </span>
                  <h2 className="home-hero__success-title">تم استلام طلبك بنجاح</h2>
                  <p className="home-hero__success-text">
                    شكراً لك على اهتمامك بمسابقة الصوت الذهبي. سنتواصل معك عند الحاجة.
                  </p>
                  <button
                    type="button"
                    className="btn btn--outline btn--md"
                    onClick={() => setInterestSubmitted(false)}
                  >
                    إرسال طلب آخر
                  </button>
                </div>
              ) : (
                <form className="home-hero__form" onSubmit={handleInterestSubmit}>
                  <span className="badge badge--accent home-hero__badge">الصوت الذهبي</span>
                  <h2 className="home-hero__card-title">هل أنت مستعد لإسماع صوتك؟</h2>

                  <div className="field">
                    <label className="field__label" htmlFor="hero-full-name">
                      الاسم الكامل
                      <span className="field__required" aria-hidden="true">
                        *
                      </span>
                    </label>
                    <input
                      className="input"
                      id="hero-full-name"
                      name="fullName"
                      autoComplete="name"
                      placeholder="اكتب اسمك الكامل"
                      required
                    />
                  </div>

                  <div className="field">
                    <label className="field__label" htmlFor="hero-phone">
                      رقم الهاتف
                      <span className="field__required" aria-hidden="true">
                        *
                      </span>
                    </label>
                    <input
                      className="input"
                      id="hero-phone"
                      name="phone"
                      type="tel"
                      dir="rtl"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="أدخل رقم هاتفك"
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn--primary btn--lg btn--full">
                    <span className="btn__label">أرغب في المشاركة</span>
                  </button>
                  <p className="home-hero__card-note">
                    أدخل بياناتك لإبداء الرغبة في المشاركة في المسابقة.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quick access */}
      <section className="section section--muted section--pad-default" aria-label="خدمات وروابط سريعة">
        <div className="container">
          <div className="section-heading">
            <h2 className="section-heading__title">خدمات وروابط سريعة</h2>
            <p className="section-heading__lead">
              وصول مباشر إلى أبرز الخدمات والمعلومات التي تحتاجها كعضو أو زائر.
            </p>
          </div>
          <div className="grid grid--240">
            {QUICK_LINKS.map((item) => (
              <div key={item.to} className="card quick-card">
                <div className="card__header">
                  <span className="quick-tile" aria-hidden="true">
                    <item.icon />
                  </span>
                  <h3 className="card-title">{item.title}</h3>
                </div>
                <div className="card__body">
                  <p className="card-text">{item.description}</p>
                </div>
                <div className="card__footer card__footer--stretch">
                  <a className="btn btn--outline btn--md btn--full" href={item.to}>
                    استكشف
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. About preview */}
      <section className="section section--default section--pad-default">
        <div className="container">
          <div className="about-preview">
            <div className="about-preview__text">
              <div className="section-heading about-preview__heading">
                <p className="section-heading__eyebrow">من نحن</p>
                <h2 className="section-heading__title">عن الجمعية</h2>
                <p className="section-heading__lead">
                  جمعية شمس للكفيف والمبصر هي منظمة مغربية رائدة تأسست بمدينة بني ملال، وتشكّل
                  جسراً تضامنياً يهدف إلى تحقيق الإدماج الشامل للمكفوفين وضعاف البصر داخل المجتمع
                  جنباً إلى جنب مع المبصرين. تسعى الجمعية جاهدة إلى كسر الحواجز وتغيير النظرة
                  النمطية من خلال تقديم برامج متنوعة تشمل الدعم الاجتماعي، والأنشطة الرياضية،
                  واللقاءات الثقافية والتربوية، بالإضافة إلى تنظيم المخيمات الصيفية. وتُمثل
                  الجمعية، بقيادة رئيسها عزالدين الهاشمي، نموذجاً حياً للتكافل الاجتماعي والعمل
                  الإنساني الذي يطمح إلى تمكين ذوي الإعاقة البصرية وتطوير مهاراتهم ليكونوا عناصر
                  فاعلة ومستقلة في محيطهم.
                </p>
              </div>
              <a className="btn btn--outline btn--md" href="/about">
                اقرأ المزيد
              </a>
            </div>
            <div className="about-preview__media">
              <div className="video-embed">
                <iframe
                  src="https://www.youtube.com/embed/Q4_kmdvNwLg"
                  title="فيديو عن جمعية شمس للكفيف والمبصر"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Activities preview */}
      <section className="section section--muted section--pad-default">
        <div className="container">
          <div className="section-heading">
            <h2 className="section-heading__title">أنشطتنا</h2>
            <p className="section-heading__lead">
              تتنوع أنشطة الجمعية لتشمل مجالات تعليمية، وتقنية، وتربوية، واجتماعية تسعى كلها
              إلى دمج الكفيف في محيطه.
            </p>
          </div>
          <div className="grid">
            {ACTIVITIES.map((item, index) => (
              <article key={item.title} className="card card--fill activity-card">
                <div className="activity-card__top">
                  <span className="activity-card__number" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="activity-card__icon" aria-hidden="true">
                    <item.icon />
                  </span>
                </div>
                <h3 className="activity-card__title">{item.title}</h3>
                <p className="activity-card__text">{item.text}</p>
              </article>
            ))}
          </div>
          <div className="stack stack--column stack--center stack--gap-md section-action">
            <a className="btn btn--secondary btn--md" href="/activities">
              اكتشف أنشطتنا
            </a>
          </div>
        </div>
      </section>

      {/* 5. FAQ */}
      <section className="section section--muted section--pad-default">
        <div className="container">
          <div className="section-heading">
            <h2 className="section-heading__title">الأسئلة الشائعة</h2>
            <p className="section-heading__lead">
              إليك بعض الإجابات عن الأسئلة الأكثر شيوعاً حول الجمعية وأنشطتها.
            </p>
          </div>
          <div className="home-faq">
            {FAQ_ITEMS.map((item, index) => (
              <details key={item.question} className="home-faq__item" open={index === 0}>
                <summary className="home-faq__question">
                  <span className="home-faq__question-text">{item.question}</span>
                  <span className="home-faq__icon" aria-hidden="true" />
                </summary>
                <div className="home-faq__answer">{item.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Membership CTA */}
      <FinalCTA
        tone="muted"
        title="انضم إلينا"
        text="كن جزءاً من مجتمع يسعى إلى النمو والتضامن المتبادل. يمنحك الانخراط فرصة الوصول إلى برامج الجمعية وفعالياتها والمساهمة الفعالة في خدمة المجتمع."
      />
    </>
  );
}
