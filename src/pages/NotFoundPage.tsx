import { Link } from 'react-router-dom';

/** Catch-all page for unknown URLs. */
export default function NotFoundPage() {
  return (
    <div className="error-box">
      <h1>الصفحة غير موجودة</h1>
      <p>الرابط الذي طلبته غير متاح أو تم نقله إلى عنوان آخر.</p>
      <Link className="error-link" to="/">
        العودة إلى الصفحة الرئيسية
      </Link>
    </div>
  );
}
