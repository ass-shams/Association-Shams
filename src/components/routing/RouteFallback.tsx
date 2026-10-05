import styles from '@/styles/layout.module.css';

/** Shown while a lazy-loaded route chunk is being fetched. */
export default function RouteFallback() {
  return (
    <div className={styles.shell} dir="rtl">
      <main id="main-content" className={styles.main}>
        <div className={styles.fallbackBox} role="status" aria-live="polite">
          <p>جارٍ التحميل…</p>
        </div>
      </main>
    </div>
  );
}