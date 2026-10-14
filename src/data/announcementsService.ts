/**
 * Announcements data layer (public website).
 *
 * This is the ONLY module the public UI talks to for announcement data. It reads
 * the dashboard-managed announcements from `/api/announcements` (server-side
 * service role, published and due only) and exposes them through cached hooks.
 */
import { useCallback, useEffect, useState } from 'react';

/** Shape returned by the public `/api/announcements` endpoint. */
export interface ApiAnnouncement {
  id: string;
  title: string;
  slug: string;
  body: string;
  imageUrl: string;
  status: 'draft' | 'published';
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const LIST_ENDPOINT = '/api/announcements';
const LOAD_ERROR = 'تعذّر تحميل الإعلانات. المرجو المحاولة مرة أخرى.';
const NOT_FOUND_ERROR = 'الإعلان غير موجود.';

/** Supabase Storage public-object path and its on-the-fly transform path. */
const STORAGE_OBJECT_PATH = '/storage/v1/object/public/';
const STORAGE_RENDER_PATH = '/storage/v1/render/image/public/';
const TRANSFORMABLE_IMAGE = /\.(png|jpe?g|webp)(\?.*)?$/i;

/** True when an announcement image can be served through Supabase transforms. */
function isTransformableImage(src: string): boolean {
  return src.includes(STORAGE_OBJECT_PATH) && TRANSFORMABLE_IMAGE.test(src);
}

/**
 * Builds a Supabase Storage transformation URL for an announcement image, so
 * cards download a bounded WebP instead of the full-resolution original.
 */
export function announcementImageVariant(src: string, width: number): string {
  if (!isTransformableImage(src)) {
    return src;
  }
  const base = src.split('?')[0].replace(STORAGE_OBJECT_PATH, STORAGE_RENDER_PATH);
  return `${base}?width=${width}&height=${width}&resize=cover&quality=80&format=webp`;
}

export interface AnnouncementImage {
  src: string;
  srcSet: string;
  fallbackSrc: string;
  alt: string;
}

/** Builds the display image (with responsive variants) for an announcement. */
export function buildAnnouncementImage(src: string, alt: string): AnnouncementImage {
  if (!isTransformableImage(src)) {
    return { src, srcSet: '', fallbackSrc: src, alt };
  }
  return {
    src: announcementImageVariant(src, 800),
    srcSet: [400, 800, 1200]
      .map((width) => `${announcementImageVariant(src, width)} ${width}w`)
      .join(', '),
    fallbackSrc: src,
    alt,
  };
}

/** Formats a publication timestamp for Arabic readers. */
export function formatAnnouncementDate(iso: string | null): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('ar-MA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/** Collapses an announcement body into a single-paragraph excerpt. */
export function announcementExcerpt(body: string, maxLength = 160): string {
  const flat = body.replace(/\s+/g, ' ').trim();
  if (flat.length <= maxLength) {
    return flat;
  }
  return `${flat.slice(0, maxLength).trimEnd()}…`;
}

let cache: ApiAnnouncement[] | null = null;
let inflight: Promise<ApiAnnouncement[]> | null = null;

/** Fetch the published announcements once, sharing the result across the page. */
export async function fetchAnnouncements(force = false): Promise<ApiAnnouncement[]> {
  if (!force && cache) {
    return cache;
  }
  if (!force && inflight) {
    return inflight;
  }

  inflight = (async () => {
    const response = await fetch(LIST_ENDPOINT, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(LOAD_ERROR);
    }
    const payload = (await response.json()) as { data?: ApiAnnouncement[] };
    const list = Array.isArray(payload.data) ? payload.data : [];
    cache = list;
    return list;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export interface AnnouncementsState {
  readonly announcements: ApiAnnouncement[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly reload: () => void;
}

/** Subscribe to the published announcements with loading/error state. */
export function useAnnouncements(): AnnouncementsState {
  const [announcements, setAnnouncements] = useState<ApiAnnouncement[]>(cache ?? []);
  const [loading, setLoading] = useState(cache === null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((force: boolean) => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchAnnouncements(force)
      .then((list) => {
        if (active) {
          setAnnouncements(list);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : LOAD_ERROR);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => load(false), [load]);

  const reload = useCallback(() => {
    load(true);
  }, [load]);

  return { announcements, loading, error, reload };
}

export interface AnnouncementDetailState {
  readonly announcement: ApiAnnouncement | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly notFound: boolean;
  readonly reload: () => void;
}

/** Fetch a single published announcement by slug. */
export function useAnnouncement(slug: string | undefined): AnnouncementDetailState {
  const [announcement, setAnnouncement] = useState<ApiAnnouncement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(() => {
    if (!slug) {
      setAnnouncement(null);
      setNotFound(true);
      setError(null);
      setLoading(false);
      return () => {};
    }

    let active = true;
    setLoading(true);
    setError(null);
    setNotFound(false);

    const params = new URLSearchParams({ slug });
    fetch(`${LIST_ENDPOINT}?${params.toString()}`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!active) {
          return;
        }
        if (response.status === 404) {
          setAnnouncement(null);
          setNotFound(true);
          return;
        }
        if (!response.ok) {
          throw new Error(LOAD_ERROR);
        }
        const payload = (await response.json()) as { announcement?: ApiAnnouncement };
        if (active) {
          setAnnouncement(payload.announcement ?? null);
          setNotFound(!payload.announcement);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : LOAD_ERROR);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => load(), [load]);

  return { announcement, loading, error, notFound, reload: load };
}

export { NOT_FOUND_ERROR };
