import { describe, expect, it } from 'vitest';
import {
  DASHBOARD_NAV_ITEMS,
  DASHBOARD_NOT_FOUND_TITLE,
  getDashboardPageTitle,
} from './navigation';

describe('dashboard navigation', () => {
  it('lists the sections in the required order', () => {
    expect(DASHBOARD_NAV_ITEMS.map((item) => item.label)).toEqual([
      'لوحة التحكم',
      'المنخرطين',
      'المشاركين في المسابقة',
      'المسابقات',
      'الإعلانات',
      'المتجر',
      'طلبات الاتصال',
    ]);
  });

  it('maps each route to its Arabic title', () => {
    expect(getDashboardPageTitle('/')).toBe('لوحة التحكم');
    expect(getDashboardPageTitle('/members')).toBe('المنخرطين');
    expect(getDashboardPageTitle('/participants')).toBe('المشاركين في المسابقة');
    expect(getDashboardPageTitle('/competitions')).toBe('المسابقات');
    expect(getDashboardPageTitle('/announcements')).toBe('الإعلانات');
    expect(getDashboardPageTitle('/store')).toBe('المتجر');
    expect(getDashboardPageTitle('/contact')).toBe('طلبات الاتصال');
  });

  it('falls back to the not-found title for unknown paths', () => {
    expect(getDashboardPageTitle('/unknown')).toBe(DASHBOARD_NOT_FOUND_TITLE);
    expect(getDashboardPageTitle('/membership')).toBe(DASHBOARD_NOT_FOUND_TITLE);
  });

  it('keeps the parent title for nested child paths', () => {
    expect(getDashboardPageTitle('/store/123')).toBe('المتجر');
  });
});
