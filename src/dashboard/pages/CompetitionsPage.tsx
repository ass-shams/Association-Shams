import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import DataStatePanel from '../components/DataStatePanel';
import SectionPage from '../components/SectionPage';
import StatCard from '../components/StatCard';
import { BarChartIcon, AlertIcon, MailIcon, TrophyIcon, UsersIcon } from '../components/icons';
import { AdminApiError } from '../services/adminApi';
import { listCompetitions, updateCompetition } from '../services/competitionsService';
import type { AdminCompetition } from '../services/competitionsService';
import {
  competitionStatusLabel,
  resolveEffectiveStatus,
} from '@/pages/competitions/status';
import type { CompetitionStatus } from '@/pages/competitions/status';

const FALLBACK_LOAD_ERROR = 'تعذّر تحميل المسابقات. المرجو المحاولة مرة أخرى.';
const FALLBACK_SAVE_ERROR = 'تعذّر تحديث بيانات المسابقة. المرجو المحاولة مرة أخرى.';
const SAVED_MESSAGE = 'تم حفظ إعدادات المسابقة.';
const MUTED = 'غير محدد';

const STATUS_OPTIONS: readonly { value: CompetitionStatus; label: string }[] = [
  { value: 'open', label: 'مفتوحة للتسجيل' },
  { value: 'paused', label: 'متوقفة مؤقتاً' },
  { value: 'closed', label: 'مغلقة' },
];

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString('ar-MA', { dateStyle: 'medium', timeStyle: 'short' });
}

/** ISO timestamp → value for a `datetime-local` input (local time). */
function toDatetimeLocal(iso: string | null): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/**
 * Competitions management section.
 *
 * Shows real statistics and the managed competitions, with a settings form to
 * edit the name, registration status and deadline. Participant counts come from
 * the same records as the Participants section (`golden_voice_registrations`).
 */
