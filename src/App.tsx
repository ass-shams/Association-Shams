import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
import AboutPage from '@/pages/public/AboutPage';
import ActivitiesPage from '@/pages/public/ActivitiesPage';
import ContactPage from '@/pages/public/ContactPage';
import DocumentsPage from '@/pages/public/DocumentsPage';
import GoldenVoicePage from '@/pages/public/GoldenVoicePage';
import HomePage from '@/pages/public/HomePage';
import MeetingsPage from '@/pages/public/MeetingsPage';
import MembershipPage from '@/pages/public/MembershipPage';
import NewsPage from '@/pages/public/NewsPage';
import StorePage from '@/pages/public/StorePage';
import NotFoundPage from '@/pages/NotFoundPage';
import '@/styles.css';

/** Restores the scroll position to the top on every navigation. */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

/**
 * Application root: public shell (navbar + main + footer) and the sitemap.
 * All website styles live in `src/styles.css`, imported once here.
 */
export default function App() {
  return (
    <BrowserRouter>
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
            <Route path="/news" element={<NewsPage />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/meetings" element={<MeetingsPage />} />
            <Route path="/membership" element={<MembershipPage />} />
            <Route path="/golden-voice" element={<GoldenVoicePage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}
