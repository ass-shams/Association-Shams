import { createBrowserRouter } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { NOT_FOUND_PATH, PUBLIC_ROUTES } from '@/config/routes';
import PublicLayout from '@/components/layout/PublicLayout';
import RouteErrorPage from '@/components/routing/RouteErrorPage';
import RouteFallback from '@/components/routing/RouteFallback';
import NotFoundPage from '@/pages/NotFoundPage';

/**
 * Every public page is a top-level route rendered inside PublicLayout.
 * Page components are code-split and loaded on demand.
 */
const pageLoaders = {
  home: () => import('@/pages/public/HomePage'),
  about: () => import('@/pages/public/AboutPage'),
  activities: () => import('@/pages/public/ActivitiesPage'),
  news: () => import('@/pages/public/NewsPage'),
  store: () => import('@/pages/public/StorePage'),
  documents: () => import('@/pages/public/DocumentsPage'),
  meetings: () => import('@/pages/public/MeetingsPage'),
  membership: () => import('@/pages/public/MembershipPage'),
  goldenVoice: () => import('@/pages/public/GoldenVoicePage'),
  contact: () => import('@/pages/public/ContactPage'),
} satisfies Record<(typeof PUBLIC_ROUTES)[number]['id'], () => Promise<unknown>>;

const publicRoutes: RouteObject[] = PUBLIC_ROUTES.map((route) => ({
  path: route.path,
  lazy: async () => {
    const module = await pageLoaders[route.id]();
    return { Component: module.default };
  },
}));

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <RouteFallback />,
    children: publicRoutes,
  },
  {
    path: NOT_FOUND_PATH,
    element: <NotFoundPage />,
    errorElement: <RouteErrorPage />,
  },
]);