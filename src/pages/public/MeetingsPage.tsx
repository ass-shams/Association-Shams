import { useState } from 'react';
import FinalCTA from '@/components/finalCTA';

function FileTextIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 2v4" />
      <path d="M16 2v4" />
    </svg>
  );
}

type MeetingStatus = 'scheduled' | 'held' | 'cancelled';

interface MeetingItem {
  id: string;
  title: string;
  status: MeetingStatus;
  hasMinutes: boolean;
}

const STATUS_LABELS: Record<MeetingStatus, string> = {
  scheduled: 'مبرمج',
  held: 'منعقد',
  cancelled: 'ملغى',
};

const STATUS_TONES: Record<MeetingStatus, string> = {
  scheduled: 'info',
  held: 'success',
  cancelled: 'neutral',
};

const FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'held', label: 'منعقد' },
  { id: 'scheduled', label: 'مبرمج' },
  { id: 'cancelled', label: 'ملغى' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

const MEETINGS: readonly MeetingItem[] = [
  { id: 'general-assembly', title: 'الجمعية العامة العادية', status: 'held', hasMinutes: true },
  { id: 'board-meeting-1', title: 'اجتماع المكتب المسير', status: 'held', hasMinutes: true },
  { id: 'board-meeting-2', title: 'اجتماع تنسيقي للمكتب المسير', status: 'scheduled', hasMinutes: false },
  { id: 'extraordinary', title: 'الجمعية العامة الاستثنائية', status: 'scheduled', hasMinutes: false },
  { id: 'cancelled-session', title: 'جلسة عمل مؤجلة', status: 'cancelled', hasMinutes: false },
];

export default function MeetingsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');

  const visibleMeetings = MEETINGS.filter(
    (meeting) => activeFilter === 'all' || meeting.status === activeFilter,
  );

  return (
    <>
      <section className="section section--default section--pad-default">
        <div className="container">
          <div className="page-hero">
            <p className="page-hero__eyebrow">المحاضر والاجتماعات</p>
            <h1 className="page-hero__title">المحاضر والاجتماعات</h1>
            <p className="page-hero__lead">
              نشر محاضر اجتماعات الجمعية العامة والمكتب المسير، بما يضمن الشفافية وتيسير الوصول
              إلى الوثائق الرسمية للأعضاء والزوار.
            </p>
            <div className="page-hero__actions">
              <a className="btn btn--outline btn--lg" href="/contact">
                استفسار عن محضر
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Filter + list */}
      <section className="section section--muted section--pad-default">
        <div className="container">
          <div className="section-heading">
            <h2 className="section-heading__title">محاضر الاجتماعات</h2>
            <p className="section-heading__lead">
              تصفّح الاجتماعات المنعقدة والمبرمجة، واطّلع على المحاضر المتاحة.
            </p>
          </div>

          <div className="filter" role="group" aria-label="حالة الاجتماع">
            {FILTERS.map((filter) => {
              const isActive = filter.id === activeFilter;

              return (
                <button
                  key={filter.id}
                  type="button"
                  className={isActive ? 'filter__button filter__button--active' : 'filter__button'}
                  aria-pressed={isActive}
                  onClick={() => setActiveFilter(filter.id)}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {visibleMeetings.length === 0 ? (
            <div className="card empty">
              <div className="card__body empty__body">
                <FileTextIcon />
                <h3 className="empty__title">لا توجد اجتماعات في هذه الحالة</h3>
                <p className="empty__text">
                  لم يتم تسجيل أي اجتماع ضمن هذه الحالة بعد. يرجى اختيار حالة أخرى أو مراجعة
                  الصفحة لاحقاً.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid--320">
              {visibleMeetings.map((meeting) => (
                <div key={meeting.id} className="card card--fill">
                  <div className="card__header">
                    <span className={`badge badge--${STATUS_TONES[meeting.status]}`}>
                      {STATUS_LABELS[meeting.status]}
                    </span>
                    <h3 className="meeting-card__title">{meeting.title}</h3>
                  </div>
                  <div className="card__body meeting-card__body">
                    <dl className="meta-list">
                      <div className="meta-row">
                        <dt>تاريخ الاجتماع</dt>
                        <dd>التاريخ قيد التحديث</dd>
                      </div>
                      <div className="meta-row">
                        <dt>المحضر</dt>
                        <dd>{meeting.hasMinutes ? 'متوفر' : 'غير متوفر'}</dd>
                      </div>
                    </dl>
                    <p className="meeting-note">
                      <CalendarIcon />
                      تُنشر تفاصيل الاجتماع ومحضره بعد المصادقة عليه من الجهات المختصة.
                    </p>
                  </div>
                  <div className="card__footer card__footer--stretch">
                    <button
                      type="button"
                      className="btn btn--outline btn--sm btn--full"
                      disabled={!meeting.hasMinutes}
                    >
                      {meeting.hasMinutes ? 'عرض المحضر' : 'المحضر غير متوفر'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Help CTA */}
      <FinalCTA
        tone="default"
        title="هل تحتاج إلى محضر معيّن؟"
        text="إذا كنت تبحث عن محضر اجتماع غير متوفر حالياً، تواصل معنا وسنوافيك بالمعلومة في أقرب وقت ممكن."
      />
    </>
  );
}
