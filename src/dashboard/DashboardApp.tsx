import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import AuthProvider from './auth/AuthProvider';
import RequireAuth from './auth/RequireAuth';
import DashboardLayout from './components/DashboardLayout';
import CompetitionsPage from './pages/CompetitionsPage';
import ContactRequestsPage from './pages/ContactRequestsPage';
import DashboardHome from './pages/DashboardHome';
import DashboardNotFound from './pages/DashboardNotFound';
import MembersPage from './pages/MembersPage';
import ParticipantsPage from './pages/ParticipantsPage';
import ProductsPage from './pages/ProductsPage';
import { getDashboardPageTitle } from './navigation';
import { formatDocumentTitle } from '@/lib/documentTitle';

/** Keeps the browser tab title in sync with the current dashboard route. */
function DashboardDocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = formatDocumentTitle(getDashboardPageTitle(pathname));
  }, [pathname]);

  return null;
}

/**
 * Root of the admin dashboard surface.
 *
 * Mounted only on the dashboard host (or `/dashboard` in development). It wraps
 * everything in the auth provider and gates access with `RequireAuth`, then
 * renders the dashboard shell with nested section routes. The public website is
 * rendered by `App` for every other case.
 */
export default function DashboardApp() {
  return (
    <AuthProvider>
      <RequireAuth>
        <DashboardDocumentTitle />
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="participants" element={<ParticipantsPage />} />
            <Route path="competitions" element={<CompetitionsPage />} />
            <Route path="store" element={<ProductsPage />} />
            <Route path="contact" element={<ContactRequestsPage />} />
            <Route path="*" element={<DashboardNotFound />} />
          </Route>
        </Routes>
      </RequireAuth>
    </AuthProvider>
  );
}
