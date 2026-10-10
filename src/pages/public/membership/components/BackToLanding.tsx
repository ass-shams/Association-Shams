function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

/** Consistent return action shown at the top of every internal membership view. */
export default function BackToLanding({ onBack }: { readonly onBack: () => void }) {
  return (
    <div className="mem-back">
      <button type="button" className="btn btn--ghost btn--md mem-back__button" onClick={onBack}>
        <BackIcon />
        <span className="btn__label">رجوع إلى الانخراط</span>
      </button>
    </div>
  );
}
