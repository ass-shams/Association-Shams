import { useEffect, useMemo, useState } from 'react';
import DataStatePanel from '../components/DataStatePanel';
import AnnouncementForm from '../components/AnnouncementForm';
import SectionPage from '../components/SectionPage';
import StatCard from '../components/StatCard';
import { AlertIcon, BarChartIcon, MegaphoneIcon } from '../components/icons';
import { AdminApiError } from '../services/adminApi';
import {
  deleteAnnouncement,
  listAnnouncements,
  setAnnouncementStatus,
} from '../services/announcementsService';
import type { AdminAnnouncement } from '../services/announcementsService';
import type { AnnouncementStatus } from '@/data/announcementValidation';

const FALLBACK_LOAD_ERROR = 'تعذّر تحميل الإعلانات. المرجو المحاولة مرة أخرى.';
const FALLBACK_DELETE_ERROR = 'تعذّر حذف الإعلان. المرجو المحاولة مرة أخرى.';
const FALLBACK_STATUS_ERROR = 'تعذّر تحديث حالة الإعلان. المرجو المحاولة مرة أخرى.';
const SAVED_DRAFT_MESSAGE = 'تم حفظ الإعلان كمسودة.';
const SAVED_PUBLISHED_MESSAGE = 'تم نشر الإعلان.';
const DELETED_MESSAGE = 'تم حذف الإعلان.';
const PUBLISHED_MESSAGE = 'تم نشر الإعلان.';
const UNPUBLISHED_MESSAGE = 'تم إلغاء نشر الإعلان.';
const MUTED = '—';

