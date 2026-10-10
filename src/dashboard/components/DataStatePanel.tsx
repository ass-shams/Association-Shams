import type { ReactNode } from 'react';
import { AlertIcon, InboxIcon, PlugIcon } from './icons';

export type DataStateVariant = 'loading' | 'empty' | 'error' | 'not-connected';

export interface DataStatePanelProps {
  readonly variant: DataStateVariant;
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
}

function DefaultIcon({ variant }: { variant: DataStateVariant }) {
  if (variant === 'error') {
    return <AlertIcon />;
  }
  if (variant === 'empty') {
    return <InboxIcon />;
  }
  return <PlugIcon />;
}

/**
 * Shared loading / empty / error / not-connected state for dashboard sections.
 *
 * Sections without a data service use `not-connected` so visitors see an
 * honest status instead of fabricated content.
 */
export default function DataStatePanel({
  variant,
  title,
  description,
  action,
}: DataStatePanelProps) {
  const isLoading = variant === 'loading';

  return (
    <div
      className={`dash-panel${variant === 'error' ? ' dash-panel--error' : ''}`}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={isLoading || variant === 'error' ? 'polite' : undefined}
    >
      <span className="dash-panel__icon" aria-hidden="true">
        {isLoading ? <span className="btn__spinner dash-panel__spinner" /> : <DefaultIcon variant={variant} />}
      </span>
      <h3 className="dash-panel__title">{title}</h3>
      <p className="dash-panel__text">{description}</p>
      {action ? <div className="dash-panel__action">{action}</div> : null}
    </div>
  );
}
