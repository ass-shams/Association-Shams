/**
 * Centralised image configuration for the About page.
 *
 * These are the association's REAL photographs, imported locally from
 * `src/assets/aboutimage/`. Each entry is used exactly once across the page.
 *
 * `position` maps to CSS `object-position` and is used only to keep important
 * subjects (people, banners) inside the frame when a section crops the image.
 */
import image01 from '@/assets/aboutimage/image01.jpg';
import image02 from '@/assets/aboutimage/image02.jpg';
import image03 from '@/assets/aboutimage/image03.jpg';
import image04 from '@/assets/aboutimage/image04.jpg';
import image05 from '@/assets/aboutimage/image05.jpg';
import image06 from '@/assets/aboutimage/image06.jpg';
import image07 from '@/assets/aboutimage/image07.jpg';
import image08 from '@/assets/aboutimage/image08.jpg';

export interface AboutImage {
  /** Local image import. */
  readonly src: string;
  /** Arabic alt text describing the image (accessibility). */
  readonly alt: string;
  /** Optional CSS object-position used when the section crops the image. */
  readonly position?: string;
}

export const aboutImages = {
  /** Hero — primary portrait: honouring a beneficiary. */
  heroPrimary: {
    src: image01,
    alt: 'رجل يضع نظارة شمسية إلى جانب امرأة تحمل شهادة تكريم خلال حفل للجمعية',
    position: 'center',
  },
  /** Hero — overlapping square: two members with an award certificate. */
  heroSecondary: {
    src: image02,
    alt: 'رجلان يحملان شهادة تكريم خلال حفل للجمعية',
    position: 'center',
  },
  /** Intro ("جسر نحو الإدماج") — the association group with its banner. */
  storyPrimary: {
    src: image07,
    alt: 'مجموعة تحمل لافتة جمعية شمس للكفيف والمبصر أمام سيارة النقل',
    position: 'center 78%',
  },
  /** What we do — children in a learning session. */
  offeringPrimary: {
    src: image03,
    alt: 'أطفال يجلسون في فضاء تعليمي بإشراف مؤطِّرة خلال نشاط للجمعية',
    position: 'center 42%',
  },
  /** Gallery — large image: collective outing in nature. */
  galleryPrimary: {
    src: image05,
    alt: 'مجموعة من المشاركين في رحلة جماعية إلى الطبيعة',
    position: 'center 62%',
  },
  /** Gallery — supporting: sports activity on the beach. */
  gallerySecondary: {
    src: image06,
    alt: 'مجموعة من الأطفال في ملابس رياضية خلال نشاط على الشاطئ',
    position: 'center',
  },
  /** Gallery — third image: community gathering in a park. */
  galleryTertiary: {
    src: image08,
    alt: 'مشاركون في خرج جماعي بفضاء طبيعي',
    position: 'center',
  },
  /** Human impact — workshop and exchange. */
  impact: {
    src: image04,
    alt: 'مشاركون يتفاعلون حول طاولة خلال ورشة أو لقاء للجمعية',
    position: 'center',
  },
} satisfies Record<string, AboutImage>;
