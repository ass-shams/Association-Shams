import type { ReactNode } from 'react';

export interface SectionPageProps {
  /**
   * Short Arabic introduction for the section. The page title itself is shown
   * in the sticky dashboard header, so it is not repeated here.
   */
  readonly description: string;
  readonly children: ReactNode;
}

/** Consistent content container shared by every dashboard section page. */
export default function SectionPage({ description, children }: SectionPageProps) {
  return (
    <section className="dash-section">
      <p className="dash-section__lead">{description}</p>
      {children}
    </section>
  );
}
