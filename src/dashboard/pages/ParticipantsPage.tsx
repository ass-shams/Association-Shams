import { useCallback, useEffect, useRef, useState } from 'react';
import { REGION_OPTIONS } from '@/pages/competitions/golden-voice/constants';
import DataStatePanel from '../components/DataStatePanel';
import SectionPage from '../components/SectionPage';
import { AdminApiError } from '../services/adminApi';
import { getParticipantVideoUrl, listParticipants } from '../services/participantsService';
import type { Participant, ParticipantsResult } from '../services/participantsService';

const PAGE_SIZE = 10;
const FALLBACK_LOAD_ERROR = 'تعذّر تحميل المشاركين. المرجو المحاولة مرة أخرى.';
const FALLBACK_VIDEO_ERROR = 'تعذّر تحميل الفيديو. المرجو المحاولة مرة أخرى.';
const PLAYBACK_ERROR = 'تعذّر تشغيل الفيديو. المرجو المحاولة مرة أخرى.';
const MUTED = '—';
const MAX_SIGNED_URL_RETRIES = 2;

const REGION_LABELS = Object.fromEntries(
  REGION_OPTIONS.map((option) => [option.value, option.label]),
) as Record<Participant['region'], string>;

type StatusTone = 'ok' | 'muted' | 'warn';

function videoStatus(participant: Participant): { label: string; tone: StatusTone } {
  if (participant.hasVideo) {
    return { label: 'الفيديو متوفر', tone: 'ok' };
  }
  if (participant.region === 'beni_mellal_khenifra') {
    return { label: 'غير مطلوب', tone: 'muted' };
  }
  return { label: 'لا يوجد فيديو', tone: 'warn' };
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString('ar-MA', { dateStyle: 'medium', timeStyle: 'short' });
}

function VideoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-3v10l-5-3" />
    </svg>
  );
}

/**
 * Golden Voice participants section.
 *
 * Renders the registrations as a compact, spreadsheet-style table (mirroring
 * the Members page). Participants who attached a video can be previewed and
 * downloaded through short-lived, admin-authorized signed URLs.
 */
