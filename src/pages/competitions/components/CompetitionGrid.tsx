import type { Competition } from '@/types';
import CompetitionCard from '@/pages/competitions/components/CompetitionCard';

export interface CompetitionGridProps {
  readonly competitions: readonly Competition[];
}

/** Responsive grid of reusable competition cards. */
export default function CompetitionGrid({ competitions }: CompetitionGridProps) {
  if (competitions.length === 0) {
    return null;
  }

  return (
    <div className="grid grid--300 competition-grid">
      {competitions.map((competition) => (
        <CompetitionCard key={competition.slug} competition={competition} />
      ))}
    </div>
  );
}
