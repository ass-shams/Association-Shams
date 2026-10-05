import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import styles from '@/styles/layout.module.css';

/** Router-level error boundary: 404s, loader failures and render crashes. */
export default function RouteErrorPage() {
  const error = useRouteError();

  const title = isRouteErrorResponse(error)
    ? error.status === 404
      ? 'الصفحة غير موجودة'
      : 'حدث خطأ'
    : 'حدث خطأ غير متوقع';

  const description = isRouteErrorResponse(error)
    ? error.statusText
    : 'تعذّر عرض هذه الصفحة. يرجى المحاولة مرة أخرى لاحقًا.';

  return (
    <div className={styles.shell} dir="rtl">
      <main id="main-content" className={styles.main}>
        <div className={styles.errorBox} role="alert">
          <h1>{title}</h1>
          <p>{description}</p>
          <a className={styles.errorLink} href="/">
            العودة إلى الصفحة الرئيسية
          </a>
        </div>
      </main>
    </div>
  );
}