function formatDate(iso: string | null): string {
  if (!iso) {
    return MUTED;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString('ar-MA', { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * Announcements management section.
 *
 * Shows real announcement statistics and the managed list, with a reusable form
 * to add/edit announcements (including secure image upload), quick
 * publish/unpublish, and confirmed deletion. The public `/announcements` pages
 * read the same records through `/api/announcements`.
 */
export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAnnouncement | null>(null);
  const [deleting, setDeleting] = useState<AdminAnnouncement | null>(null);
  const [isDeleting, setDeletingBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setAnnouncements(await listAnnouncements());
    } catch (loadError) {
      setError(loadError instanceof AdminApiError ? loadError.message : FALLBACK_LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const handle = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(handle);
  }, [feedback]);

  const stats = useMemo(() => {
    let published = 0;
    for (const announcement of announcements) {
      if (announcement.status === 'published') {
        published += 1;
      }
    }
    return {
      total: announcements.length,
      published,
      drafts: announcements.length - published,
    };
  }, [announcements]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(announcement: AdminAnnouncement) {
    setEditing(announcement);
    setFormOpen(true);
  }

  function handleSaved(saved: AdminAnnouncement, status: AnnouncementStatus) {
    setAnnouncements((current) => {
      const exists = current.some((item) => item.id === saved.id);
      return exists
        ? current.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...current];
    });
    setFormOpen(false);
    setEditing(null);
    setFeedback(status === 'published' ? SAVED_PUBLISHED_MESSAGE : SAVED_DRAFT_MESSAGE);
  }

  async function handleToggleStatus(announcement: AdminAnnouncement) {
    if (statusBusyId) {
      return;
    }
    const nextStatus: AnnouncementStatus =
      announcement.status === 'published' ? 'draft' : 'published';
    setStatusBusyId(announcement.id);
    setStatusError(null);
    try {
      const saved = await setAnnouncementStatus(announcement.id, nextStatus);
      setAnnouncements((current) =>
        current.map((item) => (item.id === saved.id ? saved : item)),
      );
      setFeedback(nextStatus === 'published' ? PUBLISHED_MESSAGE : UNPUBLISHED_MESSAGE);
    } catch (statusErr) {
      setStatusError(
        statusErr instanceof AdminApiError ? statusErr.message : FALLBACK_STATUS_ERROR,
      );
    } finally {
      setStatusBusyId(null);
    }
  }

  async function handleDelete() {
    if (!deleting || isDeleting) {
      return;
    }
    setDeletingBusy(true);
    setDeleteError(null);
    try {
      await deleteAnnouncement(deleting.id);
      setAnnouncements((current) => current.filter((item) => item.id !== deleting.id));
      setDeleting(null);
      setFeedback(DELETED_MESSAGE);
    } catch (deleteErr) {
      setDeleteError(
        deleteErr instanceof AdminApiError ? deleteErr.message : FALLBACK_DELETE_ERROR,
      );
    } finally {
      setDeletingBusy(false);
    }
  }

  return (
    <SectionPage description="إدارة الإعلانات: الإضافة والتعديل والنشر وإلغاء النشر والحذف.">
      <div className="dash-store">
        {loading ? (
          <DataStatePanel
            variant="loading"
            title="جارٍ تحميل الإعلانات…"
            description="المرجو الانتظار قليلاً."
          />
        ) : error ? (
          <DataStatePanel
            variant="error"
            title="تعذّر تحميل الإعلانات"
            description={error}
            action={
              <button type="button" className="btn btn--primary btn--md" onClick={() => void load()}>
                <span className="btn__label">إعادة المحاولة</span>
              </button>
            }
          />
        ) : (
          <>
            <div className="dash-stats">
              <StatCard label="إجمالي الإعلانات" value={stats.total} icon={<MegaphoneIcon />} />
              <StatCard label="الإعلانات المنشورة" value={stats.published} icon={<BarChartIcon />} />
              <StatCard label="المسودات" value={stats.drafts} icon={<AlertIcon />} />
            </div>

            <div className="dash-store__toolbar">
              <button type="button" className="btn btn--primary btn--md" onClick={openCreate}>
                <span className="btn__label">إضافة إعلان جديد</span>
              </button>
            </div>

            {feedback ? (
              <p className="dash-store__feedback" role="status">
                {feedback}
              </p>
            ) : null}

            {statusError ? (
              <p className="form-alert" role="alert">
                {statusError}
              </p>
            ) : null}

            {announcements.length === 0 ? (
              <DataStatePanel
                variant="empty"
                title="لا توجد إعلانات"
                description="أضف أول إعلان ليظهر في صفحة الإعلانات العامة."
              />
            ) : (
              <div className="dash-store__scroll">
                <table className="dash-store__table">
                  <colgroup>
                    <col className="dash-store__col dash-store__col--image" />
                    <col className="dash-store__col dash-store__col--name" />
                    <col className="dash-store__col dash-store__col--updated" />
                    <col className="dash-store__col dash-store__col--status" />
                    <col className="dash-store__col dash-store__col--actions" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">الصورة</th>
                      <th scope="col">العنوان</th>
                      <th scope="col">تاريخ النشر</th>
                      <th scope="col">الحالة</th>
                      <th scope="col">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {announcements.map((announcement) => {
                      const isPublished = announcement.status === 'published';
                      const isBusy = statusBusyId === announcement.id;
                      return (
                        <tr key={announcement.id}>
                          <td className="dash-store__cell">
                            <img
                              className="dash-store__thumb"
                              src={announcement.imageUrl}
                              alt={announcement.title}
                              loading="lazy"
                            />
                          </td>
                          <td className="dash-store__cell dash-store__cell--name">
                            {announcement.title}
                          </td>
                          <td className="dash-store__cell">
                            {formatDate(announcement.publishedAt)}
                          </td>
                          <td className="dash-store__cell">
                            <span
                              className={
                                isPublished
                                  ? 'dash-store__badge dash-store__badge--available'
                                  : 'dash-store__badge dash-store__badge--unavailable'
                              }
                            >
                              {isPublished ? 'منشور' : 'مسودة'}
                            </span>
                          </td>
                          <td className="dash-store__cell">
                            <div className="dash-store__actions">
                              <button
                                type="button"
                                className="btn btn--outline btn--sm"
                                onClick={() => openEdit(announcement)}
                              >
                                <span className="btn__label">تعديل</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn--outline btn--sm"
                                disabled={isBusy}
                                onClick={() => void handleToggleStatus(announcement)}
                              >
                                <span className="btn__label">
                                  {isBusy
                                    ? 'جارٍ التحديث…'
                                    : isPublished
                                      ? 'إلغاء النشر'
                                      : 'نشر'}
                                </span>
                              </button>
                              <button
                                type="button"
                                className="btn btn--ghost btn--sm dash-store__delete"
                                onClick={() => {
                                  setDeleteError(null);
                                  setDeleting(announcement);
                                }}
                              >
                                <span className="btn__label">حذف</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {formOpen ? (
          <AnnouncementForm
            initial={editing}
            onCancel={() => {
              setFormOpen(false);
              setEditing(null);
            }}
            onSaved={handleSaved}
          />
        ) : null}

        {deleting ? (
          <div className="dash-store__modal" role="dialog" aria-modal="true" aria-label="تأكيد الحذف">
            <button
              type="button"
              className="dash-store__modal-backdrop"
              aria-label="إلغاء"
              onClick={() => setDeleting(null)}
            />
            <div className="dash-store__modal-panel dash-store__modal-panel--confirm">
              <h3 className="dash-store__modal-title">تأكيد حذف الإعلان</h3>
              <p className="dash-store__confirm-text">
                هل أنت متأكد من حذف «{deleting.title}»؟ لا يمكن التراجع عن هذه العملية.
              </p>
              {deleteError ? (
                <p className="form-alert" role="alert">
                  {deleteError}
                </p>
              ) : null}
              <div className="dash-store__modal-actions">
                <button
                  type="button"
                  className="btn btn--danger btn--md"
                  disabled={isDeleting}
                  onClick={() => void handleDelete()}
                >
                  {isDeleting ? <span className="btn__spinner" aria-hidden="true" /> : null}
                  <span className="btn__label">{isDeleting ? 'جارٍ الحذف…' : 'تأكيد الحذف'}</span>
                </button>
                <button
                  type="button"
                  className="btn btn--outline btn--md"
                  disabled={isDeleting}
                  onClick={() => setDeleting(null)}
                >
                  <span className="btn__label">إلغاء</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </SectionPage>
  );
}
