import type { ReactElement } from 'react';
import FinalCTA from '@/components/finalCTA';
import { activityImages } from '@/data/activityImages';

/**
 * Activities page — card-driven composition for جمعية شمس للكفيف والمبصر.
 *
 * The page is built around the eight official activity categories. It uses a
 * single image (the Hero) and relies on cards, icons, numbers, typography and
 * section backgrounds for the rest of the layout. No figures, dates, partners
 * or achievements are invented.
 */

function EducationIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1.2 2.7 3 6 3s6-1.8 6-3v-5" />
      <path d="M22 10v6" />
    </svg>
  );
}

function RecreationIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 3a5 5 0 0 1 5 5c0 3.2-2.6 5.7-5 8-2.4-2.3-5-4.8-5-8a5 5 0 0 1 5-5Z" />
      <path d="M12 16v3" />
      <path d="M9.5 21h5" />
    </svg>
  );
}

function TripIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="4" y="3" width="16" height="14" rx="2" />
      <path d="M4 11h16" />
      <path d="M8 17v2" />
      <path d="M16 17v2" />
      <path d="M8 14h.01" />
      <path d="M16 14h.01" />
    </svg>
  );
}

function CampIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M3.5 20 12 4l8.5 16" />
      <path d="M12 20v-7" />
      <path d="M12 13l3.5 7" />
      <path d="M12 13 8.5 20" />
    </svg>
  );
}

function TrainingIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M3 4h18v11H3z" />
      <path d="M12 15v5" />
      <path d="M8 20h8" />
      <path d="M8 8h5" />
      <path d="M8 11h8" />
    </svg>
  );
}

function SocialIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 21s-7-4.35-9.4-8.5A5 5 0 0 1 12 6a5 5 0 0 1 9.4 6.5C19 16.65 12 21 12 21Z" />
    </svg>
  );
}

function SkillsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M3 17 9 11l4 4 8-8" />
      <path d="M14 7h7v7" />
    </svg>
  );
}

function ArtIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 3a9 9 0 0 0 0 18 2 2 0 0 0 2-2v-1a2 2 0 0 1 2-2h1a3 3 0 0 0 3-3 9 9 0 0 0-8-8Z" />
      <circle cx="7.5" cy="12" r="1" />
      <circle cx="10" cy="8.5" r="1" />
      <circle cx="14.5" cy="8.5" r="1" />
      <circle cx="17" cy="12" r="1" />
    </svg>
  );
}

function LearnIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function GrowIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 1 4 10.5c-.6.6-1 1.5-1 2.5h-6c0-1-.4-1.9-1-2.5A6 6 0 0 1 12 3Z" />
    </svg>
  );
}

type IconComponent = () => ReactElement;

interface Activity {
  readonly number: string;
  readonly title: string;
  readonly description: string;
  readonly icon: IconComponent;
}

/** The eight official activity categories — the main content of the page. */
const ACTIVITIES: readonly Activity[] = [
  {
    number: '01',
    title: 'أنشطة تربوية',
    description: 'أنشطة وبرامج تربوية تهدف إلى التعلم وتنمية الوعي والمهارات في أجواء محفزة.',
    icon: EducationIcon,
  },
  {
    number: '02',
    title: 'أنشطة ترفيهية',
    description: 'أنشطة ترفيهية متنوعة توفر أجواء ممتعة وتشجع على التفاعل والمشاركة.',
    icon: RecreationIcon,
  },
  {
    number: '03',
    title: 'رحلات',
    description: 'رحلات وخرجات تتيح للمستفيدين اكتشاف محيطهم والاستمتاع بتجارب جماعية جديدة.',
    icon: TripIcon,
  },
  {
    number: '04',
    title: 'مخيمات',
    description: 'مخيمات تجمع بين الترفيه والتعلم والتفاعل، وتوفر تجارب جماعية غنية للمستفيدين.',
    icon: CampIcon,
  },
  {
    number: '05',
    title: 'دورات تكوينية',
    description: 'دورات وورشات تساعد على اكتساب معارف ومهارات جديدة وتطوير القدرات.',
    icon: TrainingIcon,
  },
  {
    number: '06',
    title: 'مبادرات اجتماعية',
    description: 'مبادرات تهدف إلى تعزيز التضامن والمشاركة وخدمة المجتمع.',
    icon: SocialIcon,
  },
  {
    number: '07',
    title: 'تقوية المهارات والقدرات',
    description: 'برامج وأنشطة تساعد المستفيدين على تطوير مهاراتهم وقدراتهم وتعزيز استقلاليتهم.',
    icon: SkillsIcon,
  },
  {
    number: '08',
    title: 'أنشطة فنية',
    description: 'أنشطة فنية تفتح المجال أمام التعبير والإبداع واكتشاف المواهب.',
    icon: ArtIcon,
  },
];

