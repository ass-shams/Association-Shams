import type { CompetitionStatus, EffectiveStatus } from '@/pages/competitions/status';

/**
 * Public read-only competitions service.
 *
 * The `/competitions` page and the Golden Voice registration page read live
 * competition data (status, deadline, participant count) from the serverless
 * `/api/competitions` endpoint, which uses the service role server-side. The
 * browser never queries the RLS-protected table directly.
 */
export interface PublicCompetition {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly status: CompetitionStatus;
  readonly effectiveStatus: EffectiveStatus;
  readonly registrationDeadline: string | null;
  readonly participantsCount: number;
}

const ENDPOINT = '/api/competitions';

/** Fetch the public competition list. Rejects on a non-OK response. */
export async function fetchPublicCompetitions(): Promise<PublicCompetition[]> {
  const response = await fetch(ENDPOINT, {
    method: 'GET',
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('تعذّر تحميل المسابقات.');
  }

  const payload = (await response.json()) as { data?: PublicCompetition[] };
  return Array.isArray(payload.data) ? payload.data : [];
}
