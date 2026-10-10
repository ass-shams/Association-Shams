import { useCallback, useEffect, useState } from 'react';
import DataStatePanel from '../components/DataStatePanel';
import SectionPage from '../components/SectionPage';
import { AdminApiError } from '../services/adminApi';
import { listContactRequests, updateContactRequestStatus } from '../services/contactRequestsService';
import type {
  ContactRequest,
  ContactRequestsResult,
  ContactStatus,
} from '../services/contactRequestsService';

const STATUS_LABELS: Record<ContactStatus, string> = {
  new: 'جديد',
  in_progress: 'قيد المعالجة',
  resolved: 'تم الحل',
};

const STATUS_ORDER: readonly ContactStatus[] = ['new', 'in_progress', 'resolved'];

const STATUS_FILTERS: readonly { value: ContactStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'new', label: 'جديد' },
  { value: 'in_progress', label: 'قيد المعالجة' },
  { value: 'resolved', label: 'تم الحل' },
];

const PAGE_SIZE = 10;
const PREVIEW_LENGTH = 140;
const FALLBACK_LOAD_ERROR = 'تعذّر تحميل طلبات الاتصال. المرجو المحاولة مرة أخرى.';
const FALLBACK_UPDATE_ERROR = 'تعذّر تحديث حالة الطلب. المرجو المحاولة مرة أخرى.';

function previewOf(message: string): string {
  const collapsed = message.replace(/\s+/g, ' ').trim();
  return collapsed.length > PREVIEW_LENGTH
    ? `${collapsed.slice(0, PREVIEW_LENGTH)}…`
    : collapsed;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString('ar-MA', { dateStyle: 'medium', timeStyle: 'short' });
}

