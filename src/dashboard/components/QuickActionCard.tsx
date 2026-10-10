import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from './icons';

export interface QuickActionCardProps {
  readonly to: string;
  readonly label: string;
  readonly icon: ReactNode;
}

/** Large tap target linking to a dashboard section from the overview. */
export default function QuickActionCard({ to, label, icon }: QuickActionCardProps) {
  return (
    <Link className="dash-action" to={to}>
      <span className="dash-action__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="dash-action__label">{label}</span>
      <span className="dash-action__arrow" aria-hidden="true">
        <ChevronLeftIcon />
      </span>
    </Link>
  );
}
