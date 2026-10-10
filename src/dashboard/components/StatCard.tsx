import type { ReactNode } from 'react';

export interface StatCardProps {
  readonly label: string;
  /**
   * The statistic value, or `null` when the data source is not connected yet.
   * A `null` value renders a clear "not connected" state instead of a
   * misleading zero.
   */
  readonly value: number | null;
  readonly icon: ReactNode;
  readonly isLoading?: boolean;
}

/**
 * Overview statistic card, ready for a real API value.
 *
 * Until a data service supplies `value`, callers pass `null` and the card shows
 * an honest "غير متصل بعد" state rather than a fabricated number.
 */
export default function StatCard({ label, value, icon, isLoading = false }: StatCardProps) {
  return (
    <article className="dash-stat" aria-busy={isLoading} aria-label={label}>
      <span className="dash-stat__icon" aria-hidden="true">
        {icon}
      </span>
      <div className="dash-stat__body">
        <p className="dash-stat__label">{label}</p>
        {isLoading ? (
          <span className="dash-stat__skeleton" aria-hidden="true" />
        ) : value === null ? (
          <p className="dash-stat__value dash-stat__value--muted">غير متصل بعد</p>
        ) : (
          <p className="dash-stat__value">{value.toLocaleString('en-US')}</p>
        )}
      </div>
    </article>
  );
}
