import { useCallback, useEffect, useRef, useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb';

/**
 * Donations page — a compact hero, the association's official bank details, and
 * a warm closing message.
 *
 * Only the banking information published by the association is shown; no
 * donation amounts or promises are invented. All user-facing copy is Arabic.
 */

/** Official account number, kept verbatim so the copied value is exact. */
const ACCOUNT_NUMBER = '310090100202270475780177';

/** Same digits, grouped in fours purely for on-screen readability. */
const ACCOUNT_NUMBER_DISPLAY = ACCOUNT_NUMBER.replace(/(\d{4})(?=\d)/g, '$1 ');

/** How long the copy feedback stays visible before resetting. */
const COPY_FEEDBACK_MS = 4000;

type CopyStatus = 'idle' | 'success' | 'error';

interface BankDetail {
  readonly id: string;
  readonly label: string;
  readonly value: string;
}

/** Official details taken from the association's bank account certificate. */
const BANK_DETAILS: readonly BankDetail[] = [
  {
    id: 'holder',
    label: 'اسم صاحب الحساب',
    value: 'ASSOCIATION CHAMS DES NON VOYANTS ET VOYANTS BENI MELLAL',
  },
  {
    id: 'agency',
    label: 'الوكالة',
    value: 'TP BENI MELLAL',
  },
  {
    id: 'institution',
    label: 'المؤسسة المالية',
    value: 'Trésorerie Générale du Royaume (TGR)',
  },
];

function BankIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M3 10 12 4l9 6" />
      <path d="M5 10v8" />
      <path d="M9.5 10v8" />
      <path d="M14.5 10v8" />
      <path d="M19 10v8" />
      <path d="M3 20h18" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="m20 6-11 11-5-5" />
    </svg>
  );
}

/** Legacy clipboard fallback for browsers without the async Clipboard API. */
function legacyCopy(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  let succeeded = false;
  try {
    succeeded = document.execCommand('copy');
  } catch {
    succeeded = false;
  }

  document.body.removeChild(textarea);
  return succeeded;
}

/** Copies text to the clipboard, resolving to whether it succeeded. */
async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return legacyCopy(text);
    }
  }

  return legacyCopy(text);
}

export default function DonationsPage() {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const resetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current !== null) {
        window.clearTimeout(resetTimer.current);
      }
    },
    [],
  );

  const handleCopy = useCallback(async () => {
    const succeeded = await copyToClipboard(ACCOUNT_NUMBER);
    setStatus(succeeded ? 'success' : 'error');

    if (resetTimer.current !== null) {
      window.clearTimeout(resetTimer.current);
    }

    resetTimer.current = window.setTimeout(() => setStatus('idle'), COPY_FEEDBACK_MS);
  }, []);

  return (
    <>
      {/* 1. Compact hero */}
      <section className="section section--default section--pad-tight donations-hero" aria-labelledby="donations-hero-title">
        <div className="container">
          <Breadcrumb items={[{ label: 'الرئيسية', to: '/' }, { label: 'التبرعات' }]} />

          <div className="page-hero donations-hero__inner">
            <p className="page-hero__eyebrow">التبرعات</p>
            <h1 id="donations-hero-title" className="page-hero__title">
              ساهم في دعم جمعية شمس
            </h1>
            <p className="page-hero__lead">
              ساهم في دعم أنشطة الجمعية ومبادراتها الاجتماعية والتربوية، وكن جزءاً من رسالتنا في
              خدمة الأشخاص المكفوفين والمبصرين.
            </p>
            <div className="page-hero__actions">
              <a className="btn btn--primary btn--lg btn--join" href="#bank-info">
                المعلومات البنكية للتبرع
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Bank information */}
      <section id="bank-info" className="section section--muted donations-bank-section" aria-labelledby="donations-bank-title">
        <div className="container">
          <article className="card donations-bank">
            <div className="card__header donations-bank__header">
              <span className="donations-bank__icon" aria-hidden="true">
                <BankIcon />
              </span>
              <div className="donations-bank__heading">
                <h2 id="donations-bank-title" className="card__title">
                  المعلومات البنكية للتبرع
                </h2>
                <p className="donations-bank__note">
                  يمكنك دعم الجمعية عبر تحويل بنكي مباشر إلى حسابها الرسمي.
                </p>
              </div>
            </div>

            <div className="card__body donations-bank__body">
              <div className="donations-account">
                <span className="donations-account__label">رقم الحساب</span>
                <p className="donations-account__value" dir="ltr">
                  {ACCOUNT_NUMBER_DISPLAY}
                </p>

                <button
                  type="button"
                  className={status === 'success' ? 'btn btn--primary btn--md donations-copy donations-copy--done' : 'btn btn--primary btn--md donations-copy'}
                  onClick={handleCopy}
                  aria-describedby="donations-copy-status"
                >
                  {status === 'success' ? <CheckIcon /> : <CopyIcon />}
                  <span className="btn__label">نسخ رقم الحساب</span>
                </button>

                <p
                  id="donations-copy-status"
                  className={`donations-copy-status donations-copy-status--${status}`}
                  role="status"
                  aria-live="polite"
                >
                  {status === 'success' ? 'تم نسخ رقم الحساب بنجاح.' : null}
                  {status === 'error' ? 'تعذّر النسخ تلقائياً، يمكنك تحديد الرقم ونسخه يدوياً.' : null}
                </p>
              </div>

              <dl className="donations-details">
                {BANK_DETAILS.map((detail) => (
                  <div key={detail.id} className="donations-detail">
                    <dt className="donations-detail__label">{detail.label}</dt>
                    <dd className="donations-detail__value">{detail.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </article>
        </div>
      </section>

      {/* 3. Warm closing message */}
      <section className="section section--default donations-closing" aria-labelledby="donations-closing-title">
        <div className="container">
          <div className="donations-closing__panel">
            <h2 id="donations-closing-title" className="donations-closing__title">
              تبرّع بما تيسّر لك
            </h2>
            <p className="donations-closing__text">
              كل مساهمة، مهما كانت بسيطة، تساعد جمعية شمس على مواصلة أنشطتها وبرامجها لفائدة
              المكفوفين وضعاف البصر. شكراً لوقوفكم إلى جانبنا.
            </p>
            <div className="donations-closing__actions">
              <a className="btn btn--outline btn--lg" href="/contact">
                تواصل معنا
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