export default function ParticipantsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<ParticipantsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [preview, setPreview] = useState<Participant | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isDownloading, setDownloading] = useState(false);
  const retryRef = useRef(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listParticipants({ search: searchTerm, page, pageSize: PAGE_SIZE });
      setResult(data);
    } catch (loadError) {
      setError(loadError instanceof AdminApiError ? loadError.message : FALLBACK_LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, page]);

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

  const loadVideoUrl = useCallback(async (id: string) => {
    setVideoLoading(true);
    setVideoError(null);
    try {
      const { url } = await getParticipantVideoUrl(id);
      setVideoUrl(url);
    } catch (videoLoadError) {
      setVideoError(
        videoLoadError instanceof AdminApiError ? videoLoadError.message : FALLBACK_VIDEO_ERROR,
      );
    } finally {
      setVideoLoading(false);
    }
  }, []);

  function openPreview(participant: Participant) {
    retryRef.current = 0;
    setPreview(participant);
    setVideoUrl(null);
    setVideoError(null);
    void loadVideoUrl(participant.id);
  }

  function closePreview() {
    setPreview(null);
    setVideoUrl(null);
    setVideoError(null);
    setVideoLoading(false);
    setDownloading(false);
    retryRef.current = 0;
  }

  // A signed URL can expire while the modal is open; request a fresh one.
  const handlePlaybackError = useCallback(() => {
    if (!preview || videoLoading) {
      return;
    }
    if (retryRef.current >= MAX_SIGNED_URL_RETRIES) {
      setVideoError(PLAYBACK_ERROR);
      return;
    }
    retryRef.current += 1;
    void loadVideoUrl(preview.id);
  }, [preview, videoLoading, loadVideoUrl]);

  async function handleDownload() {
    if (!preview || isDownloading) {
      return;
    }
    setDownloading(true);
    setVideoError(null);
    try {
      const { url } = await getParticipantVideoUrl(preview.id, true);
      window.location.assign(url);
    } catch (downloadError) {
      setVideoError(
        downloadError instanceof AdminApiError ? downloadError.message : FALLBACK_VIDEO_ERROR,
      );
    } finally {
      setDownloading(false);
    }
  }

  // Close the preview on Escape.
  useEffect(() => {
    if (!preview) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closePreview();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [preview]);

  const totalPages = Math.max(1, Math.ceil((result?.count ?? 0) / PAGE_SIZE));
  const participants = result?.data ?? [];

  return (
    <SectionPage description="متابعة المشاركين في مسابقة الصوت الذهبي والتحقق من الفيديوهات المرفوعة.">
      <div className="dash-participants">
        <div className="dash-participants__toolbar">
          <div className="dash-participants__search">
            <input
              className="input"
              type="search"
              value={searchInput}
              placeholder="ابحث بالاسم أو رقم الهاتف أو المدينة"
              aria-label="بحث في المشاركين"
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <DataStatePanel
            variant="loading"
            title="جارٍ تحميل المشاركين…"
            description="المرجو الانتظار قليلاً."
          />
        ) : error ? (
          <DataStatePanel
            variant="error"
            title="تعذّر تحميل المشاركين"
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
        ) : participants.length === 0 ? (
          <DataStatePanel
            variant="empty"
            title="لا يوجد مشاركون"
            description={
              searchTerm
                ? 'لا توجد نتائج مطابقة لبحثك.'
                : 'ستظهر هنا طلبات المشاركة المرسلة من صفحة المسابقة.'
            }
          />
        ) : (
          <>
            <div className="dash-participants__scroll">
              <table className="dash-participants__table">
                <colgroup>
                  <col className="dash-participants__col dash-participants__col--name" />
                  <col className="dash-participants__col dash-participants__col--phone" />
                  <col className="dash-participants__col dash-participants__col--city" />
                  <col className="dash-participants__col dash-participants__col--age" />
                  <col className="dash-participants__col dash-participants__col--region" />
                  <col className="dash-participants__col dash-participants__col--date" />
                  <col className="dash-participants__col dash-participants__col--video" />
                  <col className="dash-participants__col dash-participants__col--status" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">الاسم الكامل</th>
                    <th scope="col">رقم الهاتف</th>
                    <th scope="col">المدينة</th>
                    <th scope="col">السن</th>
                    <th scope="col">الجهة</th>
                    <th scope="col">تاريخ التسجيل</th>
                    <th scope="col">فيديو المشاركة</th>
                    <th scope="col">حالة الفيديو</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant) => {
                    const status = videoStatus(participant);
                    return (
                      <tr key={participant.id}>
                        <td className="dash-participants__cell dash-participants__cell--name">
                          {participant.full_name}
                        </td>
                        <td className="dash-participants__cell">
                          <a dir="ltr" href={`tel:${participant.phone}`}>
                            {participant.phone}
                          </a>
                        </td>
                        <td className="dash-participants__cell">{participant.city}</td>
                        <td className="dash-participants__cell">
                          {participant.age.toLocaleString('en-US')}
                        </td>
                        <td className="dash-participants__cell">
                          {REGION_LABELS[participant.region] ?? MUTED}
                        </td>
                        <td className="dash-participants__cell">
                          {formatDate(participant.created_at)}
                        </td>
                        <td className="dash-participants__cell dash-participants__cell--video">
                          {participant.hasVideo ? (
                            <button
                              type="button"
                              className="dash-participants__video-btn"
                              aria-label={`معاينة فيديو ${participant.full_name}`}
                              onClick={() => openPreview(participant)}
                            >
                              <VideoIcon />
                              <span>معاينة الفيديو</span>
                            </button>
                          ) : (
                            <span className="dash-participants__muted">{MUTED}</span>
                          )}
                        </td>
                        <td className="dash-participants__cell">
                          <span
                            className={`dash-participants__badge dash-participants__badge--${status.tone}`}
                          >
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <div className="dash-participants__pagination">
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <span className="btn__label">السابق</span>
                </button>
                <span className="dash-participants__page-info">
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

        {preview ? (
          <div
            className="dash-video-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`فيديو المشارك ${preview.full_name}`}
          >
            <button
              type="button"
              className="dash-video-modal__backdrop"
              aria-label="إغلاق معاينة الفيديو"
              onClick={closePreview}
            />

            <div className="dash-video-modal__panel">
              <div className="dash-video-modal__head">
                <div className="dash-video-modal__meta-block">
                  <h3 className="dash-video-modal__title">{preview.full_name}</h3>
                  <p className="dash-video-modal__meta">
                    {REGION_LABELS[preview.region] ?? preview.region}
                    <span aria-hidden="true"> · </span>
                    {preview.city}
                    <span aria-hidden="true"> · </span>
                    <a dir="ltr" href={`tel:${preview.phone}`}>
                      {preview.phone}
                    </a>
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={closePreview}
                >
                  <span className="btn__label">إغلاق</span>
                </button>
              </div>

              <div className="dash-video-modal__player">
                {videoLoading ? (
                  <p className="dash-video-modal__state" role="status">
                    <span className="btn__spinner" aria-hidden="true" /> جارٍ تحميل الفيديو…
                  </p>
                ) : videoError ? (
                  <div className="dash-video-modal__state dash-video-modal__state--error" role="alert">
                    <p className="dash-video-modal__state-text">{videoError}</p>
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() => {
                        retryRef.current = 0;
                        void loadVideoUrl(preview.id);
                      }}
                    >
                      <span className="btn__label">إعادة المحاولة</span>
                    </button>
                  </div>
                ) : videoUrl ? (
                  <video
                    className="dash-video-modal__video"
                    src={videoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    onError={handlePlaybackError}
                  >
                    متصفحك لا يدعم تشغيل الفيديو.
                  </video>
                ) : null}
              </div>

              <div className="dash-video-modal__actions">
                <button
                  type="button"
                  className="btn btn--primary btn--md"
                  disabled={isDownloading}
                  onClick={() => void handleDownload()}
                >
                  {isDownloading ? <span className="btn__spinner" aria-hidden="true" /> : null}
                  <span className="btn__label">
                    {isDownloading ? 'جارٍ التحضير…' : 'تحميل الفيديو'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </SectionPage>
  );
}
