import DataStatePanel from '../components/DataStatePanel';
import SectionPage from '../components/SectionPage';

/** Store products section. */
export default function ProductsPage() {
  return (
    <SectionPage description="إدارة منتجات المتجر والأسعار وحالة التوفر.">
      <DataStatePanel
        variant="not-connected"
        title="بيانات المتجر غير متاحة بعد"
        description="لا يوجد مصدر بيانات للمنتجات مرتبط بلوحة التحكم حتى الآن. ستظهر المنتجات هنا بعد إتمام الربط."
      />
    </SectionPage>
  );
}