interface MiniFeature {
  readonly title: string;
  readonly text: string;
  readonly icon: IconComponent;
}

const MINI_FEATURES: readonly MiniFeature[] = [
  { title: 'نتعلم', text: 'نكتسب معارف ومهارات جديدة في أجواء محفزة.', icon: LearnIcon },
  { title: 'نشارك', text: 'نبني علاقات ونعمل ضمن فريق واحد.', icon: ShareIcon },
  { title: 'نتطور', text: 'نعزز الثقة والاستقلالية وننمو خطوة بخطوة.', icon: GrowIcon },
];

/** Reusable activity card: number, icon, title, description and accent. */
function ActivityCard({ item }: { item: Activity }) {
  return (
    <article className="act-card">
      <span className="act-card__number" aria-hidden="true">
        {item.number}
      </span>
      <span className="act-card__icon" aria-hidden="true">
        <item.icon />
      </span>
      <h3 className="act-card__title">{item.title}</h3>
      <p className="act-card__text">{item.description}</p>
      <span className="act-card__accent" aria-hidden="true" />
    </article>
  );
}

export default function ActivitiesPage() {
  const { hero } = activityImages;

  return (
    <>
      {/* 1. Hero — the only image on the page */}
      <section className="section act-hero" aria-labelledby="act-hero-title">
        <div className="container">
          <div className="act-hero__inner">
            <div className="act-hero__content">
              <p className="act-eyebrow">أنشطتنا</p>
              <h1 id="act-hero-title" className="act-hero__title">
                نصنع لحظات، نبني مهارات، ونفتح آفاقاً
              </h1>
              <p className="act-hero__lead">
                تتنوع أنشطة جمعية شمس للكفيف والمبصر بين التربية والترفيه والتكوين والرحلات
                والمبادرات الاجتماعية، بهدف تنمية المهارات وتعزيز المشاركة والإدماج.
              </p>
              <div className="act-hero__actions">
                <a className="btn btn--primary btn--lg" href="/contact">
                  تواصل معنا
                </a>
                <a className="btn btn--outline btn--lg" href="/membership">
                  انضم إلينا
                </a>
              </div>
            </div>

            <div className="act-hero__media">
              <img
                src={hero.src}
                alt={hero.alt}
                style={hero.position ? { objectPosition: hero.position } : undefined}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Introduction */}
      <section className="section act-intro" aria-labelledby="act-intro-title">
        <div className="container">
          <div className="act-intro__inner">
            <div className="act-intro__head">
              <p className="act-eyebrow">مجالاتنا</p>
              <h2 id="act-intro-title" className="act-h2">
                أنشطة متنوعة لكل فئة
              </h2>
            </div>
            <p className="act-intro__lead">
              نحرص على تقديم أنشطة متنوعة تجمع بين التعلم والترفيه والتكوين والمشاركة
              الاجتماعية، بما يساهم في تطوير قدرات المستفيدين وتعزيز اندماجهم في المجتمع.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Main activities grid */}
      <section
        id="activities-grid"
        className="section section--muted act-grid-section"
        aria-labelledby="act-grid-title"
      >
        <div className="container">
          <header className="act-section-head act-section-head--center">
            <p className="act-eyebrow">المجالات</p>
            <h2 id="act-grid-title" className="act-h2">
              مجالات أنشطتنا
            </h2>
            <p className="act-section-head__lead">
              اكتشف أهم المجالات التي تشكل جزءاً من أنشطة جمعية شمس للكفيف والمبصر.
            </p>
          </header>

          <div className="act-grid">
            {ACTIVITIES.map((item) => (
              <ActivityCard key={item.number} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Supporting section */}
      <section className="section act-more" aria-labelledby="act-more-title">
        <div className="container">
          <header className="act-section-head act-section-head--center">
            <h2 id="act-more-title" className="act-h2">
              أكثر من أنشطة
            </h2>
            <p className="act-section-head__lead">
              نؤمن بأن النشاط فرصة للتعلم والتعبير وبناء العلاقات واكتساب الثقة والقدرة على
              المشاركة.
            </p>
          </header>

          <ul className="act-more__grid">
            {MINI_FEATURES.map((item) => (
              <li key={item.title} className="act-more__item">
                <span className="act-more__icon" aria-hidden="true">
                  <item.icon />
                </span>
                <h3 className="act-more__title">{item.title}</h3>
                <p className="act-more__text">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5. Shared final CTA */}
      <FinalCTA
        title="كن جزءاً من أنشطتنا"
        text="سواء كنت من المكفوفين وضعاف البصر أو من الراغبين في دعم العمل الجمعوي، فإن أنشطتنا تفتح لك باب المشاركة والتعلّم والإدماج."
      />
    </>
  );
}
