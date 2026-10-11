import { getSupabaseAdmin } from './supabaseAdmin.js';
import {
  GOLDEN_VOICE_COMPETITION_SLUG,
  isCompetitionStatus,
  isRegistrationOpen,
} from '../../src/pages/competitions/status.js';

/** Table holding managed competitions. */
export const COMPETITIONS_TABLE = 'competitions';

export type RegistrationGate =
  | { readonly ok: true; readonly competitionId: string }
  | { readonly ok: false; readonly reason: 'unavailable' | 'not-found' | 'not-open' };

interface CompetitionRow {
  id: string;
  status: unknown;
  registration_deadline: string | null;
}

/**
 * Resolve whether the Golden Voice registration flow may accept a submission.
 *
 * This runs server-side before any insert. A competition that is paused/closed,
 * or whose deadline has passed (even when its stored status is still `open`), is
 * refused. A missing competition row or a database failure fails closed.
 */
export async function resolveGoldenVoiceRegistrationGate(): Promise<RegistrationGate> {
  let client;
  try {
    client = getSupabaseAdmin();
  } catch {
    return { ok: false, reason: 'unavailable' };
  }

  const { data, error } = await client
    .from(COMPETITIONS_TABLE)
    .select('id, status, registration_deadline')
    .eq('slug', GOLDEN_VOICE_COMPETITION_SLUG)
    .maybeSingle();

  if (error) {
    return { ok: false, reason: 'unavailable' };
  }

  if (!data) {
    return { ok: false, reason: 'not-found' };
  }

  const row = data as CompetitionRow;

  if (!isCompetitionStatus(row.status)) {
    return { ok: false, reason: 'not-open' };
  }

  if (!isRegistrationOpen(row.status, row.registration_deadline)) {
    return { ok: false, reason: 'not-open' };
  }

  return { ok: true, competitionId: row.id };
}
