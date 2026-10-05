import { NavLink, Outlet } from 'react-router-dom';
import { FUTURE_AREAS } from '@/config/routes';
import styles from '@/styles/layout.module.css';

/**
 * Skeleton only. Reserved for `/admin/*`.
 * Not mounted in the router until authentication and role checks are implemented.
 */
export default function AdminLayout() {
  const area = FUTURE_AREAS.find((item) => item.basePath === '/admin');

  return (
    <div className={styles.shell} dir="rtl">
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <NavLink className={styles.brand} to="/admin">
            جمعية شمس
          </NavLink>
          <nav className={styles.mainNav} aria-label={area?.labelAr}>
            <ul className={styles.navList} />
          </nav>
        </div>
      </header>

      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}