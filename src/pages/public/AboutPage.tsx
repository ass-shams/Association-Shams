import { useState } from 'react';
import FinalCTA from '@/components/finalCTA';
import { aboutImages } from '@/data/aboutImages';
import type { AboutImage } from '@/data/aboutImages';

/**
 * About page — editorial composition adapted to جمعية شمس للكفيف والمبصر.
 *
 * All copy reuses content already approved elsewhere in the project (the
 * homepage "about" description and activity list). No organisational facts,
 * figures or statistics are invented. The association's real images are
 * centralised in `src/data/aboutImages.ts` so they can be swapped without
 * touching this file.
 */

function TargetIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Renders a local image (with object-position) and a graceful fallback if it fails to load. */
function FigureImage({
  image,
  className,
  priority = false,
}: {
  image: AboutImage;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const classes = className ? `about-media ${className}` : 'about-media';
  const style = image.position ? { objectPosition: image.position } : undefined;

  if (failed || !image.src) {
    return (
      <span className={`${classes} about-media--placeholder`} role="img" aria-label={image.alt}>
        <span className="about-media__mark" aria-hidden="true" />
      </span>
    );
  }

  return (
    <img
      className={classes}
      src={image.src}
      alt={image.alt}
      style={style}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

const pad = (value: number) => String(value).padStart(2, '0');

const VALUES = [
  { title: 'الالتزام', text: 'الوفاء بالالتزامات تجاه المجتمع والأعضاء.' },
  { title: 'التعاون', text: 'العمل المشترك لتحقيق أهداف مشتركة.' },
  { title: 'الشفافية', text: 'الوضوح في الإجراءات والقرارات.' },
  { title: 'المسؤولية', text: 'تحمّل المسؤولية تجاه المجتمع وأعضائه.' },
  { title: 'المشاركة', text: 'تشجيع المشاركة الفعالة من جميع الفئات.' },
  { title: 'خدمة المجتمع', text: 'توجيه الجهود لخدمة الصالح العام.' },
];

/**
 * Qualitative impact pillars.
 *
 * The project contains no approved statistics, so no figures are fabricated
 * here. These pillars reuse themes already stated in the approved content.
 */
const PILLARS = [
  { value: 'الإدماج', text: 'دمج المكفوفين وضعاف البصر في المجتمع جنباً إلى جنب مع المبصرين.' },
  { value: 'التمكين', text: 'تطوير مهارات المستفيدين ليكونوا عناصر فاعلة ومستقلة في محيطهم.' },
  { value: 'التضامن', text: 'بناء جسر تضامني يجمع المجتمع حول قضايا الإعاقة البصرية.' },
  { value: 'الوعي', text: 'كسر الحواجز وتغيير النظرة النمطية تجاه الإعاقة البصرية.' },
];

const OFFERINGS = [
  {
    title: 'التعليم والتكوين',
    text: 'دورات وورشات لتعلّم قراءة وكتابة طريقة برايل، إلى جانب مهارات استخدام الحاسوب.',
  },
  {
    title: 'التكنولوجيا والتقنيات الميسّرة',
    text: 'تكوين على استخدام الهواتف الذكية والتقنيات التعويضية لمواكبة التطور التكنولوجي.',
  },
  {
    title: 'الأنشطة التربوية والترفيهية',
    text: 'صبيحات تربوية وألعاب وورشات تفاعلية، إضافة إلى المخيمات والخرجات الاستكشافية.',
  },
  {
    title: 'الورشات والحرف',
    text: 'ورشات لتعليم مهارات الصياغة والتركيب وتطوير القدرات الإبداعية للمستفيدين.',
  },
  {
    title: 'اللقاءات الثقافية والتوعوية',
    text: 'لقاءات وأمسيات ثقافية وفنية لنشر الوعي وتعزيز الإدماج.',
  },
];

export default function AboutPage() {
  return (
    <>
      {/* 1. Hero */}
      <section className="section about-hero" aria-labelledby="about-hero-title">
        <div className="container">
          <div className="about-hero__inner">
            <div className="about-hero__content">
              <p className="about-eyebrow">من نحن</p>
              <h1 id="about-hero-title" className="about-hero__title">
                جمعية شمس للكفيف والمبصر
              </h1>
              <p className="about-hero__statement">نبني جسوراً نحو الإدماج والتمكين</p>
              <p className="about-hero__lead">
                جمعية مغربية بمدينة بني ملال، تعمل على تحقيق الإدماج الشامل للمكفوفين وضعاف
                البصر جنباً إلى جنب مع المبصرين، وتمكينهم عبر برامج تعليمية وتربوية وتقنية
                واجتماعية.
              </p>
              <div className="about-hero__actions">
                <a className="btn btn--primary btn--lg btn--join" href="/membership">
                  انخرط معنا
                </a>
                <a className="btn btn--outline btn--lg" href="/contact">
                  تواصل معنا
                </a>
              </div>
            </div>

            <div className="about-hero__visual">
              <div className="about-hero__frame about-hero__frame--main">
                <FigureImage image={aboutImages.heroPrimary} priority />
              </div>
              <div className="about-hero__frame about-hero__frame--accent">
                <FigureImage image={aboutImages.heroSecondary} />
              </div>
              <p className="about-hero__tag">
                <span className="about-hero__tag-mark" aria-hidden="true" />
                بني ملال · المغرب
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Intro / who we are */}
      <section className="section section--muted about-story" aria-labelledby="about-story-title">
        <div className="container">
          <div className="about-story__grid">
            <div className="about-story__media">
              <div className="about-story__frame about-story__frame--main">
                <FigureImage image={aboutImages.storyPrimary} />
              </div>
              <span className="about-story__accent" aria-hidden="true" />
            </div>

            <div className="about-story__content">
              <p className="about-eyebrow">عن الجمعية</p>
              <h2 id="about-story-title" className="about-h2">
                جسر نحو الإدماج
              </h2>
              <p className="about-story__text">
                جمعية شمس للكفيف والمبصر هي منظمة مغربية رائدة تأسست بمدينة بني ملال، وتشكّل
                جسراً تضامنياً يهدف إلى تحقيق الإدماج الشامل للمكفوفين وضعاف البصر داخل المجتمع
                جنباً إلى جنب مع المبصرين.
              </p>
              <p className="about-story__text">
                تسعى الجمعية جاهدة إلى كسر الحواجز وتغيير النظرة النمطية من خلال تقديم برامج
                متنوعة تشمل الدعم الاجتماعي، والأنشطة الرياضية، واللقاءات الثقافية والتربوية،
                بالإضافة إلى تنظيم المخيمات الصيفية. وتُمثل الجمعية، بقيادة رئيسها عزالدين
                الهاشمي، نموذجاً حياً للتكافل الاجتماعي والعمل الإنساني الذي يطمح إلى تمكين ذوي
                الإعاقة البصرية وتطوير مهاراتهم ليكونوا عناصر فاعلة ومستقلة في محيطهم.
              </p>

              <dl className="about-story__facts">
                <div className="about-story__fact">
                  <dt>المقر</dt>
                  <dd>بني ملال، المغرب</dd>
                </div>
                <div className="about-story__fact">
                  <dt>الفئة المستفيدة</dt>
                  <dd>المكفوفون وضعاف البصر</dd>
                </div>
              </dl>

              <a className="btn btn--outline btn--md" href="/activities">
                اكتشف أنشطتنا
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Mission & vision */}
      <section className="section section--default about-mv" aria-label="رسالتنا ورؤيتنا">
        <div className="container">
          <div className="about-mv__panel">
            <article className="about-mv__item">
              <span className="about-mv__icon" aria-hidden="true">
                <TargetIcon />
              </span>
              <h2 className="about-mv__title">رسالتنا</h2>
              <p className="about-mv__text">
                تمكين المكفوفين وضعاف البصر عبر برامج تعليمية وتربوية وتقنية واجتماعية، وكسر
                الحواجز وتغيير النظرة النمطية، لبناء مجتمع يحتضن الإدماج إلى جانب المبصرين.
              </p>
            </article>

            <article className="about-mv__item about-mv__item--accent">
              <span className="about-mv__icon" aria-hidden="true">
                <EyeIcon />
              </span>
              <h2 className="about-mv__title">رؤيتنا</h2>
              <p className="about-mv__text">
                مجتمع يُدمج فيه المكفوفون وضعاف البصر جنباً إلى جنب مع المبصرين، ويكون فيه كل
                فرد عنصراً فاعلاً ومستقلاً في محيطه.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* 4. Values */}
      <section className="section section--muted about-values" aria-labelledby="about-values-title">
        <div className="container">
          <header className="about-section-head">
            <p className="about-eyebrow">قيمنا</p>
            <h2 id="about-values-title" className="about-h2">
              ما الذي يقود عملنا؟
            </h2>
            <p className="about-section-head__lead">
              المبادئ التي توجّه عملنا وتحدّد علاقتنا بالمجتمع وأعضائنا.
            </p>
          </header>

          <ul className="about-values__grid">
            {VALUES.map((item, index) => (
              <li key={item.title} className="about-value">
                <span className="about-value__index" aria-hidden="true">
                  {pad(index + 1)}
                </span>
                <h3 className="about-value__title">{item.title}</h3>
                <p className="about-value__text">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5. Impact pillars (no fabricated figures) */}
      <section className="section about-pillars" aria-labelledby="about-pillars-title">
        <div className="container">
          <header className="about-section-head about-section-head--center">
            <p className="about-eyebrow">أثرنا</p>
            <h2 id="about-pillars-title" className="about-h2">
              أثر نبنيه يوماً بعد يوم
            </h2>
          </header>

          <ul className="about-pillars__grid">
            {PILLARS.map((item) => (
              <li key={item.value} className="about-pillar">
                <span className="about-pillar__value">{item.value}</span>
                <p className="about-pillar__text">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. What we do */}
      <section className="section section--muted about-offer" aria-labelledby="about-offer-title">
        <div className="container">
          <div className="about-offer__grid">
            <div className="about-offer__content">
              <p className="about-eyebrow">مجالات عملنا</p>
              <h2 id="about-offer-title" className="about-h2">
                ماذا نقدم؟
              </h2>
              <p className="about-section-head__lead">
                تتنوع برامج الجمعية لتشمل مجالات تعليمية وتقنية وتربوية واجتماعية، تسعى كلها إلى
                دمج الكفيف في محيطه.
              </p>

              <ol className="about-offer__list">
                {OFFERINGS.map((item, index) => (
                  <li key={item.title} className="about-offer__item">
                    <span className="about-offer__index" aria-hidden="true">
                      {pad(index + 1)}
                    </span>
                    <div className="about-offer__item-body">
                      <h3 className="about-offer__item-title">{item.title}</h3>
                      <p className="about-offer__item-text">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="about-offer__media">
              <div className="about-offer__frame about-offer__frame--main">
                <FigureImage image={aboutImages.offeringPrimary} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Image story / human side */}
      <section className="section section--default about-gallery-section" aria-labelledby="about-gallery-title">
        <div className="container">
          <header className="about-section-head">
            <p className="about-eyebrow">صور من الميدان</p>
            <h2 id="about-gallery-title" className="about-h2">
              لحظات تصنع الفرق
            </h2>
          </header>

          <div className="about-gallery">
            <figure className="about-gallery__item about-gallery__item--primary">
              <FigureImage image={aboutImages.galleryPrimary} />
            </figure>
            <figure className="about-gallery__item about-gallery__item--secondary">
              <FigureImage image={aboutImages.gallerySecondary} />
            </figure>
            <figure className="about-gallery__item about-gallery__item--tertiary">
              <FigureImage image={aboutImages.galleryTertiary} />
            </figure>
          </div>

          <p className="about-gallery__caption">
            لكل فرد مكانه في المجتمع، وعملنا اليومي هو صناعة الفرص التي تجعل ذلك ممكناً.
          </p>
        </div>
      </section>

      {/* 8. Human impact */}
      <section className="section section--muted about-impact" aria-labelledby="about-impact-title">
        <div className="container">
          <div className="about-impact__grid">
            <div className="about-impact__media">
              <FigureImage image={aboutImages.impact} />
            </div>

            <div className="about-impact__text">
              <p className="about-eyebrow">التزام إنساني</p>
              <h2 id="about-impact-title" className="about-h2">
                نؤمن بأن الإدماج يبدأ بالفرصة
              </h2>
              <p className="about-impact__lead">
                نؤمن بأن الإدماج لا يتحقق بالشفقة، بل بالفرصة: فرصة التعلّم، والتكوين، والمشاركة.
                لذلك نعمل على تمكين المكفوفين وضعاف البصر من تطوير مهاراتهم وبناء استقلاليتهم
                ليأخذوا مكانهم الطبيعي كأعضاء فاعلين في المجتمع.
              </p>
              <a className="btn btn--primary btn--md" href="/membership">
                كن جزءاً من المسار
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Video / real story (reuses the approved association video) */}
      <section className="section section--default about-video" aria-labelledby="about-video-title">
        <div className="container">
          <header className="about-section-head about-section-head--center">
            <p className="about-eyebrow">شاهد</p>
            <h2 id="about-video-title" className="about-h2">
              تعرّف على جمعية شمس
            </h2>
            <p className="about-section-head__lead">
              لمحة عن أنشطة الجمعية وبرامجها، وكيف تساهم في تعزيز الإدماج والتمكين.
            </p>
          </header>

          <div className="video-embed about-video__embed">
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
      </section>

      {/* 10. Shared final CTA */}
      <FinalCTA
        title="انضم إلينا"
        text="إذا كنت مهتماً بالمساهمة في عمل الجمعية أو الاستفادة من برامجها، فنحن نوفر لك الطريق المناسب للانخراط."
      />
    </>
  );
}
