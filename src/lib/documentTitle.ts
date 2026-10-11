import { useEffect } from 'react';

/** Official association name, used as the suffix on every page title. */
export const SITE_NAME = 'جمعية شمس للكفيف و المبصر';

/**
 * Builds a document title from a page-specific label.
 *
 * Every page follows the `اسم الصفحة | جمعية شمس للكفيف و المبصر` convention.
 * The homepage omits the label entirely and shows the official name alone.
 */
export function formatDocumentTitle(pageTitle?: string): string {
  return pageTitle ? `${pageTitle} | ${SITE_NAME}` : SITE_NAME;
}

/**
 * Keeps `document.title` in sync with the current page.
 *
 * Runs on mount and whenever `pageTitle` changes, so client-side navigation
 * updates the tab title without a full reload. Passing `undefined` renders the
 * homepage title (the official name only).
 */
export function useDocumentTitle(pageTitle?: string): void {
  useEffect(() => {
    document.title = formatDocumentTitle(pageTitle);
  }, [pageTitle]);
}
