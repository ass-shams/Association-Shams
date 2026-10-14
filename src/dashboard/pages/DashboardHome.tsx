import { useEffect, useState } from 'react';
import QuickActionCard from '../components/QuickActionCard';
import StatCard from '../components/StatCard';
import { MailIcon, MegaphoneIcon, MicIcon, StoreIcon, TrophyIcon, UsersIcon } from '../components/icons';
import { countAnnouncements } from '../services/announcementsService';
import { countContactRequests } from '../services/contactRequestsService';
import { countCompetitions } from '../services/competitionsService';
import { countMembers } from '../services/membersService';
import { countParticipants } from '../services/participantsService';
import { countProducts } from '../services/productsService';

/**
 * Dashboard overview.
 *
 * The members, Golden Voice participants, competitions, store products and
 * contact-request counts are wired to the real admin API; on failure they stay
 * `null` (never a misleading zero).
 */

const MEMBERS_LABEL = 'إجمالي المنخرطين';
const PARTICIPANTS_LABEL = 'إجمالي المشاركين في المسابقة';
const PRODUCTS_LABEL = 'عدد منتجات المتجر';
const COMPETITIONS_LABEL = 'عدد المسابقات المتوفرة';
const ANNOUNCEMENTS_LABEL = 'عدد الإعلانات';
const CONTACTS_LABEL = 'طلبات الاتصال';

export default function DashboardHome() {
  const [membersCount, setMembersCount] = useState<number | null>(null);
  const [isLoadingMembers, setLoadingMembers] = useState(true);
  const [participantsCount, setParticipantsCount] = useState<number | null>(null);
  const [isLoadingParticipants, setLoadingParticipants] = useState(true);
  const [competitionsCount, setCompetitionsCount] = useState<number | null>(null);
  const [isLoadingCompetitions, setLoadingCompetitions] = useState(true);
  const [productsCount, setProductsCount] = useState<number | null>(null);
  const [isLoadingProducts, setLoadingProducts] = useState(true);
  const [announcementsCount, setAnnouncementsCount] = useState<number | null>(null);
  const [isLoadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [contactsCount, setContactsCount] = useState<number | null>(null);
  const [isLoadingContacts, setLoadingContacts] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingMembers(true);

    countMembers()
      .then((count) => {
        if (active) {
          setMembersCount(count);
        }
      })
      .catch(() => {
        if (active) {
          setMembersCount(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingMembers(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingParticipants(true);

    countParticipants()
      .then((count) => {
        if (active) {
          setParticipantsCount(count);
        }
      })
      .catch(() => {
        if (active) {
          setParticipantsCount(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingParticipants(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingCompetitions(true);

    countCompetitions()
      .then((count) => {
        if (active) {
          setCompetitionsCount(count);
        }
      })
      .catch(() => {
        if (active) {
          setCompetitionsCount(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingCompetitions(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingProducts(true);

    countProducts()
      .then((count) => {
        if (active) {
          setProductsCount(count);
        }
      })
      .catch(() => {
        if (active) {
          setProductsCount(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingProducts(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingAnnouncements(true);

    countAnnouncements()
      .then((count) => {
        if (active) {
          setAnnouncementsCount(count);
        }
      })
      .catch(() => {
        if (active) {
          setAnnouncementsCount(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingAnnouncements(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

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
          <StatCard
            label={MEMBERS_LABEL}
            value={membersCount}
            isLoading={isLoadingMembers}
            icon={<UsersIcon />}
          />
          <StatCard
            label={PARTICIPANTS_LABEL}
            value={participantsCount}
            isLoading={isLoadingParticipants}
            icon={<MicIcon />}
          />
          <StatCard
            label={PRODUCTS_LABEL}
            value={productsCount}
            isLoading={isLoadingProducts}
            icon={<StoreIcon />}
          />
          <StatCard
            label={COMPETITIONS_LABEL}
            value={competitionsCount}
            isLoading={isLoadingCompetitions}
            icon={<TrophyIcon />}
          />
          <StatCard
            label={ANNOUNCEMENTS_LABEL}
            value={announcementsCount}
            isLoading={isLoadingAnnouncements}
            icon={<MegaphoneIcon />}
          />
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
          <QuickActionCard to="/announcements" label="الإعلانات" icon={<MegaphoneIcon />} />
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
