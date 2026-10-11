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
import DonationsPage from '@/pages/public/DonationsPage';
import GoldenVoicePage from '@/pages/public/GoldenVoicePage';
import HomePage from '@/pages/public/HomePage';
import MembershipPage from '@/pages/public/MembershipPage';
import ProductDetailsPage from '@/pages/public/ProductDetailsPage';
import StorePage from '@/pages/public/StorePage';
import NotFoundPage from '@/pages/NotFoundPage';
import { isDashboardSurface } from '@/dashboard/surface';
import { usePageSeo } from '@/lib/seo';
import type { PageSeo } from '@/lib/seo';
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
 * Per-route SEO metadata for the public sitemap, following the
 * `اسم الصفحة | جمعية شمس للكفيف و المبصر` title convention.
 *
 * The homepage omits `pageTitle` so the official association name is shown
 * alone. Dynamic product pages are absent: they set their own metadata.
 */
const PUBLIC_PAGE_SEO: Readonly<Record<string, PageSeo>> = {
  '/': {
    description:
      'جمعية شمس للكفيف والمبصر جمعية مغربية بمدينة بني ملال تعمل على الإدماج الشامل للمكفوفين وضعاف البصر إلى جانب المبصرين عبر برامج تربوية وتعليمية واجتماعية.',
    path: '/',
  },
  '/about': {
    pageTitle: 'من نحن',
    description:
      'تعرّف على جمعية شمس للكفيف والمبصر: رؤيتها ورسالتها وقيمها ومجالات عملها في خدمة المكفوفين وضعاف البصر بمدينة بني ملال.',
    path: '/about',
  },
  '/activities': {
    pageTitle: 'أنشطتنا',
    description:
      'تتنوع أنشطة جمعية شمس بين الأنشطة التربوية والترفيهية والرحلات والمخيمات والدورات التكوينية والمبادرات الاجتماعية لتنمية مهارات المشاركين.',
    path: '/activities',
  },
  '/competitions': {
    pageTitle: 'المسابقات',
    description:
      'تعرّف على المسابقات التي تنظّمها جمعية شمس للكفيف والمبصر، وأهدافها ومجالاتها ومواعيد التسجيل فيها.',
    path: '/competitions',
  },
  '/competitions/golden-voice': {
    pageTitle: 'مسابقة الصوت الذهبي',
    description:
      'سجّل في مسابقة الصوت الذهبي التي تنظّمها جمعية شمس للكفيف والمبصر لاكتشاف المواهب الصوتية وتنميتها.',
    path: '/competitions/golden-voice',
  },
  '/store': {
    pageTitle: 'المتجر',
    description:
      'متجر جمعية شمس للكفيف والمبصر: اكتشف منتجات الجمعية، واقتناؤها يساهم في دعم أنشطتها ومشاريعها الخدمية.',
    path: '/store',
  },
  '/documents': {
    pageTitle: 'الوثائق الإدارية',
    description:
      'الوثائق الإدارية الرسمية لجمعية شمس للكفيف والمبصر متاحة للاطلاع والتحميل بصيغة PDF.',
    path: '/documents',
    breadcrumbs: [
      { name: 'الرئيسية', path: '/' },
      { name: 'الوثائق الإدارية', path: '/documents' },
    ],
  },
  '/membership': {
    pageTitle: 'الانخراط',
    description:
      'انخرط في جمعية شمس للكفيف والمبصر: تعرّف على الوثائق المطلوبة وقدّم طلب الانخراط إلكترونياً.',
    path: '/membership',
  },
  '/donations': {
    pageTitle: 'التبرعات',
    description:
      'ساهم في دعم جمعية شمس للكفيف والمبصر عبر التبرع بالتحويل البنكي إلى الحساب الرسمي للجمعية، وكن جزءاً من رسالتها في خدمة المكفوفين والمبصرين.',
    path: '/donations',
    breadcrumbs: [
      { name: 'الرئيسية', path: '/' },
      { name: 'التبرعات', path: '/donations' },
    ],
  },
  '/golden-voice': {
    pageTitle: 'مسابقة الصوت الذهبي',
    description:
      'مسابقة الصوت الذهبي مبادرة ثقافية لجمعية شمس لاكتشاف المواهب الصوتية وتنميتها وتوفير منصة تنافسية تبرز القدرات الفنية للمشاركين.',
    path: '/golden-voice',
  },
  '/contact': {
    pageTitle: 'اتصل بنا',
    description:
      'تواصل مع جمعية شمس للكفيف والمبصر عبر نموذج الاتصال للاستفسارات والاقتراحات وطلب المزيد من المعلومات.',
    path: '/contact',
    breadcrumbs: [
      { name: 'الرئيسية', path: '/' },
      { name: 'اتصل بنا', path: '/contact' },
    ],
  },
};

/** Metadata for the catch-all 404 page, kept out of the search index. */
function notFoundSeo(pathname: string): PageSeo {
  return {
    pageTitle: 'الصفحة غير موجودة',
    description:
      'الصفحة المطلوبة غير متوفرة أو تم نقلها إلى عنوان آخر في موقع جمعية شمس للكفيف والمبصر.',
    path: pathname,
    noindex: true,
  };
}

/** Public page-managed product routes; these set their own metadata. */
function isProductRoute(pathname: string): boolean {
  return pathname.startsWith('/store/');
}

/** Applies the metadata for a resolved page (hooks are always called here). */
function SeoUpdater({ seo }: { seo: PageSeo }) {
  usePageSeo(seo);
  return null;
}

/** Keeps the document metadata in sync with the current public route. */
function PublicSeo() {
  const { pathname } = useLocation();

  if (isProductRoute(pathname)) {
    return null;
  }

  return <SeoUpdater seo={PUBLIC_PAGE_SEO[pathname] ?? notFoundSeo(pathname)} />;
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
      <PublicSeo />

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
            <Route path="/donations" element={<DonationsPage />} />
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
