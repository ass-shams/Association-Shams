import { useEffect, useRef } from 'react';
import { formatDocumentTitle } from './documentTitle';

/** Verified production origin for the public website (see `vercel.json`). */
export const SITE_URL = 'https://associationshams.com';

/** Stable, crawler-facing social image (a copy of the association logo). */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;
export const OG_IMAGE_ALT = 'شعار جمعية شمس للكفيف و المبصر';
export const OG_LOCALE = 'ar_MA';

/** One entry of a schema.org `BreadcrumbList`, ordered from root to leaf. */
export interface BreadcrumbEntry {
  readonly name: string;
  readonly path: string;
}

/** Metadata applied to the document for a single public route. */
export interface PageSeo {
  /** Page label; omit on the homepage so only the official name is shown. */
  readonly pageTitle?: string;
  /** Unique, page-specific meta description. */
  readonly description: string;
  /** Canonical path beginning with `/`. */
  readonly path: string;
  /** Optional breadcrumb trail rendered as JSON-LD. */
  readonly breadcrumbs?: readonly BreadcrumbEntry[];
  /** When true, the page is kept out of the index (e.g. the 404 page). */
  readonly noindex?: boolean;
}

const BREADCRUMB_SCRIPT_ID = 'seo-breadcrumb-jsonld';

function absoluteUrl(path: string): string {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

/** Replaces every matching `<meta>` with a single managed tag. */
function setMeta(attribute: 'name' | 'property', key: string, content: string): void {
  document.head.querySelectorAll(`meta[${attribute}="${key}"]`).forEach((node) => {
    node.remove();
  });

  const meta = document.createElement('meta');
  meta.setAttribute(attribute, key);
  meta.setAttribute('content', content);
  document.head.appendChild(meta);
}

/** Replaces any existing canonical link with a single managed one. */
function setCanonical(href: string): void {
  document.head.querySelectorAll('link[rel="canonical"]').forEach((node) => {
    node.remove();
  });

  const link = document.createElement('link');
  link.setAttribute('rel', 'canonical');
  link.setAttribute('href', href);
  document.head.appendChild(link);
}

/** Adds or removes the page-level `BreadcrumbList` JSON-LD script. */
function setBreadcrumbs(breadcrumbs?: readonly BreadcrumbEntry[]): void {
  document.getElementById(BREADCRUMB_SCRIPT_ID)?.remove();

  if (!breadcrumbs || breadcrumbs.length === 0) {
    return;
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = BREADCRUMB_SCRIPT_ID;
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: absoluteUrl(entry.path),
    })),
  });
  document.head.appendChild(script);
}

/** Applies every managed document tag for a page. Idempotent and deduplicated. */
export function applyPageSeo(seo: PageSeo): void {
  const title = formatDocumentTitle(seo.pageTitle);
  const canonical = absoluteUrl(seo.path);
  const robots = seo.noindex ? 'noindex, follow' : 'index, follow';

  document.title = title;

  setMeta('name', 'description', seo.description);
  setMeta('name', 'robots', robots);
  setCanonical(canonical);

  setMeta('property', 'og:type', 'website');
  setMeta('property', 'og:site_name', 'جمعية شمس للكفيف و المبصر');
  setMeta('property', 'og:locale', OG_LOCALE);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', seo.description);
  setMeta('property', 'og:url', canonical);
  setMeta('property', 'og:image', DEFAULT_OG_IMAGE);
  setMeta('property', 'og:image:alt', OG_IMAGE_ALT);

  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', seo.description);
  setMeta('name', 'twitter:image', DEFAULT_OG_IMAGE);
  setMeta('name', 'twitter:image:alt', OG_IMAGE_ALT);

  setBreadcrumbs(seo.breadcrumbs);
}

/**
 * Keeps the document metadata in sync with the current route.
 *
 * Runs on mount and whenever the route identity (`pageTitle`, `description`,
 * `path`) changes, so client-side navigation updates the tab and social tags
 * without a full reload. Breadcrumbs are read from a ref so callers may pass a
 * fresh array each render without re-triggering the effect.
 */
export function usePageSeo(seo: PageSeo): void {
  const breadcrumbsRef = useRef(seo.breadcrumbs);
  breadcrumbsRef.current = seo.breadcrumbs;

  const { pageTitle, description, path, noindex } = seo;

  useEffect(() => {
    applyPageSeo({
      pageTitle,
      description,
      path,
      noindex,
      breadcrumbs: breadcrumbsRef.current,
    });
  }, [pageTitle, description, path, noindex]);
}
