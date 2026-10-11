import { adminFetch, readAdminError } from './adminApi';
import type { CompetitionStatus } from '@/pages/competitions/status';

/** A managed competition as returned by the admin API. */
export interface AdminCompetition {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly status: CompetitionStatus;
  readonly registrationDeadline: string | null;
  readonly participantCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CompetitionUpdate {
  readonly id: string;
  readonly title?: string;
  readonly status?: CompetitionStatus;
  readonly registrationDeadline?: string | null;
}

const ENDPOINT = '/api/admin/competitions';
const LOAD_ERROR = 'تعذّر تحميل المسابقات. المرجو المحاولة مرة أخرى.';
const UPDATE_ERROR = 'تعذّر تحديث بيانات المسابقة. المرجو المحاولة مرة أخرى.';

/** List managed competitions (oldest first) with real participant counts. */
export async function listCompetitions(): Promise<AdminCompetition[]> {
  const response = await adminFetch(ENDPOINT);
  if (!response.ok) {
    throw await readAdminError(response, LOAD_ERROR);
  }

  const payload = (await response.json()) as { data?: AdminCompetition[] };
  return Array.isArray(payload.data) ? payload.data : [];
}

/** Total number of managed competitions (for the dashboard metric). */
export async function countCompetitions(): Promise<number> {
  const competitions = await listCompetitions();
  return competitions.length;
}

/** Update a competition's editable settings. */
export async function updateCompetition(input: CompetitionUpdate): Promise<AdminCompetition> {
  const response = await adminFetch(ENDPOINT, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw await readAdminError(response, UPDATE_ERROR);
  }

  const payload = (await response.json()) as { competition: AdminCompetition };
  return payload.competition;
}
