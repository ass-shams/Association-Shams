import BackToLanding from './components/BackToLanding';
import {
  ADULT_REQUIREMENTS,
  ADULT_AGE_THRESHOLD,
  CHILDREN_REQUIREMENTS,
  IN_PERSON_SUBMISSION_NOTICE,
  MEMBERSHIP_FEE_LABEL,
  MEMBERSHIP_FEE_NOTE,
  PARENTAL_CONSENT_PDF_FILENAME,
  PARENTAL_CONSENT_PDF_URL,
  VISUAL_IMPAIRMENT_ADULT_REQUIREMENTS,
  VISUAL_IMPAIRMENT_CHILD_REQUIREMENTS,
} from './constants';

export interface MembershipDocumentsProps {
  readonly onBack: () => void;
}

function ChildIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function AdultIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="7" r="4" />
      <path d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" />
    </svg>
  );
}

function VisualImpairmentIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M14 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5Z" />
      <path d="M14 2.5v5h5" />
      <path d="M9 13.5h6" />
      <path d="M9 16.5h4" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function HeadphonesIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
      <rect x="2.5" y="14" width="4" height="6" rx="1.5" />
      <rect x="17.5" y="14" width="4" height="6" rx="1.5" />
    </svg>
  );
}

function FeeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6.5 10v4M17.5 10v4" />
    </svg>
  );
}

