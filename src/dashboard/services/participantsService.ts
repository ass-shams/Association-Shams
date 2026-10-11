import { adminFetch, readAdminError } from './adminApi';

export type ParticipantRegion = 'beni_mellal_khenifra' | 'other';

/** A Golden Voice registration as returned by the admin API. */
export interface Participant {
  readonly id: string;
  readonly full_name: string;
  readonly phone: string;
  readonly age: number;
  readonly city: string;
  readonly region: ParticipantRegion;
  readonly created_at: string;
  /** True when the participant has a privately stored participation video. */
  readonly hasVideo: boolean;
}

export interface ParticipantsQuery {
  readonly search?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface ParticipantsResult {
  readonly data: Participant[];
  readonly count: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface ParticipantVideoLink {
  readonly url: string;
  readonly expiresIn: number;
}

const LIST_ENDPOINT = '/api/admin/participants';
const VIDEO_ENDPOINT = '/api/admin/participant-video';

const LOAD_ERROR = 'تعذّر تحميل المشاركين. المرجو المحاولة مرة أخرى.';
const VIDEO_ERROR = 'تعذّر تحميل الفيديو. المرجو المحاولة مرة أخرى.';

/** Newest-first, paginated list with optional search by name, phone or city. */
export async function listParticipants(
  query: ParticipantsQuery = {},
): Promise<ParticipantsResult> {
  const params = new URLSearchParams();
  if (query.search && query.search.trim()) {
    params.set('q', query.search.trim());
  }
  params.set('page', String(query.page ?? 1));
  params.set('pageSize', String(query.pageSize ?? 20));

  const response = await adminFetch(`${LIST_ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    throw await readAdminError(response, LOAD_ERROR);
  }

  return (await response.json()) as ParticipantsResult;
}

/** Total number of participants (for the dashboard metric). */
export async function countParticipants(): Promise<number> {
  const result = await listParticipants({ pageSize: 1 });
  return result.count;
}

/**
 * Request a short-lived signed URL for one participant's private video. When
 * `download` is true, Storage serves the file as an attachment. The server
 * derives the object path from the participant record and re-checks admin
 * authorization, so the client cannot request an arbitrary path.
 */
export async function getParticipantVideoUrl(
  id: string,
  download = false,
): Promise<ParticipantVideoLink> {
  const params = new URLSearchParams({ id });
  if (download) {
    params.set('download', '1');
  }

  const response = await adminFetch(`${VIDEO_ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    throw await readAdminError(response, VIDEO_ERROR);
  }

  return (await response.json()) as ParticipantVideoLink;
}
