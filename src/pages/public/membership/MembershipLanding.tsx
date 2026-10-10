import type { ReactNode } from 'react';

export interface MembershipLandingProps {
  readonly onOpenDocuments: () => void;
  readonly onOpenForm: () => void;
}

interface MembershipChoice {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly cta: string;
  readonly icon: ReactNode;
  readonly onSelect: () => void;
  /** `primary` renders the emphasized blue card. */
  readonly variant: 'secondary' | 'primary';
}

function DocumentsIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M14 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5Z" />
      <path d="M14 2.5v5h5" />
      <path d="M9 13.5h6" />
      <path d="M9 16.5h4" />
    </svg>
  );
}

function FormIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
      <path d="M9 2.5h6a1 1 0 0 1 1 1V6H8V3.5a1 1 0 0 1 1-1Z" />
      <path d="M8 11.5h8" />
      <path d="M8 15.5h5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

/**
 * Membership landing view: the introduction and the two primary choices.
 *
 * Each card is a semantic heading + description with a single CTA button whose
 * stretched hit area covers the whole card, so the complete card is clickable
 * without nesting one interactive element inside another.
 */
export default function MembershipLanding({
  onOpenDocuments,
  onOpenForm,
}: MembershipLandingProps) {
  const choices: readonly MembershipChoice[] = [
    {
      id: 'documents',
      title: 'وثائق الانخراط',
      description: 'تعرف على الوثائق المطلوبة حسب فئة الانخراط.',
      cta: 'الاطلاع على الوثائق',
      icon: <DocumentsIcon />,
      onSelect: onOpenDocuments,
      variant: 'secondary',
    },
    {
      id: 'form',
      title: 'الانخراط الإلكتروني',
      description: 'املأ استمارة الانخراط وأخبرنا بميولاتك وانتظاراتك.',
      cta: 'ابدأ الانخراط',
      icon: <FormIcon />,
      onSelect: onOpenForm,
      variant: 'primary',
    },
  ];

  return (
    <>
      <section className="section section--default section--pad-default">
        <div className="container">
          <div className="page-hero">
            <p className="page-hero__eyebrow">الانخراط</p>
            <h1 className="page-hero__title">الانخراط في جمعية شمس</h1>
            <p className="page-hero__lead">
              يمكنك الاطلاع على الوثائق المطلوبة حسب فئة الانخراط، أو تعبئة استمارة الانخراط
              الإلكترونية وإخبارنا بميولاتك وانتظاراتك.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--muted section--pad-default" aria-label="خيارات الانخراط">
        <div className="container">
          <div className="membership-choices">
            {choices.map((choice) => {
              const titleId = `mem-choice-${choice.id}-title`;
              const isPrimary = choice.variant === 'primary';

              return (
                <article
                  key={choice.id}
                  className={`card card--interactive membership-choice membership-choice--${choice.variant}`}
                  aria-labelledby={titleId}
                >
                  <span className="membership-choice__icon" aria-hidden="true">
                    {choice.icon}
                    {isPrimary ? (
                      <span className="membership-choice__accent" aria-hidden="true" />
                    ) : null}
                  </span>
                  <h2 className="membership-choice__title" id={titleId}>
                    {choice.title}
                  </h2>
                  <p className="membership-choice__text">{choice.description}</p>
                  <button
                    type="button"
                    className="membership-choice__cta"
                    aria-labelledby={titleId}
                    onClick={choice.onSelect}
                  >
                    <span className="membership-choice__cta-label">{choice.cta}</span>
                    <ArrowIcon />
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
