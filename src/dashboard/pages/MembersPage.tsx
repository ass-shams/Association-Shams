import DataStatePanel from '../components/DataStatePanel';
import SectionPage from '../components/SectionPage';

/** Members section. Data wiring (table, search, filters) comes in a later phase. */
export default function MembersPage() {
  return (
    <SectionPage description="استعراض المنخرطين وإدارة طلبات الانخراط في الجمعية.">
      <DataStatePanel
        variant="not-connected"
        title="بيانات المنخرطين غير متاحة بعد"
        description="لم يتم ربط مصدر بيانات المنخرطين بلوحة التحكم حتى الآن. ستظهر قائمة المنخرطين هنا بعد إتمام الربط."
      />
    </SectionPage>
  );
}
