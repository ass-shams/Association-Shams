import { Link } from 'react-router-dom';
import styles from '@/styles/layout.module.css';

/** Catch-all page for unknown URLs. */
export default function NotFoundPage() {
  return (
    <div className={styles.shell} dir="rtl">
      <main id="main-content" className={styles.main}>
        <div className={styles.errorBox}>
          <h1>الصفحة غير موجودة</h1>
          <p>الرابط الذي طلبته غير متاح أو تم نقله إلى عنوان آخر.</p>
          <Link className={styles.errorLink} to="/">
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </main>
    </div>
  );
}