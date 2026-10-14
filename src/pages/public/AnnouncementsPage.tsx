import Breadcrumb from '@/components/Breadcrumb';
import AnnouncementCard from '@/components/announcements/AnnouncementCard';
import { useAnnouncements } from '@/data/announcementsService';
import { usePageSeo } from '@/lib/seo';

/**
 * Public announcements listing (`/announcements`).
 *
 * Shows every published, due announcement (newest first) in a responsive card
 * grid. Data comes from `src/data/announcementsService.ts`; drafts and scheduled
 * announcements are filtered out server-side.
 */
export default function AnnouncementsPage() {
  const { announcements, loading, error, reload } = useAnnouncements();

  usePageSeo({
    pageTitle: 'الإعلانات',
    description:
      'تابع آخر إعلانات جمعية شمس للكفيف والمبصر: المستجدات والأنشطة والمواعيد المهمة والمعلومات الموجّهة للمنخرطين والعموم.',
    path: '/announcements',
    breadcrumbs: [
      { name: 'الرئيسية', path: '/' },
      { name: 'الإعلانات', path: '/announcements' },
    ],
  });

  return (
    <>
      <section className="section section--pad-tight ann-hero" aria-labelledby="ann-page-title">
        <div className="container">
          <Breadcrumb items={[{ label: 'الرئيسية', to: '/' }, { label: 'الإعلانات' }]} />

          <div className="section-heading ann-hero__heading">
            <p className="section-heading__eyebrow">جمعية شمس للكفيف و المبصر</p>
            <h1 id="ann-page-title" className="section-heading__title">
              إعلانات جمعية شمس
            </h1>
            <p className="section-heading__lead">
              تجدون هنا آخر إعلانات الجمعية ومستجداتها ومواعيدها المهمة، محدّثة أولاً بأول.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--muted ann-list" aria-label="قائمة الإعلانات">
        <div className="container">
          {loading ? (
            <p className="store-state" role="status">
              جارٍ تحميل الإعلانات…
            </p>
          ) : error ? (
            <div className="ann-empty">
              <p className="store-state store-state--error" role="alert">
                {error}
              </p>
              <button type="button" className="btn btn--outline btn--md" onClick={reload}>
                <span className="btn__label">إعادة المحاولة</span>
              </button>
            </div>
          ) : announcements.length === 0 ? (
            <div className="ann-empty">
              <h2 className="empty__title">لا توجد إعلانات حالياً</h2>
              <p className="empty__text">
                لم تُنشر أي إعلانات بعد. المرجو العودة لاحقاً لمتابعة مستجدات الجمعية.
              </p>
            </div>
          ) : (
            <div className="ann-grid">
              {announcements.map((announcement) => (
                <AnnouncementCard key={announcement.id} announcement={announcement} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
