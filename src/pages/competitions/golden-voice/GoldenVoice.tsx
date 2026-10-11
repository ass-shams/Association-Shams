import { useEffect, useState } from 'react';
import { fetchPublicCompetitions } from '@/data/competitionsService';
import { competitionStatusLabel, GOLDEN_VOICE_COMPETITION_SLUG } from '@/pages/competitions/status';
import type { EffectiveStatus } from '@/pages/competitions/status';
import GoldenVoiceRegistrationForm from './components/GoldenVoiceRegistrationForm';

/**
 * Dedicated registration page for the Golden Voice competition.
 *
 * The registration form is only shown while the managed competition is
 * accepting registrations. The server-side submit endpoint enforces the same
 * rule, so hiding the form here is a UX affordance, not the security boundary.
 */
export default function GoldenVoice() {
  const [status, setStatus] = useState<EffectiveStatus | null>(null);

  useEffect(() => {
    let active = true;

    fetchPublicCompetitions()
      .then((list) => {
        if (!active) {
          return;
        }
        const match = list.find((item) => item.slug === GOLDEN_VOICE_COMPETITION_SLUG);
        setStatus(match ? match.effectiveStatus : null);
      })
      .catch(() => {
        // If the status cannot be loaded, show the form; the server still
        // rejects submissions when registration is not open.
        if (active) {
          setStatus(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const isOpen = status === null || status === 'open';

  return (
    <section className="section section--default section--pad-default">
      <div className="container">
        <header className="gv-header">
          <p className="gv-header__eyebrow">مسابقة الصوت الذهبي</p>
          <h1 className="gv-header__title">عندك موهبة فالغناء؟ الفرصة بين يديك! ؟</h1>
          <p className="gv-header__lead">
            تعلن جمعية شمس الكفيف والمبصر، بدعم من وزارة الشباب والثقافة التواصل (قطاع الثقافة)،
            عن انطلاق التسجيل في الدورة الثانية لمسابقة "الصوت الذهبي للأغنية العربية والغربية"!
          </p>
        </header>

        <div className="gv-form-wrap">
          {isOpen ? (
            <GoldenVoiceRegistrationForm />
          ) : (
            <div className="card">
              <div className="card__body panel">
                <h2 className="panel__title">{competitionStatusLabel(status ?? 'closed')}</h2>
                <p className="panel__text">
                  التسجيل في هذه المسابقة غير متاح حالياً. المرجو العودة لاحقاً أو التواصل مع
                  الجمعية لمزيد من المعلومات.
                </p>
                <a className="btn btn--outline btn--md" href="/contact">
                  تواصل معنا
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
