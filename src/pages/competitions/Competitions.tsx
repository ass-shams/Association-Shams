import { useEffect, useState } from 'react';
import FinalCTA from '@/components/finalCTA';
import { competitions as baseCompetitions } from '@/data/competitions';
import { fetchPublicCompetitions } from '@/data/competitionsService';
import type { PublicCompetition } from '@/data/competitionsService';
import CompetitionGrid from '@/pages/competitions/components/CompetitionGrid';
import CompetitionsHero from '@/pages/competitions/components/CompetitionsHero';
import { competitionShortStatusLabel } from '@/pages/competitions/status';
import type { Competition } from '@/types';

/** Format an ISO deadline for the card (e.g. 23 أكتوبر 2026). */
function formatDeadline(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString('ar-MA', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Merge managed live fields over the presentation defaults for one card. */
function toCard(base: Competition | undefined, live: PublicCompetition): Competition {
  return {
    slug: live.slug,
    title: live.title,
    description: live.description,
    status: competitionShortStatusLabel(live.effectiveStatus),
    statusTone: live.effectiveStatus,
    href: base?.href,
    image: base?.image,
    registrationDeadline: live.registrationDeadline
      ? formatDeadline(live.registrationDeadline)
      : undefined,
    participantsCount: live.participantsCount,
  };
}

/** Live competitions when available; presentation defaults otherwise. */
function resolveCompetitions(live: PublicCompetition[] | null): readonly Competition[] {
  if (!live || live.length === 0) {
    return baseCompetitions;
  }
  return live.map((item) =>
    toCard(
      baseCompetitions.find((candidate) => candidate.slug === item.slug),
      item,
    ),
  );
}

/**
 * Dedicated public page for all competitions organised by جمعية شمس.
 *
 * The listing is driven by the managed competitions from `/api/competitions`
 * (status, deadline, participant count), with the presentation defaults in
 * `src/data/competitions.ts` providing the cover image and detail route. If the
 * endpoint is unavailable, it falls back to the presentation defaults rather
 * than showing an invented participant count.
 */
export default function Competitions() {
  const [live, setLive] = useState<PublicCompetition[] | null>(null);

  useEffect(() => {
    let active = true;

    fetchPublicCompetitions()
      .then((list) => {
        if (active) {
          setLive(list);
        }
      })
      .catch(() => {
        if (active) {
          setLive(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

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

          <CompetitionGrid competitions={resolveCompetitions(live)} />
        </div>
      </section>

      <FinalCTA />
    </>
  );
}
