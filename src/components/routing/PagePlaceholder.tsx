import type { PublicRouteId } from '@/config/routes';
import { PUBLIC_ROUTES } from '@/config/routes';
import styles from '@/styles/layout.module.css';

/**
 * Temporary page shell. Renders the Arabic page title only, so no fake
 * content enters the project before the UI phase.
 */
export default function PagePlaceholder({ routeId }: { routeId: PublicRouteId }) {
  const route = PUBLIC_ROUTES.find((item) => item.id === routeId);

  return (
    <section className={styles.page}>
      <h1 className={styles.pageTitle}>{route?.labelAr}</h1>
    </section>
  );
}