import React, { useMemo } from 'react';
import { Users } from 'lucide-react';
import teamHero from '../../assets/img/asc-camberene-equipe-2025.webp';
import { useTeamMembers, useTeams } from '../hooks/useContent';
import { PLAYER_TEAM_LABELS, TeamMember } from '../types';
import PageHero from '../components/ui/PageHero';
import PlayerCard from '../components/ui/PlayerCard';
import PlayerStatsTable from '../components/ui/PlayerStatsTable';
import LoadingSpinner from '../components/LoadingSpinner';

const SECTIONS: { line: TeamMember['line']; label: string }[] = [
  { line: 'Gardien', label: 'Gardiens' },
  { line: 'Défenseur', label: 'Défenseurs' },
  { line: 'Milieu', label: 'Milieux' },
  { line: 'Attaquant', label: 'Attaquants' },
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

  const groups = useMemo(() => {
    const teamRank = (slug: string): number => {
      const index = teams.findIndex((team) => team.slug === slug);
      return index === -1 ? teams.length : index;
    };
    const sortByTeam = (a: TeamMember, b: TeamMember): number =>
      teamRank(a.team) - teamRank(b.team) || byRank(a, b);

    const visible = members.filter((member) => member.isVisible !== false);
    const players = visible.filter((member) => member.kind === 'player');
    const staff = visible.filter((member) => member.kind === 'staff').sort(sortByTeam);

    return [
      ...SECTIONS.map((section) => ({
        key: section.line as string,
        label: section.label,
        entries: players.filter((player) => player.line === section.line).sort(sortByTeam),
      })),
      { key: 'staff', label: 'Staff', entries: staff },
    ].filter((group) => group.entries.length > 0);
  }, [members, teams]);

  const teamName = (slug: string): string =>
    teams.find((team) => team.slug === slug)?.name ?? PLAYER_TEAM_LABELS[slug] ?? slug;

  const allPlayers = useMemo(
    () => members.filter((member) => member.isVisible !== false && member.kind === 'player'),
    [members]
  );
  const totalMembers = useMemo(
    () => members.filter((member) => member.isVisible !== false).length,
    [members]
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
          {totalMembers > 0 ? `${totalMembers} membres` : 'Effectif'}
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
      ) : groups.length === 0 ? (
        <section className="band-green py-12">
          <div className="site-container">
            <p className="panel p-12 text-center text-white/60">Effectif en cours de mise à jour.</p>
          </div>
        </section>
      ) : (
        <section className="band-green py-12">
          <div className="site-container space-y-14">
            {groups.map((group) => (
              <div key={group.key}>
                <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-3">
                  <h2 className="text-2xl font-extrabold uppercase tracking-wide text-white">
                    {group.label}
                  </h2>
                  <span className="chip bg-club-yellow text-black">{group.entries.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {group.entries.map((entry) => (
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
              </div>
            ))}
          </div>
        </section>
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