export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<AdminCompetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [editing, setEditing] = useState<AdminCompetition | null>(null);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<CompetitionStatus>('open');
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setCompetitions(await listCompetitions());
    } catch (loadError) {
      setError(loadError instanceof AdminApiError ? loadError.message : FALLBACK_LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    if (!editing) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setEditing(null);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editing]);

  const stats = useMemo(() => {
    let open = 0;
    let paused = 0;
    let registrations = 0;

    for (const competition of competitions) {
      const effective = resolveEffectiveStatus(competition.status, competition.registrationDeadline);
      if (effective === 'open') {
        open += 1;
      } else if (effective === 'paused') {
        paused += 1;
      }
      registrations += competition.participantCount;
    }

    return { total: competitions.length, open, paused, registrations };
  }, [competitions]);

  function openSettings(competition: AdminCompetition) {
    setEditing(competition);
    setTitle(competition.title);
    setStatus(competition.status);
    setDeadline(toDatetimeLocal(competition.registrationDeadline));
    setSaveError(null);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || saving) {
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setSaveError('المرجو إدخال اسم المسابقة.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const updated = await updateCompetition({
        id: editing.id,
        title: trimmedTitle,
        status,
        registrationDeadline: deadline ? new Date(deadline).toISOString() : null,
      });
      setCompetitions((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setEditing(null);
      setFeedback(SAVED_MESSAGE);
    } catch (updateError) {
      setSaveError(
        updateError instanceof AdminApiError ? updateError.message : FALLBACK_SAVE_ERROR,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionPage description="إدارة المسابقات المنشورة على الموقع: الحالة، أجل التسجيل وعدد المشاركين.">
      <div className="dash-competitions">
        {loading ? (
          <DataStatePanel
            variant="loading"
            title="جارٍ تحميل المسابقات…"
            description="المرجو الانتظار قليلاً."
          />
        ) : error ? (
          <DataStatePanel
            variant="error"
            title="تعذّر تحميل المسابقات"
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
        ) : (
          <>
            <div className="dash-stats">
              <StatCard label="إجمالي المسابقات" value={stats.total} icon={<TrophyIcon />} />
              <StatCard label="المسابقات المفتوحة" value={stats.open} icon={<BarChartIcon />} />
              <StatCard label="المسابقات المتوقفة" value={stats.paused} icon={<AlertIcon />} />
              <StatCard label="إجمالي المسجلين" value={stats.registrations} icon={<UsersIcon />} />
            </div>

            {feedback ? (
              <p className="dash-competitions__feedback" role="status">
                {feedback}
              </p>
            ) : null}

            {competitions.length === 0 ? (
              <DataStatePanel
                variant="empty"
                title="لا توجد مسابقات"
                description="ستظهر المسابقات التي تضيفها هنا."
              />
            ) : (
              <ul className="dash-competitions__list">
                {competitions.map((competition) => {
                  const effective = resolveEffectiveStatus(
                    competition.status,
                    competition.registrationDeadline,
                  );

                  return (
                    <li className="dash-competitions__item" key={competition.id}>
                      <div className="dash-competitions__info">
                        <div className="dash-competitions__head">
                          <h3 className="dash-competitions__name">{competition.title}</h3>
                          <span
                            className={`dash-competitions__badge dash-competitions__badge--${effective}`}
                          >
                            {competitionStatusLabel(effective)}
                          </span>
                        </div>

                        <p className="dash-competitions__description">{competition.description}</p>

                        <dl className="dash-competitions__meta">
                          <div className="dash-competitions__meta-item">
                            <dt>انتهاء التسجيل</dt>
                            <dd>
                              {competition.registrationDeadline
                                ? formatDateTime(competition.registrationDeadline)
                                : MUTED}
                            </dd>
                          </div>
                          <div className="dash-competitions__meta-item">
                            <dt>المشاركون</dt>
                            <dd>{competition.participantCount.toLocaleString('en-US')}</dd>
                          </div>
                        </dl>
                      </div>

                      <div className="dash-competitions__actions">
                        <Link className="btn btn--outline btn--sm" to="/participants">
                          <span className="btn__label">المشاركون</span>
                        </Link>
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={() => openSettings(competition)}
                        >
                          <span className="btn__label">إعدادات</span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        <div className="dash-competitions__note" role="note">
          <span className="dash-competitions__note-icon" aria-hidden="true">
            <MailIcon />
          </span>
          <p className="dash-competitions__note-text">
            لإضافة مسابقة جديدة ، المرجو التواصل مع مطور موقع الجمعية {' '}
            <a
              className="dash-competitions__note-link"
              href="https://nagriva.ma"
              target="_blank"
              rel="noopener noreferrer"
            >
              رضوان
            </a>
            .
          </p>
        </div>

        {editing ? (
          <div
            className="dash-competitions__modal"
            role="dialog"
            aria-modal="true"
            aria-label="إعدادات المسابقة"
          >
            <button
              type="button"
              className="dash-competitions__modal-backdrop"
              aria-label="إغلاق الإعدادات"
              onClick={() => setEditing(null)}
            />

            <form className="dash-competitions__modal-panel" onSubmit={handleSave} noValidate>
              <div className="dash-competitions__modal-head">
                <h3 className="dash-competitions__modal-title">إعدادات المسابقة</h3>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setEditing(null)}
                >
                  <span className="btn__label">إغلاق</span>
                </button>
              </div>

              {saveError ? (
                <p className="form-alert" role="alert">
                  {saveError}
                </p>
              ) : null}

              <div className="dash-competitions__field">
                <label className="field__label" htmlFor="comp-title">
                  اسم المسابقة
                </label>
                <input
                  className="input"
                  id="comp-title"
                  type="text"
                  value={title}
                  maxLength={200}
                  disabled={saving}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>

              <div className="dash-competitions__field">
                <label className="field__label" htmlFor="comp-status">
                  حالة التسجيل
                </label>
                <select
                  className="input"
                  id="comp-status"
                  value={status}
                  disabled={saving}
                  onChange={(event) => setStatus(event.target.value as CompetitionStatus)}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dash-competitions__field">
                <label className="field__label" htmlFor="comp-deadline">
                  أجل التسجيل
                </label>
                <input
                  className="input"
                  id="comp-deadline"
                  type="datetime-local"
                  value={deadline}
                  disabled={saving}
                  onChange={(event) => setDeadline(event.target.value)}
                />
                <p className="dash-competitions__hint">
                  اترك الحقل فارغاً لعدم تحديد أجل. تعديل الأجل لا يغيّر حالة التسجيل.
                </p>
              </div>

              <div className="dash-competitions__modal-actions">
                <button type="submit" className="btn btn--primary btn--md" disabled={saving}>
                  {saving ? <span className="btn__spinner" aria-hidden="true" /> : null}
                  <span className="btn__label">{saving ? 'جارٍ الحفظ…' : 'حفظ'}</span>
                </button>
                <button
                  type="button"
                  className="btn btn--outline btn--md"
                  disabled={saving}
                  onClick={() => setEditing(null)}
                >
                  <span className="btn__label">إلغاء</span>
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </SectionPage>
  );
}
