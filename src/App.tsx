import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
import AboutPage from '@/pages/public/AboutPage';
import ActivitiesPage from '@/pages/public/ActivitiesPage';
import Competitions from '@/pages/competitions/Competitions';
import GoldenVoice from '@/pages/competitions/golden-voice/GoldenVoice';
import ContactPage from '@/pages/public/ContactPage';
import DocumentsPage from '@/pages/public/DocumentsPage';
import GoldenVoicePage from '@/pages/public/GoldenVoicePage';
import HomePage from '@/pages/public/HomePage';
import MembershipPage from '@/pages/public/MembershipPage';
import ProductDetailsPage from '@/pages/public/ProductDetailsPage';
import StorePage from '@/pages/public/StorePage';
import NotFoundPage from '@/pages/NotFoundPage';
import { isDashboardSurface } from '@/dashboard/surface';
import '@/styles.css';

/**
 * Dashboard surface, loaded lazily so the public website's bundle is
 * unaffected. It is only ever requested on the dashboard host (or `/dashboard`
 * in development).
 */
const DashboardApp = lazy(() => import('@/dashboard/DashboardApp'));

/** Restores the scroll position to the top on every navigation. */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

/**
 * Routes that deliberately omit the global footer. The Golden Voice
 * registration page, the membership experience, and the contact page are
 * focused, single-task flows, so the footer is hidden there while every other
 * public page keeps it.
 */
const FOOTER_HIDDEN_ROUTES = new Set(['/competitions/golden-voice', '/membership', '/contact']);

/** Renders the shared footer except on routes that opt out. */
function SiteFooter() {
  const { pathname } = useLocation();

  if (FOOTER_HIDDEN_ROUTES.has(pathname)) {
    return null;
  }

  return <Footer />;
}

/**
 * Public website shell: navbar + main + footer and the public sitemap. All
 * website styles live in `src/styles.css`, imported once in `App`.
 */
function PublicSite() {
  return (
    <>
      <ScrollToTop />

      <div className="shell" dir="rtl">
        <a className="skip-link" href="#main-content">
          تخطَّ إلى المحتوى الرئيسي
        </a>

        <Navbar />

        <main id="main-content" className="site-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/activities" element={<ActivitiesPage />} />
            <Route path="/competitions" element={<Competitions />} />
            <Route path="/competitions/golden-voice" element={<GoldenVoice />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/store/:slug" element={<ProductDetailsPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/membership" element={<MembershipPage />} />
            <Route path="/golden-voice" element={<GoldenVoicePage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}

/**
 * Application root. A single `BrowserRouter` serves whichever surface matches
 * the current host: the public website for every host, or the admin dashboard
 * on its dedicated subdomain (and `/dashboard` during development).
 */
export default function App() {
  const isDashboard = isDashboardSurface(
    window.location.hostname,
    window.location.pathname,
    import.meta.env.DEV,
  );

  return (
    <BrowserRouter>
      {isDashboard ? (
        <Suspense fallback={<div className="dash-boot" aria-hidden="true" />}>
          <DashboardApp />
        </Suspense>
      ) : (
        <PublicSite />
      )}
    </BrowserRouter>
  );
}
