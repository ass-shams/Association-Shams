import { useEffect, useId, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import logo from '@/assets/navbar-footer.png';
import { useAuth } from '../auth/useAuth';
import { getDashboardPageTitle } from '../navigation';
import DashboardNav from './DashboardNav';
import { MenuIcon } from './icons';

/**
 * Dashboard shell: right-side sidebar on desktop, an off-canvas drawer on
 * mobile, a sticky header with the current page title and administrator
 * account, and the routed content area.
 */
export default function DashboardLayout() {
  const { user, admin } = useAuth();
  const location = useLocation();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const sidebarId = useId();

  const email = admin?.email ?? user?.email ?? '';
  const title = getDashboardPageTitle(location.pathname);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Close the drawer on Escape.
  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDrawerOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  return (
    <div className="dash-app" dir="rtl">
      {isDrawerOpen ? (
        <button
          type="button"
          className="dash-backdrop"
          aria-label="إغلاق القائمة"
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}

      <aside
        id={sidebarId}
        className={`dash-sidebar${isDrawerOpen ? ' is-open' : ''}`}
        aria-label="لوحة التحكم"
      >
        <div className="dash-sidebar__brand">
          <img className="dash-sidebar__logo" src={logo} alt="جمعية شمس" />
          <span className="dash-sidebar__brand-text">لوحة التحكم</span>
        </div>

        <DashboardNav onNavigate={() => setDrawerOpen(false)} />
      </aside>

      <div className="dash-main">
        <header className="dash-header">
          <button
            type="button"
            className="dash-header__menu"
            aria-label="فتح القائمة"
            aria-expanded={isDrawerOpen}
            aria-controls={sidebarId}
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </button>

          <h1 className="dash-header__title">{title}</h1>

          <div className="dash-header__account">
            {email ? <span className="dash-header__email">{email}</span> : null}
          </div>
        </header>

        <main className="dash-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
