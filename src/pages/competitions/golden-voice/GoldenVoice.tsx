import GoldenVoiceRegistrationForm from './components/GoldenVoiceRegistrationForm';

/**
 * Dedicated registration page for the Golden Voice competition.
 *
 * This is a focused registration experience: an intro heading followed by the
 * registration form. It is intentionally not a promotional/showcase page.
 */
export default function GoldenVoice() {
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
          <GoldenVoiceRegistrationForm />
        </div>
      </div>
    </section>
  );
}
