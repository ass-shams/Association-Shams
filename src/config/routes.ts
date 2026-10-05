/**
 * Centralized, typed route configuration.
 *
 * This file is the single source of truth for the public website sitemap.
 * Navigation, footer links and the router are all derived from it.
 *
 * Paths stay in English (technical identifiers).
 * Every user-facing label is Arabic.
 */

export type PublicRouteId =
  | 'home'
  | 'about'
  | 'activities'
  | 'news'
  | 'store'
  | 'documents'
  | 'meetings'
  | 'membership'
  | 'goldenVoice'
  | 'contact';

export interface PublicRouteDefinition {
  /** Stable identifier used by the router and by code. */
  readonly id: PublicRouteId;
  /** URL path. Latin, technical. */
  readonly path: string;
  /** Arabic navigation label. */
  readonly labelAr: string;
  /** Position in the main navigation, lowest first. */
  readonly navOrder: number;
  /** Footer column grouping. */
  readonly footerGroup: 'institution' | 'services' | 'quick';
  /** False only for the home page, which is reachable but not listed. */
  readonly showInMainNav: boolean;
}

export const PUBLIC_ROUTES = [
  {
    id: 'home',
    path: '/',
    labelAr: 'الرئيسية',
    navOrder: 1,
    footerGroup: 'institution',
    showInMainNav: true,
  },
  {
    id: 'about',
    path: '/about',
    labelAr: 'من نحن',
    navOrder: 2,
    footerGroup: 'institution',
    showInMainNav: true,
  },
  {
    id: 'activities',
    path: '/activities',
    labelAr: 'أنشطتنا',
    navOrder: 3,
    footerGroup: 'institution',
    showInMainNav: true,
  },
  {
    id: 'news',
    path: '/news',
    labelAr: 'الأخبار',
    navOrder: 4,
    footerGroup: 'institution',
    showInMainNav: true,
  },
  {
    id: 'store',
    path: '/store',
    labelAr: 'المتجر',
    navOrder: 5,
    footerGroup: 'services',
    showInMainNav: true,
  },
  {
    id: 'documents',
    path: '/documents',
    labelAr: 'الوثائق الإدارية',
    navOrder: 6,
    footerGroup: 'services',
    showInMainNav: true,
  },
  {
    id: 'meetings',
    path: '/meetings',
    labelAr: 'المحاضر والاجتماعات',
    navOrder: 7,
    footerGroup: 'services',
    showInMainNav: true,
  },
  {
    id: 'membership',
    path: '/membership',
    labelAr: 'الانخراط',
    navOrder: 8,
    footerGroup: 'services',
    showInMainNav: true,
  },
  {
    id: 'goldenVoice',
    path: '/golden-voice',
    labelAr: 'مسابقة الصوت الذهبي',
    navOrder: 9,
    footerGroup: 'institution',
    showInMainNav: true,
  },
  {
    id: 'contact',
    path: '/contact',
    labelAr: 'اتصل بنا',
    navOrder: 10,
    footerGroup: 'quick',
    showInMainNav: true,
  },
] as const satisfies readonly PublicRouteDefinition[];

export type PublicRoute = (typeof PUBLIC_ROUTES)[number];

/** Main navigation: ordered, flat, no dropdowns. */
export const MAIN_NAV_ROUTES: readonly PublicRoute[] = PUBLIC_ROUTES.filter(
  (route) => route.showInMainNav,
).sort((a, b) => a.navOrder - b.navOrder);

export const FOOTER_NAV_GROUPS = [
  { id: 'institution', labelAr: 'عن الجمعية' },
  { id: 'services', labelAr: 'الخدمات' },
  { id: 'quick', labelAr: 'روابط سريعة' },
] as const satisfies readonly { id: PublicRouteDefinition['footerGroup']; labelAr: string }[];

export const FOOTER_NAV_ROUTES: Record<
  PublicRouteDefinition['footerGroup'],
  readonly PublicRoute[]
> = {
  institution: PUBLIC_ROUTES.filter((route) => route.footerGroup === 'institution' && route.id !== 'home'),
  services: PUBLIC_ROUTES.filter((route) => route.footerGroup === 'services'),
  quick: PUBLIC_ROUTES.filter((route) => route.footerGroup === 'quick'),
};

/**
 * Future areas. Typed and reserved, intentionally NOT mounted in the router
 * until authentication and authorization exist.
 */
export interface FutureAreaDefinition {
  readonly basePath: string;
  readonly labelAr: string;
  readonly guard: 'authenticated' | 'role';
}

export const FUTURE_AREAS = [
  { basePath: '/account', labelAr: 'منطقة الأعضاء', guard: 'authenticated' },
  { basePath: '/admin', labelAr: 'لوحة التحكم', guard: 'role' },
] as const satisfies readonly FutureAreaDefinition[];

export const NOT_FOUND_PATH = '*';