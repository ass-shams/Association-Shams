import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
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
const PREVIEW_LENGTH = 160;
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

/** One labelled field (label above value). */
function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="dash-contacts__field">
      <span className="dash-contacts__field-label">{label}</span>
      <span className="dash-contacts__field-value">{value}</span>
    </div>
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

  const detailRef = useRef<HTMLElement>(null);

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

  // Drop a selection that is no longer part of the visible result set.
  useEffect(() => {
    if (!result) {
      return;
    }
    setSelected((current) =>
      current && !result.data.some((item) => item.id === current.id) ? null : current,
    );
  }, [result]);

  // On small screens, bring the details panel into view after selecting.
  useEffect(() => {
    if (!selected || typeof window === 'undefined') {
      return;
    }
    if (window.matchMedia('(min-width: 900px)').matches) {
      return;
    }
    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selected]);

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
          ? {
              ...current,
              data: current.data.map((item) => (item.id === updated.id ? updated : item)),
            }
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

  const totalPages = Math.max(1, Math.ceil((result?.count ?? 0) / PAGE_SIZE));
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

        <div className="dash-contacts__layout">
          <div className="dash-contacts__list-col">
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
                  <button
                    type="button"
                    className="btn btn--primary btn--md"
                    onClick={() => void load()}
                  >
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
                    <li key={request.id}>
                      <button
                        type="button"
                        className={`dash-contacts__row${
                          selected?.id === request.id ? ' is-selected' : ''
                        }`}
                        aria-pressed={selected?.id === request.id}
                        onClick={() => setSelected(request)}
                      >
                        <span className="dash-contacts__row-head">
                          <span className="dash-contacts__name">{request.name}</span>
                          <StatusBadge status={request.status} />
                        </span>
                        <span className="dash-contacts__row-line">{request.email}</span>
                        <span className="dash-contacts__row-preview">
                          {request.subject || previewOf(request.message)}
                        </span>
                        <span className="dash-contacts__row-foot">
                          <time className="dash-contacts__row-date" dateTime={request.created_at}>
                            {formatDate(request.created_at)}
                          </time>
                          <span className="dash-contacts__view">عرض</span>
                        </span>
                      </button>
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

          <aside
            ref={detailRef}
            className={`dash-contacts__detail${selected ? ' is-open' : ''}`}
            aria-label="تفاصيل الطلب"
          >
            {selected ? (
              <div className="dash-contacts__panel">
                <div className="dash-contacts__panel-head">
                  <h3 className="dash-contacts__panel-title">
                    {selected.subject || 'بدون موضوع'}
                  </h3>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => setSelected(null)}
                  >
                    <span className="btn__label">إغلاق</span>
                  </button>
                </div>

                <div className="dash-contacts__fields">
                  <Field label="الاسم الكامل" value={selected.name} />
                  <Field
                    label="البريد الإلكتروني"
                    value={<a href={`mailto:${selected.email}`}>{selected.email}</a>}
                  />
                  <Field
                    label="رقم الهاتف"
                    value={
                      selected.phone ? (
                        <a href={`tel:${selected.phone}`}>{selected.phone}</a>
                      ) : (
                        <span className="dash-contacts__muted">غير متوفر</span>
                      )
                    }
                  />
                  <Field
                    label="الموضوع"
                    value={
                      selected.subject || <span className="dash-contacts__muted">بدون موضوع</span>
                    }
                  />
                  <Field label="تاريخ الإرسال" value={formatDate(selected.created_at)} />
                  <div className="dash-contacts__field dash-contacts__field--status">
                    <span className="dash-contacts__field-label">حالة الطلب</span>
                    <div
                      className="dash-contacts__status-control"
                      role="group"
                      aria-label="تغيير حالة الطلب"
                    >
                      {STATUS_ORDER.map((status) => (
                        <button
                          key={status}
                          type="button"
                          className={`dash-contacts__status-option${
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

                <div className="dash-contacts__message-section">
                  <h4 className="dash-contacts__section-title">الرسالة</h4>
                  <p className="dash-contacts__message">{selected.message}</p>
                </div>

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
              </div>
            ) : (
              <div className="dash-contacts__panel dash-contacts__panel--empty">
                <p className="dash-contacts__placeholder">
                  اختر طلباً من القائمة لعرض تفاصيله.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </SectionPage>
  );
}
