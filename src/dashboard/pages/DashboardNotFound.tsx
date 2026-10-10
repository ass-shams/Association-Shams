import { Link } from 'react-router-dom';
import DataStatePanel from '../components/DataStatePanel';
import SectionPage from '../components/SectionPage';

/** In-dashboard 404, rendered inside the dashboard shell. */
export default function DashboardNotFound() {
  return (
    <SectionPage description="تعذّر العثور على الصفحة المطلوبة داخل لوحة التحكم.">
      <DataStatePanel
        variant="empty"
        title="الصفحة غير موجودة"
        description="الرابط الذي طلبته غير صالح أو تمت إزالته."
        action={
          <Link className="btn btn--primary btn--md" to="/">
            <span className="btn__label">العودة إلى لوحة التحكم</span>
          </Link>
        }
      />
    </SectionPage>
  );
}