/** Requirement checklist shared by every document case. */
function RequirementList({
  items,
  label,
}: {
  readonly items: readonly string[];
  readonly label: string;
}) {
  return (
    <ul className="mem-checklist" aria-label={label}>
      {items.map((item) => (
        <li key={item} className="mem-checklist__item">
          <span className="mem-checklist__mark" aria-hidden="true">
            <CheckIcon />
          </span>
          <span className="mem-checklist__text">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Documents guide view.
 *
 * Children and adults are the two base categories. Visually impaired
 * applicants are not a separate category: they follow the requirements of
 * their age group plus a visual impairment certificate, so both children and
 * adults are covered explicitly. The parental consent subsection lives inside
 * the children card, and a single shared fee card closes the section.
 */
export default function MembershipDocuments({ onBack }: MembershipDocumentsProps) {
  return (
    <section className="section section--default section--pad-default">
      <div className="container">
        <BackToLanding onBack={onBack} />

        <div className="page-hero mem-page-hero">
          <p className="page-hero__eyebrow">الانخراط</p>
          <h1 className="page-hero__title">وثائق الانخراط</h1>
          <p className="page-hero__lead">
            تعرف على الوثائق المطلوبة حسب فئة الانخراط قبل إيداع ملفك. يتم أداء واجب الانخراط
            حضورياً لدى الجمعية.
          </p>
        </div>

        {/* Audio guide */}
        <section className="mem-audio" aria-labelledby="mem-audio-title">
          <header className="mem-audio__head">
            <span className="mem-audio__icon" aria-hidden="true">
              <HeadphonesIcon />
            </span>
            <h2 className="mem-audio__title" id="mem-audio-title">
              استمع إلى شرح وثائق الانخراط
            </h2>
          </header>
          <p className="mem-audio__text">
            استمع إلى شرح مبسط للوثائق المطلوبة لكل فئة، وكيفية تجهيز ملف الانخراط وإيداعه لدى
            الجمعية.
          </p>
          <audio
            className="mem-audio__player"
            controls
            preload="metadata"
            aria-label="الشرح الصوتي لوثائق الانخراط"
          >
            <source src="/voises/Enrollment-documents-voise.mp3" type="audio/mpeg" />
            متصفحك لا يدعم تشغيل الملفات الصوتية.
          </audio>
        </section>

        {/* In-person submission notice */}
        <aside className="mem-notice" aria-labelledby="mem-notice-title">
          <span className="mem-notice__icon" aria-hidden="true">
            <InfoIcon />
          </span>
          <div className="mem-notice__body">
            <h2 className="mem-notice__title" id="mem-notice-title">
              ملاحظة مهمة
            </h2>
            <p className="mem-notice__text">{IN_PERSON_SUBMISSION_NOTICE}</p>
          </div>
        </aside>

        <div className="mem-doc-grid">
          {/* Children card (includes the parental consent subsection) */}
          <div className="mem-doc-column">
            <article className="card mem-doc-card" aria-labelledby="mem-children-title">
              <div className="card__body">
                <header className="mem-doc-card__head">
                  <span className="mem-doc-card__icon" aria-hidden="true">
                    <ChildIcon />
                  </span>
                  <div>
                    <h2 className="mem-doc-card__title" id="mem-children-title">
                      انخراط الأطفال
                    </h2>
                    <p className="mem-doc-card__intro">
                      للأشخاص الذين تقل أعمارهم عن {ADULT_AGE_THRESHOLD} سنة.
                    </p>
                  </div>
                </header>

                <RequirementList
                  items={CHILDREN_REQUIREMENTS}
                  label="وثائق انخراط الأطفال"
                />

                {/* Parental consent subsection (inside the children card) */}
                <section className="mem-consent" aria-labelledby="mem-consent-title">
                  <header className="mem-consent__head">
                    <span className="mem-consent__icon" aria-hidden="true">
                      <PdfIcon />
                    </span>
                    <div>
                      <h3 className="mem-consent__title" id="mem-consent-title">
                        نموذج الموافقة للوالدين
                      </h3>
                      <span className="badge badge--danger">PDF</span>
                    </div>
                  </header>

                  <p className="mem-consent__text">
                    على الوالد أو الوصي القانوني تحميل النموذج وتعبئته وطباعته، ثم المصادقة عليه
                    حسب المسار المعمول به لدى الجمعية.
                  </p>

                  <a
                    className="btn btn--primary btn--md btn--full"
                    href={PARENTAL_CONSENT_PDF_URL}
                    download={PARENTAL_CONSENT_PDF_FILENAME}
                    aria-label="تحميل نموذج الموافقة للوالدين بصيغة PDF"
                  >
                    <span className="btn__label">
                      <DownloadIcon />
                      تحميل نموذج الموافقة (PDF)
                    </span>
                  </a>

                  <p className="mem-consent__note">
                    يجب إيداع الوثائق المكتملة حضورياً بمكتب الجمعية.
                  </p>
                </section>
              </div>
            </article>
          </div>

          {/* Adults + visually impaired (children and adults) */}
          <div className="mem-doc-column">
            <article className="card mem-doc-card" aria-labelledby="mem-adults-title">
              <div className="card__body">
                <header className="mem-doc-card__head">
                  <span className="mem-doc-card__icon" aria-hidden="true">
                    <AdultIcon />
                  </span>
                  <div>
                    <h2 className="mem-doc-card__title" id="mem-adults-title">
                      انخراط الكبار
                    </h2>
                    <p className="mem-doc-card__intro">
                      <span className="badge badge--info">{ADULT_AGE_THRESHOLD} سنة فما فوق</span>
                    </p>
                  </div>
                </header>

                <RequirementList items={ADULT_REQUIREMENTS} label="وثائق انخراط الكبار" />
              </div>
            </article>

            <article className="card mem-doc-card" aria-labelledby="mem-vi-title">
              <div className="card__body">
                <header className="mem-doc-card__head">
                  <span className="mem-doc-card__icon mem-doc-card__icon--accent" aria-hidden="true">
                    <VisualImpairmentIcon />
                  </span>
                  <div>
                    <h2 className="mem-doc-card__title" id="mem-vi-title">
                      وثائق الأشخاص ذوي الإعاقة البصرية
                    </h2>
                    <p className="mem-doc-card__intro">
                      تختلف الوثائق حسب السن، مع إضافة شهادة الإعاقة البصرية.
                    </p>
                  </div>
                </header>

                <div className="mem-vi-group">
                  <h3 className="mem-vi-group__title">للأطفال ذوي الإعاقة البصرية</h3>
                  <RequirementList
                    items={VISUAL_IMPAIRMENT_CHILD_REQUIREMENTS}
                    label="وثائق الأطفال ذوي الإعاقة البصرية"
                  />
                </div>

                <div className="mem-vi-group">
                  <h3 className="mem-vi-group__title">للكبار ذوي الإعاقة البصرية</h3>
                  <RequirementList
                    items={VISUAL_IMPAIRMENT_ADULT_REQUIREMENTS}
                    label="وثائق الكبار ذوي الإعاقة البصرية"
                  />
                </div>
              </div>
            </article>
          </div>
        </div>

        {/* Shared fee card (applies to all categories) */}
        <div className="mem-fee" role="note">
          <span className="mem-fee__icon" aria-hidden="true">
            <FeeIcon />
          </span>
          <div className="mem-fee__body">
            <p className="mem-fee__amount">{MEMBERSHIP_FEE_LABEL}</p>
            <p className="mem-fee__note">{MEMBERSHIP_FEE_NOTE}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
