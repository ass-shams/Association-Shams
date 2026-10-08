import FinalCTA from '@/components/finalCTA';
import { competitions } from '@/data/competitions';
import CompetitionGrid from '@/pages/competitions/components/CompetitionGrid';
import CompetitionsHero from '@/pages/competitions/components/CompetitionsHero';

/**
 * Dedicated public page for all competitions organised by جمعية شمس.
 * The page composes a hero and a listing driven by `src/data/competitions.ts`.
 */
export default function Competitions() {
  return (
    <>
      <CompetitionsHero />

      <section
        className="section section--muted section--pad-default"
        aria-labelledby="competitions-list-title"
      >
        <div className="container">
          <div className="section-heading">
            <h2 id="competitions-list-title" className="section-heading__title">
              جميع المسابقات
            </h2>
            <p className="section-heading__lead">
              تعرّف على المسابقات التي تنظمها الجمعية وأهدافها ومجالاتها.
            </p>
          </div>

          <CompetitionGrid competitions={competitions} />
        </div>
      </section>

      <FinalCTA />
    </>
  );
}
