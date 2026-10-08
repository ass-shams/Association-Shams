import { Link } from 'react-router-dom';
import type { Competition } from '@/types';

export interface CompetitionCardProps {
  readonly competition: Competition;
}

const CTA_LABEL = 'المشاركة في المسابقة';

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 2v4" />
      <path d="M16 2v4" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/**
 * Reusable competition card: cover image, status badge, title, short
 * description, compact metadata and the main call to action.
 */
export default function CompetitionCard({ competition }: CompetitionCardProps) {
  const isActive = competition.status === 'مفتوحة';
  const cardClass = isActive
    ? 'card card--fill competition-card competition-card--active'
    : 'card card--fill competition-card';

  const hasMeta =
    competition.registrationDeadline !== undefined || competition.participantsCount !== undefined;

  return (
    <article className={cardClass}>
      <div className="competition-card__media">
        {competition.image ? (
          <img
            src={competition.image.src}
            alt={competition.image.alt}
            style={
              competition.image.position ? { objectPosition: competition.image.position } : undefined
            }
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ) : null}
      </div>

      <div className="card__body competition-card__body">
        <div className="competition-card__head">
          {competition.status ? (
            <span className="badge badge--success competition-card__status">
              <span className="competition-card__status-dot" aria-hidden="true" />
              {competition.status}
            </span>
          ) : null}
          <h3 className="card__title competition-card__title">{competition.title}</h3>
        </div>

        <p className="card__text competition-card__text">{competition.description}</p>

        {hasMeta ? (
          <ul className="competition-card__meta">
            {competition.registrationDeadline ? (
              <li className="competition-card__meta-item">
                <span className="competition-card__meta-icon" aria-hidden="true">
                  <CalendarIcon />
                </span>
                <span className="competition-card__meta-body">
                  <span className="competition-card__meta-label">انتهاء التسجيل</span>
                  <span className="competition-card__meta-value">
                    {competition.registrationDeadline}
                  </span>
                </span>
              </li>
            ) : null}

            {competition.participantsCount !== undefined ? (
              <li className="competition-card__meta-item">
                <span className="competition-card__meta-icon" aria-hidden="true">
                  <UsersIcon />
                </span>
                <span className="competition-card__meta-body">
                  <span className="competition-card__meta-label">المسجلون</span>
                  <span className="competition-card__meta-value">
                    {competition.participantsCount} مشارك
                  </span>
                </span>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>

      <div className="card__footer competition-card__footer">
        {competition.href ? (
          <Link
            className="btn btn--primary btn--md btn--full btn--swipe competition-card__cta"
            to={competition.href}
          >
            {CTA_LABEL}
          </Link>
        ) : (
          <span
            className="btn btn--primary btn--md btn--full competition-card__cta"
            aria-disabled="true"
          >
            {CTA_LABEL}
          </span>
        )}
      </div>
    </article>
  );
}
