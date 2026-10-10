import type { ComponentType } from 'react';
import {
  HomeIcon,
  MailIcon,
  MicIcon,
  StoreIcon,
  TrophyIcon,
  UsersIcon,
} from './components/icons';
import type { IconProps } from './components/icons';

/**
 * Sidebar destinations inside the dashboard.
 *
 * `/` is the index route rendered inside the dashboard layout. Every other path
 * is a child of the layout route (see `DashboardApp`). No target here points to
 * the public site — "عرض الموقع" and logout are rendered separately because they
 * are not router links.
 */
export interface DashboardNavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: ComponentType<IconProps>;
}

export const DASHBOARD_NAV_ITEMS: readonly DashboardNavItem[] = [
  { path: '/', label: 'لوحة التحكم', icon: HomeIcon },
  { path: '/members', label: 'المنخرطين', icon: UsersIcon },
  { path: '/participants', label: 'المشاركين في المسابقة', icon: MicIcon },
  { path: '/competitions', label: 'المسابقات', icon: TrophyIcon },
  { path: '/store', label: 'المتجر', icon: StoreIcon },
  { path: '/contact', label: 'طلبات الاتصال', icon: MailIcon },
];

export const DASHBOARD_NOT_FOUND_TITLE = 'الصفحة غير موجودة';

/** Title shown in the dashboard header for a given pathname. */
export function getDashboardPageTitle(pathname: string): string {
  const item = DASHBOARD_NAV_ITEMS.find((candidate) =>
    candidate.path === '/'
      ? pathname === '/'
      : pathname === candidate.path || pathname.startsWith(`${candidate.path}/`),
  );

  return item?.label ?? DASHBOARD_NOT_FOUND_TITLE;
}
