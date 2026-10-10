import DataStatePanel from '../components/DataStatePanel';
import SectionPage from '../components/SectionPage';

/** Competitions section. */
export default function CompetitionsPage() {
  return (
    <SectionPage description="إدارة المسابقات التي تُنشر على الموقع العام.">
      <DataStatePanel
        variant="not-connected"
        title="بيانات المسابقات غير متاحة بعد"
        description="لا يوجد مصدر بيانات للمسابقات مرتبط بلوحة التحكم حتى الآن. ستظهر المسابقات هنا بعد إتمام الربط."
      />
    </SectionPage>
  );
}
