import { useEffect, useState } from 'react';
import QuickActionCard from '../components/QuickActionCard';
import StatCard from '../components/StatCard';
import { MailIcon, MicIcon, StoreIcon, TrophyIcon, UsersIcon } from '../components/icons';
import { countContactRequests } from '../services/contactRequestsService';

/**
 * Dashboard overview.
 *
 * Most statistics render the "not connected" state (`value={null}`) because no
 * data service exists yet. The Contact Requests count is wired to the real
 * admin API; on failure it stays `null` (never a misleading zero).
 */

const MEMBERS_LABEL = 'إجمالي المنخرطين';
const PARTICIPANTS_LABEL = 'إجمالي المشاركين في المسابقة';
const PRODUCTS_LABEL = 'عدد منتجات المتجر';
const COMPETITIONS_LABEL = 'عدد المسابقات المتوفرة';
const CONTACTS_LABEL = 'طلبات الاتصال';

export default function DashboardHome() {
  const [contactsCount, setContactsCount] = useState<number | null>(null);
  const [isLoadingContacts, setLoadingContacts] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingContacts(true);

    countContactRequests()
      .then((count) => {
        if (active) {
          setContactsCount(count);
        }
      })
      .catch(() => {
        if (active) {
          setContactsCount(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingContacts(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

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
          <StatCard
            label={CONTACTS_LABEL}
            value={contactsCount}
            isLoading={isLoadingContacts}
            icon={<MailIcon />}
          />
        </div>

        <p className="dash-home__note">
          تظهر الأرقام المربوطة بمصادر البيانات تلقائياً؛ وستُربط بقية الأقسام تدريجياً.
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
