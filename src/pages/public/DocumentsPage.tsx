import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import FinalCTA from '@/components/finalCTA';
import { documents } from '@/data/documents';
import heroImage from '@/assets/documents-images/hero-img.png';

/** Flat, recognisable PDF file glyph (rendered in the brand red tint). */
function PdfIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M14 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5Z" />
      <path d="M14 2.5v5h5" />
      <path d="M9 13.5h6" />
      <path d="M9 16.5h4" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/** Formats a byte count as a compact, human-readable size (KB / MB). */
function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [query, setQuery] = useState('');
  const term = query.trim().toLowerCase();

  const visibleDocuments = term
    ? documents.filter(
        (doc) =>
          doc.fileName.toLowerCase().includes(term) ||
          doc.description.toLowerCase().includes(term),
      )
    : documents;

  return (
    <>
      {/* 1. Compact page header */}
      <section className="section section--pad-tight doc-hero" aria-labelledby="doc-hero-title">
        <div className="container">
          <Breadcrumb items={[{ label: 'الرئيسية', to: '/' }, { label: 'الوثائق الإدارية' }]} />

          <div className="doc-hero__inner">
            <div className="doc-hero__content">
              <h1 id="doc-hero-title" className="page-hero__title">
                الوثائق الإدارية
              </h1>
              <p className="page-hero__lead">
                تجدون هنا الوثائق الرسمية لجمعية شمس، متاحة للاطلاع والتحميل بسهولة بصيغة PDF.
              </p>
              <div className="doc-hero__actions">
                <a className="btn btn--primary btn--lg btn--join" href="/membership">
                  انخرط معنا
                </a>
                <a className="btn btn--outline btn--lg" href="/contact">
                  تواصل معنا
                </a>
              </div>
            </div>

            <div className="doc-hero__media">
              <img
                src={heroImage}
                alt="رسم توضيحي يمثل الوثائق الإدارية لجمعية شمس"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Document library */}
      <section className="section section--muted doc-library" aria-labelledby="doc-library-title">
        <div className="container">
          <div className="section-heading">
            <h2 id="doc-library-title" className="section-heading__title">
              الوثائق المتاحة
            </h2>
            <p className="section-heading__lead">
              حمّل الوثائق الرسمية للجمعية مباشرة بصيغة PDF عبر زر التحميل في كل وثيقة.
            </p>
          </div>

          <div className="field field--with-icon doc-search">
            <label className="field__label" htmlFor="doc-search">
              ابحث عن وثيقة
            </label>
            <div className="field__control">
              <span className="field__icon" aria-hidden="true">
                <SearchIcon />
              </span>
              <input
                id="doc-search"
                className="input"
                type="search"
                value={query}
                placeholder="اكتب اسم الوثيقة أو كلمات من وصفها..."
                autoComplete="off"
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <p className="doc-search__count" aria-live="polite">
              {visibleDocuments.length} من {documents.length} وثيقة
            </p>
          </div>

          {visibleDocuments.length > 0 ? (
            <div className="doc-grid">
              {visibleDocuments.map((doc) => (
                <article key={doc.id} className="card card--fill doc-card">
                  <div className="card__header doc-card__header">
                    <span className="doc-card__icon" aria-hidden="true">
                      <PdfIcon />
                    </span>
                    <div className="doc-card__heading">
                      <h3 className="doc-card__title">{doc.fileName}</h3>
                      <span className="badge badge--danger doc-card__format">PDF</span>
                    </div>
                  </div>

                  <div className="card__body doc-card__body">
                    <p className="doc-card__desc">{doc.description}</p>
                    <dl className="meta-list">
                      <div className="meta-row">
                        <dt>الحجم</dt>
                        <dd>{formatSize(doc.sizeBytes)}</dd>
                      </div>
                      <div className="meta-row">
                        <dt>الصيغة</dt>
                        <dd>PDF</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="card__footer card__footer--stretch">
                    <a
                      className="btn btn--primary btn--md btn--full doc-card__action"
                      href={doc.url}
                      download={doc.fileName}
                    >
                      <span className="btn__label">
                        <DownloadIcon />
                        تحميل الوثيقة
                      </span>
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="card empty">
              <div className="card__body empty__body">
                <span className="doc-card__icon" aria-hidden="true">
                  <PdfIcon />
                </span>
                <h3 className="empty__title">لا توجد وثائق مطابقة</h3>
                <p className="empty__text">
                  لم نجد أي وثيقة تطابق بحثك. جرّب كلمات أخرى أو امسح البحث لعرض كل الوثائق.
                </p>
                <button type="button" className="btn btn--outline btn--md" onClick={() => setQuery('')}>
                  مسح البحث
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Shared closing call-to-action */}
      <FinalCTA />
    </>
  );
}
