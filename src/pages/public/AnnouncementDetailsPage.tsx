import { Link, useParams } from 'react-router-dom';
import Breadcrumb from '@/components/Breadcrumb';
import {
  announcementExcerpt,
  formatAnnouncementDate,
  useAnnouncement,
} from '@/data/announcementsService';
import { usePageSeo } from '@/lib/seo';

const ANNOUNCEMENTS_DESCRIPTION =
  'تابع آخر إعلانات جمعية شمس للكفيف والمبصر: المستجدات والأنشطة والمواعيد المهمة والمعلومات الموجّهة للمنخرطين والعموم.';

/**
 * Public announcement details (`/announcements/:slug`).
 *
 * Reads the announcement from the slug in the URL. Draft, unpublished and
 * scheduled announcements are never returned by the public endpoint, so an
 * inaccessible slug resolves to the same "not found" state as a missing one.
 */
export default function AnnouncementDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { announcement, loading, error, notFound, reload } = useAnnouncement(slug);

  const announcementPath = `/announcements/${slug ?? ''}`;

  usePageSeo({
    pageTitle: announcement ? announcement.title : 'الإعلانات',
    description: announcement
      ? announcementExcerpt(announcement.body, 200) || ANNOUNCEMENTS_DESCRIPTION
      : ANNOUNCEMENTS_DESCRIPTION,
    path: announcementPath,
    image: announcement?.imageUrl,
    imageAlt: announcement?.title,
    breadcrumbs: announcement
      ? [
          { name: 'الرئيسية', path: '/' },
          { name: 'الإعلانات', path: '/announcements' },
          { name: announcement.title, path: announcementPath },
        ]
      : undefined,
  });

  if (loading) {
    return (
      <section className="section section--pad-default">
        <div className="container">
          <p className="store-state" role="status">
            جارٍ تحميل الإعلان…
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section section--pad-default">
        <div className="container">
          <div className="ann-empty">
            <p className="store-state store-state--error" role="alert">
              {error}
            </p>
            <button type="button" className="btn btn--outline btn--md" onClick={reload}>
              <span className="btn__label">إعادة المحاولة</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (notFound || !announcement) {
    return (
      <section className="section section--pad-default">
        <div className="container">
          <div className="error-box">
            <h1>الإعلان غير موجود</h1>
            <p>عذراً، لم نتمكن من العثور على الإعلان المطلوب. ربما تمت إزالته أو تغيّر رابطه.</p>
            <Link className="error-link" to="/announcements">
              العودة إلى الإعلانات
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const date = formatAnnouncementDate(announcement.publishedAt);
  const paragraphs = announcement.body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return (
    <section className="section section--pad-default ann-detail" aria-labelledby="ann-detail-title">
      <div className="container">
        <Breadcrumb
          items={[
            { label: 'الرئيسية', to: '/' },
            { label: 'الإعلانات', to: '/announcements' },
            { label: announcement.title },
          ]}
        />

        <article className="ann-detail__article">
          <header className="ann-detail__header">
            {date ? (
              <time className="ann-detail__date" dateTime={announcement.publishedAt ?? undefined}>
                {date}
              </time>
            ) : null}
            <h1 id="ann-detail-title" className="ann-detail__title">
              {announcement.title}
            </h1>
          </header>

          <img
            className="ann-detail__image"
            src={announcement.imageUrl}
            alt={announcement.title}
            width={1200}
            height={675}
            decoding="async"
          />

          <div className="ann-detail__body">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <div className="ann-detail__footer">
            <Link className="btn btn--outline btn--md" to="/announcements">
              <span className="btn__label">العودة إلى الإعلانات</span>
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
