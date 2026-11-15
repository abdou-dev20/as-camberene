import React, { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import teamHero from '../../assets/img/asc-camberene-equipe-2025.webp';
import { useTeamMembers, useTeams } from '../hooks/useContent';
import { PLAYER_TEAM_LABELS, TeamMember } from '../types';
import PageHero from '../components/ui/PageHero';
import PlayerCard from '../components/ui/PlayerCard';
import PlayerStatsTable from '../components/ui/PlayerStatsTable';
import LoadingSpinner from '../components/LoadingSpinner';

const FILTERS: { key: string; label: string }[] = [
  { key: 'Tous', label: 'Tous' },
  { key: 'Gardien', label: 'Gardiens' },
  { key: 'Défenseur', label: 'Défenseurs' },
  { key: 'Milieu', label: 'Milieux' },
  { key: 'Attaquant', label: 'Attaquants' },
  { key: 'staff', label: 'Staff' },
];

const byRank = (a: TeamMember, b: TeamMember): number =>
  (a.rank ?? 0) - (b.rank ?? 0) ||
  (a.number ?? 0) - (b.number ?? 0) ||
  a.name.localeCompare(b.name);

const cardMeta = (entry: TeamMember, team: string): string =>
  [team, entry.nationality, entry.age ? `${entry.age} ans` : null].filter(Boolean).join(' · ');

const Players: React.FC = () => {
  const { data: teams } = useTeams();
  const { data: members, loading, error, reload } = useTeamMembers();
  const [active, setActive] = useState<string>('Tous');

  const teamName = (slug: string): string =>
    teams.find((team) => team.slug === slug)?.name ?? PLAYER_TEAM_LABELS[slug] ?? slug;

  const ordered = useMemo(() => {
    const teamRank = (slug: string): number => {
      const index = teams.findIndex((team) => team.slug === slug);
      return index === -1 ? teams.length : index;
    };

    return members
      .filter((member) => member.isVisible !== false)
      .sort((a, b) => teamRank(a.team) - teamRank(b.team) || byRank(a, b));
  }, [members, teams]);

  const counts = useMemo(() => {
    const result: Record<string, number> = {
      Tous: ordered.length,
      staff: ordered.filter((member) => member.kind === 'staff').length,
    };
    FILTERS.forEach((filter) => {
      if (filter.key === 'Tous' || filter.key === 'staff') return;
      result[filter.key] = ordered.filter(
        (member) => member.kind === 'player' && member.line === filter.key
      ).length;
    });
    return result;
  }, [ordered]);

  const filtered = useMemo(() => {
    if (active === 'Tous') return ordered;
    if (active === 'staff') return ordered.filter((member) => member.kind === 'staff');
    return ordered.filter((member) => member.kind === 'player' && member.line === active);
  }, [ordered, active]);

  const allPlayers = useMemo(
    () => ordered.filter((member) => member.kind === 'player'),
    [ordered]
  );

  return (
    <div className="bg-graphite">
      <PageHero
        kicker="Structure sportive"
        title="Effectif"
        description="Joueurs et encadrement de toutes les équipes du club, saisis depuis l’administration."
        image={teamHero}
      >
        <span className="chip inline-flex items-center gap-2 bg-club-yellow text-black">
          <Users size={14} />
          {ordered.length > 0 ? `${ordered.length} membres` : 'Effectif'}
        </span>
      </PageHero>

      {loading ? (
        <section className="band-green py-12">
          <div className="site-container">
            <LoadingSpinner />
          </div>
        </section>
      ) : error ? (
        <section className="band-green py-12">
          <div className="site-container text-center">
            <p className="panel p-12 text-white/60">Impossible de charger l’effectif.</p>
            <button type="button" onClick={reload} className="btn-yellow mt-4">
              Réessayer
            </button>
          </div>
        </section>
      ) : ordered.length === 0 ? (
        <section className="band-green py-12">
          <div className="site-container">
            <p className="panel p-12 text-center text-white/60">Effectif en cours de mise à jour.</p>
          </div>
        </section>
      ) : (
        <>
          <section className="border-b border-white/10 bg-charcoal">
            <div className="site-container flex flex-wrap gap-2 py-5">
              {FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActive(filter.key)}
                  aria-pressed={active === filter.key}
                  className={`rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${
                    active === filter.key
                      ? 'bg-club-yellow text-black'
                      : 'bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {filter.label} ({counts[filter.key] ?? 0})
                </button>
              ))}
            </div>
          </section>

          <section className="band-green py-12">
            <div className="site-container">
              <div className="mb-8 flex items-center gap-3">
                <h2 className="section-title">Effectif</h2>
                <span className="chip bg-club-yellow text-black">{filtered.length}</span>
              </div>

              {filtered.length === 0 ? (
                <p className="panel p-12 text-center text-white/60">
                  Aucun membre dans cette catégorie.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {filtered.map((entry) => (
                    <PlayerCard
                      key={entry.id}
                      photo={entry.photo}
                      name={entry.name}
                      position={
                        entry.kind === 'staff'
                          ? entry.role || 'Staff'
                          : entry.position || entry.line
                      }
                      number={entry.kind === 'player' ? entry.number || undefined : undefined}
                      meta={cardMeta(entry, teamName(entry.team))}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {allPlayers.length > 0 && (
        <section className="band-graphite py-12">
          <div className="site-container">
            <h2 className="section-title mb-8">Statistiques des joueurs</h2>
            <PlayerStatsTable players={allPlayers} />
          </div>
        </section>
      )}
    </div>
  );
};

export default Players;
