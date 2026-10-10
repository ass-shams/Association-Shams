import DataStatePanel from '../components/DataStatePanel';
import SectionPage from '../components/SectionPage';

/** Contact requests section. */
export default function ContactRequestsPage() {
  return (
    <SectionPage description="مراجعة رسائل طلبات الاتصال الواردة من الموقع.">
      <DataStatePanel
        variant="not-connected"
        title="طلبات الاتصال غير متاحة بعد"
        description="لم يتم ربط نموذج الاتصال بمصدر بيانات بعد. ستظهر الرسائل هنا بعد إتمام الربط."
      />
    </SectionPage>
  );
}
