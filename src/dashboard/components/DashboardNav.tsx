import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { DASHBOARD_NAV_ITEMS } from '../navigation';
import { resolvePublicSiteUrl } from '../publicSite';
import { ExternalLinkIcon, LogOutIcon } from './icons';

export interface DashboardNavProps {
  /** Called after any navigation action (used to close the mobile drawer). */
  readonly onNavigate?: () => void;
}

/** Sidebar navigation: section links, the public-site action, and logout. */
export default function DashboardNav({ onNavigate }: DashboardNavProps) {
  const { signOut } = useAuth();
  const publicSiteUrl = resolvePublicSiteUrl(
    window.location.hostname,
    window.location.protocol,
  );

  return (
    <nav className="dash-nav" aria-label="التنقل في لوحة التحكم">
      <ul className="dash-nav__list">
        {DASHBOARD_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `dash-nav__link${isActive ? ' is-active' : ''}`
                }
                onClick={onNavigate}
              >
                <span className="dash-nav__icon" aria-hidden="true">
                  <Icon />
                </span>
                <span className="dash-nav__label">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>

      <div className="dash-nav__footer">
        <a
          className="dash-nav__link"
          href={publicSiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
        >
          <span className="dash-nav__icon" aria-hidden="true">
            <ExternalLinkIcon />
          </span>
          <span className="dash-nav__label">عرض الموقع</span>
        </a>

        <button
          type="button"
          className="dash-nav__link dash-nav__link--button"
          onClick={() => {
            onNavigate?.();
            void signOut();
          }}
        >
          <span className="dash-nav__icon" aria-hidden="true">
            <LogOutIcon />
          </span>
          <span className="dash-nav__label">تسجيل الخروج</span>
        </button>
      </div>
    </nav>
  );
}
