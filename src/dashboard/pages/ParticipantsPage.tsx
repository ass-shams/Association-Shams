import DataStatePanel from '../components/DataStatePanel';
import SectionPage from '../components/SectionPage';

/** Golden Voice participants section. */
export default function ParticipantsPage() {
  return (
    <SectionPage description="متابعة المشاركين في مسابقة الصوت الذهبي والتحقق من الفيديوهات المرفوعة.">
      <DataStatePanel
        variant="not-connected"
        title="بيانات المشاركين غير متاحة بعد"
        description="لم يتم ربط بيانات المشاركين بلوحة التحكم حتى الآن. ستظهر القائمة ومقاطع الفيديو هنا بعد إتمام الربط."
      />
    </SectionPage>
  );
}