function StatusBadge({ status }: { status: ContactStatus }) {
  return (
    <span className={`dash-contacts__badge dash-contacts__badge--${status}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function ContactRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<ContactRequestsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<ContactRequest | null>(null);
  const [isUpdating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listContactRequests({
        status: statusFilter,
        search: searchTerm,
        page,
        pageSize: PAGE_SIZE,
      });
      setResult(data);
    } catch (loadError) {
      setError(loadError instanceof AdminApiError ? loadError.message : FALLBACK_LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, page]);

  useEffect(() => {
    void load();
  }, [load]);

  // Debounce the search box.
  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(1);
      setSearchTerm(searchInput.trim());
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // Auto-dismiss transient feedback.
  useEffect(() => {
    if (!feedback) {
      return;
    }
    const handle = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(handle);
  }, [feedback]);

  function selectFilter(value: ContactStatus | 'all') {
    setStatusFilter(value);
    setPage(1);
  }

  async function changeStatus(request: ContactRequest, next: ContactStatus) {
    if (next === request.status || isUpdating) {
      return;
    }
    setUpdating(true);
    setFeedback(null);
    try {
      const updated = await updateContactRequestStatus(request.id, next);
      setResult((current) =>
        current
          ? { ...current, data: current.data.map((item) => (item.id === updated.id ? updated : item)) }
          : current,
      );
      setSelected((current) => (current && current.id === updated.id ? updated : current));
      setFeedback({ type: 'success', message: 'تم تحديث حالة الطلب.' });
    } catch (updateError) {
      setFeedback({
        type: 'error',
        message: updateError instanceof AdminApiError ? updateError.message : FALLBACK_UPDATE_ERROR,
      });
    } finally {
      setUpdating(false);
    }
  }

  async function copyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      setFeedback({ type: 'success', message: 'تم نسخ البريد الإلكتروني.' });
    } catch {
      setFeedback({ type: 'error', message: 'تعذّر نسخ البريد الإلكتروني.' });
    }
  }

  const total = result?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requests = result?.data ?? [];

  return (
    <SectionPage description="مراجعة رسائل طلبات الاتصال الواردة من الموقع وإدارة حالتها.">
      <div className="dash-contacts">
        <div className="dash-contacts__toolbar">
          <div className="dash-contacts__search">
            <input
              className="input"
              type="search"
              value={searchInput}
              placeholder="ابحث بالاسم أو البريد أو الموضوع"
              aria-label="بحث في طلبات الاتصال"
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          <div className="dash-contacts__filters" role="group" aria-label="تصفية حسب الحالة">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={`dash-contacts__filter${
                  statusFilter === filter.value ? ' is-active' : ''
                }`}
                aria-pressed={statusFilter === filter.value}
                onClick={() => selectFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {feedback ? (
          <p
            className={`dash-contacts__feedback dash-contacts__feedback--${feedback.type}`}
            role="status"
          >
            {feedback.message}
          </p>
        ) : null}

        {loading ? (
          <DataStatePanel
            variant="loading"
            title="جارٍ تحميل الطلبات…"
            description="المرجو الانتظار قليلاً."
          />
        ) : error ? (
          <DataStatePanel
            variant="error"
            title="تعذّر تحميل الطلبات"
            description={error}
            action={
              <button type="button" className="btn btn--primary btn--md" onClick={() => void load()}>
                <span className="btn__label">إعادة المحاولة</span>
              </button>
            }
          />
        ) : requests.length === 0 ? (
          <DataStatePanel
            variant="empty"
            title="لا توجد طلبات اتصال"
            description="ستظهر هنا الرسائل الواردة من نموذج الاتصال في الموقع."
          />
        ) : (
          <>
            <ul className="dash-contacts__list">
              {requests.map((request) => (
                <li className="dash-contacts__row" key={request.id}>
                  <div className="dash-contacts__main">
                    <p className="dash-contacts__name">{request.name}</p>
                    <p className="dash-contacts__email">{request.email}</p>
                    {request.phone ? (
                      <p className="dash-contacts__phone">{request.phone}</p>
                    ) : null}
                    {request.subject ? (
                      <p className="dash-contacts__subject">{request.subject}</p>
                    ) : null}
                    <p className="dash-contacts__preview">{previewOf(request.message)}</p>
                  </div>

                  <div className="dash-contacts__meta">
                    <StatusBadge status={request.status} />
                    <time className="dash-contacts__date" dateTime={request.created_at}>
                      {formatDate(request.created_at)}
                    </time>
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() => setSelected(request)}
                    >
                      <span className="btn__label">عرض</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {totalPages > 1 ? (
              <div className="dash-contacts__pagination">
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <span className="btn__label">السابق</span>
                </button>
                <span className="dash-contacts__page-info">
                  الصفحة {page} من {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  <span className="btn__label">التالي</span>
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      {selected ? (
        <div
          className="dash-contacts__modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dash-contact-detail-title"
        >
          <button
            type="button"
            className="dash-contacts__modal-backdrop"
            aria-label="إغلاق التفاصيل"
            onClick={() => setSelected(null)}
          />

          <div className="dash-contacts__modal-panel">
            <div className="dash-contacts__modal-head">
              <h3 className="dash-contacts__modal-title" id="dash-contact-detail-title">
                {selected.subject || 'رسالة اتصال'}
              </h3>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setSelected(null)}
              >
                <span className="btn__label">إغلاق</span>
              </button>
            </div>

            <dl className="dash-contacts__fields">
              <div className="dash-contacts__field">
                <dt>الاسم</dt>
                <dd>{selected.name}</dd>
              </div>
              <div className="dash-contacts__field">
                <dt>البريد الإلكتروني</dt>
                <dd>
                  <a href={`mailto:${selected.email}`}>{selected.email}</a>
                </dd>
              </div>
              {selected.phone ? (
                <div className="dash-contacts__field">
                  <dt>رقم الهاتف</dt>
                  <dd>
                    <a href={`tel:${selected.phone}`}>{selected.phone}</a>
                  </dd>
                </div>
              ) : null}
              <div className="dash-contacts__field">
                <dt>تاريخ الإرسال</dt>
                <dd>{formatDate(selected.created_at)}</dd>
              </div>
              <div className="dash-contacts__field">
                <dt>الحالة</dt>
                <dd>
                  <StatusBadge status={selected.status} />
                </dd>
              </div>
            </dl>

            <p className="dash-contacts__message">{selected.message}</p>

            <div className="dash-contacts__detail-actions">
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => void copyEmail(selected.email)}
              >
                <span className="btn__label">نسخ البريد الإلكتروني</span>
              </button>
              <a className="btn btn--outline btn--sm" href={`mailto:${selected.email}`}>
                <span className="btn__label">إرسال بريد</span>
              </a>
            </div>

            <div className="dash-contacts__status-actions" role="group" aria-label="تغيير الحالة">
              {STATUS_ORDER.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`dash-contacts__filter${
                    selected.status === status ? ' is-active' : ''
                  }`}
                  disabled={isUpdating}
                  aria-pressed={selected.status === status}
                  onClick={() => void changeStatus(selected, status)}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </SectionPage>
  );
}
