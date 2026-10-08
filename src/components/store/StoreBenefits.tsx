import type { ReactElement } from 'react';

function TagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 2.8 12V4.4A1.6 1.6 0 0 1 4.4 2.8H12a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.8Z" />
      <circle cx="7.5" cy="7.5" r="1.4" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 21s-7-4.35-9.4-8.5A5 5 0 0 1 12 6a5 5 0 0 1 9.4 6.5C19 16.65 12 21 12 21Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6l7-3Z" />
      <path d="m9.2 12 2 2 3.6-3.8" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M4 12a8 8 0 0 1 16 0" />
      <rect x="2.5" y="12" width="4" height="6" rx="1.4" />
      <rect x="17.5" y="12" width="4" height="6" rx="1.4" />
      <path d="M20 18a3 3 0 0 1-3 3h-3" />
    </svg>
  );
}

type IconComponent = () => ReactElement;

interface Benefit {
  readonly title: string;
  readonly text: string;
  readonly icon: IconComponent;
}

const BENEFITS: readonly Benefit[] = [
  {
    title: 'منتجات مختارة',
    text: 'قطع ومواد تعكس هوية الجمعية.',
    icon: TagIcon,
  },
  {
    title: 'دعم أنشطة الجمعية',
    text: 'عائد الاقتناء يخدم برامجنا.',
    icon: HeartIcon,
  },
  {
    title: 'جودة واهتمام',
    text: 'اختيار بعناية لكل منتج نوفره.',
    icon: ShieldIcon,
  },
  {
    title: 'خدمة موثوقة',
    text: 'تواصل سهل ومتابعة دقيقة.',
    icon: SupportIcon,
  },
];

/** Compact trust strip shown right under the hero. */
export default function StoreBenefits() {
  return (
    <section
      className="section section--pad-tight store-benefits"
      aria-label="لماذا متجر جمعية شمس"
    >
      <div className="container">
        <ul className="store-benefits__list">
          {BENEFITS.map((item) => (
            <li key={item.title} className="store-benefit">
              <span className="store-benefit__icon" aria-hidden="true">
                <item.icon />
              </span>
              <span className="store-benefit__body">
                <span className="store-benefit__title">{item.title}</span>
                <span className="store-benefit__text">{item.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
