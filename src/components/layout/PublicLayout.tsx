import { NavLink, Outlet } from 'react-router-dom';
import { FOOTER_NAV_GROUPS, FOOTER_NAV_ROUTES, MAIN_NAV_ROUTES } from '@/config/routes';
import styles from '@/styles/layout.module.css';

/**
 * Public shell for the whole Arabic RTL website.
 * Header navigation and footer navigation are both derived from
 * `@/config/routes`, so adding a route updates navigation automatically.
 */
export default function PublicLayout() {
  return (
    <div className={styles.shell} dir="rtl">
      <a className={styles.skipLink} href="#main-content">
        تخطَّ إلى المحتوى الرئيسي
      </a>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <NavLink className={styles.brand} to="/">
            جمعية شمس
          </NavLink>

          <nav className={styles.mainNav} aria-label="التنقل الرئيسي">
            <ul className={styles.navList}>
              {MAIN_NAV_ROUTES.map((route) => (
                <li key={route.id}>
                  <NavLink
                    className={({ isActive }) =>
                      isActive ? styles.navLinkActive : styles.navLink
                    }
                    to={route.path}
                    end={route.path === '/'}
                  >
                    {route.labelAr}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          {FOOTER_NAV_GROUPS.map((group) => (
            <nav
              key={group.id}
              className={styles.footerColumn}
              aria-label={group.labelAr}
            >
              <h2 className={styles.footerHeading}>{group.labelAr}</h2>
              <ul className={styles.footerList}>
                {FOOTER_NAV_ROUTES[group.id].map((route) => (
                  <li key={route.id}>
                    <NavLink className={styles.footerLink} to={route.path}>
                      {route.labelAr}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className={styles.footerBottom}>
          <p>جمعية شمس</p>
        </div>
      </footer>
    </div>
  );
}