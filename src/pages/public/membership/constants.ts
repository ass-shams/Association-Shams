import type { InterestValue } from './types';

/** Single membership fee, identical for every category. Paid offline only. */
export const MEMBERSHIP_FEE_LABEL = 'واجب الانخراط: 50 درهم';

/** Age from which the adult category applies. */
export const ADULT_AGE_THRESHOLD = 18;

/** Exact, approved interest options for the electronic form. */
export const INTEREST_OPTIONS: readonly InterestValue[] = [
  'ثقافية',
  'فنية',
  'رياضية',
  'ترفيهية',
  'تربوية',
];

/** Children category requirements, shown as a checklist. */
export const CHILDREN_REQUIREMENTS: readonly string[] = [
  'نسختان من عقد الازدياد.',
  'صورتان شخصيتان.',
  'نموذج الموافقة للوالدين، قابل للتحميل والطباعة والمصادقة عليه.',
];

/** Adult category requirements (18 years and older). */
export const ADULT_REQUIREMENTS: readonly string[] = [
  'نسخة من البطاقة الوطنية للتعريف.',
  'صورتان شخصيتان.',
];

/** Additional document required for visually impaired applicants. */
export const VISUAL_IMPAIRMENT_CERTIFICATE = 'شهادة الإعاقة البصرية.';

/** In-person submission notice shown before the document cards. */
export const IN_PERSON_SUBMISSION_NOTICE =
  'يجب إيداع جميع الوثائق المطلوبة حضورياً بمكتب الجمعية، بعد تجهيز الملف حسب فئة الانخراط.';

/** Supporting line shown inside the shared fee card. */
export const MEMBERSHIP_FEE_NOTE = 'يؤدى واجب الانخراط حضورياً بمكتب الجمعية.';

/**
 * The standard requirements plus the visual impairment certificate, so the
 * base list stays the single source of truth.
 */
function withVisualImpairmentCertificate(base: readonly string[]): readonly string[] {
  return [...base, VISUAL_IMPAIRMENT_CERTIFICATE];
}

/** Visually impaired children: the children requirements + the certificate. */
export const VISUAL_IMPAIRMENT_CHILD_REQUIREMENTS: readonly string[] =
  withVisualImpairmentCertificate(CHILDREN_REQUIREMENTS);

/** Visually impaired adults: the adult requirements + the certificate. */
export const VISUAL_IMPAIRMENT_ADULT_REQUIREMENTS: readonly string[] =
  withVisualImpairmentCertificate(ADULT_REQUIREMENTS);

/**
 * Official parental consent PDF, served as a static asset from `public/`.
 *
 * Public files are copied unchanged to the build root, so this absolute path
 * resolves in both `vite dev` and the production build. When the file is
 * replaced, keep the same path (or update it here).
 */
export const PARENTAL_CONSENT_PDF_URL = '/documents/namooth-mowafaqa-walidayn.pdf';

/** Arabic filename suggested when downloading the consent form. */
export const PARENTAL_CONSENT_PDF_FILENAME = 'نموذج-الموافقة-للوالدين.pdf';
