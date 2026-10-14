import { Link } from 'react-router-dom';
import {
  announcementExcerpt,
  buildAnnouncementImage,
  formatAnnouncementDate,
} from '@/data/announcementsService';
import type { ApiAnnouncement } from '@/data/announcementsService';

export interface AnnouncementCardProps {
  readonly announcement: ApiAnnouncement;
}

/**
 * Public announcement card: image, publication date, title, short excerpt and a
 * clear "اقرأ المزيد" action. The whole card links to the details page.
 */
export default function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const image = buildAnnouncementImage(announcement.imageUrl, announcement.title);
  const date = formatAnnouncementDate(announcement.publishedAt);

  return (
    <article className="ann-card">
      <Link
        className="ann-card__link"
        to={`/announcements/${announcement.slug}`}
        aria-label={announcement.title}
      >
        <div className="ann-card__media">
          <img
            src={image.src}
            srcSet={image.srcSet || undefined}
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 92vw"
            alt={announcement.title}
            width={800}
            height={500}
            loading="lazy"
            decoding="async"
            onError={(event) => {
              const fallback = image.fallbackSrc;
              if (fallback && event.currentTarget.src !== fallback) {
                event.currentTarget.removeAttribute('srcset');
                event.currentTarget.src = fallback;
              }
            }}
          />
        </div>

        <div className="ann-card__body">
          {date ? (
            <time className="ann-card__date" dateTime={announcement.publishedAt ?? undefined}>
              {date}
            </time>
          ) : null}
          <h3 className="ann-card__title">{announcement.title}</h3>
          <p className="ann-card__excerpt">{announcementExcerpt(announcement.body)}</p>
          <span className="ann-card__more">اقرأ المزيد</span>
        </div>
      </Link>
    </article>
  );
}
