/**
 * Competition registration status — shared by the browser and the server.
 *
 * The stored status is one of `open`, `paused` or `closed`. A competition whose
 * deadline has passed becomes effectively `ended` even when its stored status is
 * still `open`, so registration is refused without mutating stored state (and
 * editing a deadline can never silently reopen a competition).
 *
 * Keep the values in sync with the `competitions_status_check` constraint in
 * `supabase/migrations/20261011140000_create_competitions.sql`.
 */

export type CompetitionStatus = 'open' | 'paused' | 'closed';

/** The stored status plus the derived `ended` state (deadline passed). */
export type EffectiveStatus = CompetitionStatus | 'ended';

export const COMPETITION_STATUSES: readonly CompetitionStatus[] = ['open', 'paused', 'closed'];

/** Slug of the competition managed by the Golden Voice registration flow. */
export const GOLDEN_VOICE_COMPETITION_SLUG = 'golden-voice';

const EFFECTIVE_STATUS_LABELS: Record<EffectiveStatus, string> = {
  open: 'مفتوحة للتسجيل',
  paused: 'متوقفة مؤقتاً',
  closed: 'مغلقة',
  ended: 'انتهى أجل التسجيل',
};

/** Short label used on the public competition card. */
const SHORT_STATUS_LABELS: Record<EffectiveStatus, string> = {
  open: 'مفتوحة',
  paused: 'متوقفة',
  closed: 'مغلقة',
  ended: 'انتهى التسجيل',
};

export function competitionStatusLabel(status: EffectiveStatus): string {
  return EFFECTIVE_STATUS_LABELS[status];
}

export function competitionShortStatusLabel(status: EffectiveStatus): string {
  return SHORT_STATUS_LABELS[status];
}

/** True when the value is one of the stored status identifiers. */
export function isCompetitionStatus(value: unknown): value is CompetitionStatus {
  return (
    typeof value === 'string' && (COMPETITION_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * Resolve the effective status. `paused` and `closed` always win over the
 * deadline; an `open` competition becomes `ended` once the deadline is reached.
 * A missing (null/undefined) deadline means no scheduled cutoff.
 */
export function resolveEffectiveStatus(
  status: CompetitionStatus,
  deadline: string | null | undefined,
  now: Date = new Date(),
): EffectiveStatus {
  if (status === 'paused') {
    return 'paused';
  }
  if (status === 'closed') {
    return 'closed';
  }

  if (deadline) {
    const at = new Date(deadline).getTime();
    if (Number.isFinite(at) && now.getTime() >= at) {
      return 'ended';
    }
  }

  return 'open';
}

/** True only when new registrations must be accepted. */
export function isRegistrationOpen(
  status: CompetitionStatus,
  deadline: string | null | undefined,
  now: Date = new Date(),
): boolean {
  return resolveEffectiveStatus(status, deadline, now) === 'open';
}
