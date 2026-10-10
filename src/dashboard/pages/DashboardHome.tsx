import QuickActionCard from '../components/QuickActionCard';
import StatCard from '../components/StatCard';
import { MailIcon, MicIcon, StoreIcon, TrophyIcon, UsersIcon } from '../components/icons';

/**
 * Dashboard overview.
 *
 * Statistics intentionally render the "not connected" state (`value={null}`)
 * because no data service exists yet. Callers can swap in real numbers once an
 * API is available — no fabricated values are shown.
 */

const MEMBERS_LABEL = 'إجمالي المنخرطين';
const PARTICIPANTS_LABEL = 'إجمالي المشاركين في المسابقة';
const PRODUCTS_LABEL = 'عدد منتجات المتجر';
const COMPETITIONS_LABEL = 'عدد المسابقات المتوفرة';

export default function DashboardHome() {
  return (
    <div className="dash-home">
      <section className="dash-home__block" aria-labelledby="dash-overview-heading">
        <h2 className="dash-home__heading" id="dash-overview-heading">
          نظرة عامة
        </h2>

        <div className="dash-stats">
          <StatCard label={MEMBERS_LABEL} value={null} icon={<UsersIcon />} />
          <StatCard label={PARTICIPANTS_LABEL} value={null} icon={<MicIcon />} />
          <StatCard label={PRODUCTS_LABEL} value={null} icon={<StoreIcon />} />
          <StatCard label={COMPETITIONS_LABEL} value={null} icon={<TrophyIcon />} />
        </div>

        <p className="dash-home__note">
          ستظهر الأرقام هنا تلقائياً بعد ربط مصادر البيانات بلوحة التحكم.
        </p>
      </section>

      <section className="dash-home__block" aria-labelledby="dash-actions-heading">
        <h2 className="dash-home__heading" id="dash-actions-heading">
          إجراءات سريعة
        </h2>

        <div className="dash-quick">
          <QuickActionCard to="/store" label="المتجر" icon={<StoreIcon />} />
          <QuickActionCard to="/members" label="المنخرطين" icon={<UsersIcon />} />
          <QuickActionCard
            to="/participants"
            label="المشاركين في المسابقة"
            icon={<MicIcon />}
          />
          <QuickActionCard to="/contact" label="طلبات الاتصال" icon={<MailIcon />} />
        </div>
      </section>
    </div>
  );
}
