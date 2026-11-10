import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin, Phone, Users } from 'lucide-react';
import teamHero from '../../assets/img/asc-camberene-equipe-2025.webp';
import { useTeamMembers, useTeams } from '../hooks/useContent';
import { TeamMember } from '../types';
import PageHero from './ui/PageHero';
import PlayerCard from './ui/PlayerCard';
import PlayerStatsTable from './ui/PlayerStatsTable';

interface TeamRosterViewProps {
  teamId: string;
}

interface PlayerEntry {
  name: string;
  number?: number;
  age?: number;
  nationality?: string;
  role?: string;
  experience?: string;
  photo: string;
  contact?: { email: string; phone: string };
}

const SECTION_OF_LINE: Record<string, string> = {
  Gardien: 'Gardiens',
  Défenseur: 'Défenseurs',
  Milieu: 'Milieux',
  Attaquant: 'Attaquants',
};

const toEntry = (member: TeamMember): PlayerEntry => ({
  name: member.name,
  number: member.kind === 'player' ? member.number : undefined,
  age: member.age || undefined,
  nationality: member.nationality || undefined,
  role: member.role || undefined,
  photo: member.photo,
});

const sectionsOfMembers = (members: TeamMember[]) => {
  const sections: Record<string, PlayerEntry[]> = {
    Gardiens: [],
    Défenseurs: [],
    Milieux: [],
    Attaquants: [],
    Staff: [],
  };

  members.forEach((member) => {
    const key = member.kind === 'staff' ? 'Staff' : SECTION_OF_LINE[member.line] ?? 'Milieux';
    sections[key].push(toEntry(member));
  });

  return sections;
};

const TeamRosterView: React.FC<TeamRosterViewProps> = ({ teamId }) => {
  const { data: teams } = useTeams();
  const { data: members } = useTeamMembers(teamId);

  const team = useMemo(
    () => teams.find((entry) => entry.slug === teamId),
    [teams, teamId]
  );

  const coach = useMemo(() => {
    const head = members.find(
      (member) => member.kind === 'staff' && /entra[iî]neur\s+principal/i.test(member.role ?? '')
    );
    return head?.name ?? team?.coach;
  }, [members, team]);

  const sections = useMemo(() => sectionsOfMembers(members), [members]);

  const headcount = members.length;
  const [activeSection, setActiveSection] = useState<string>('Attaquants');

  const players = useMemo(() => members.filter((member) => member.kind === 'player'), [members]);

  if (!team) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-graphite px-4">
        <div className="max-w-md text-center">
          <h1 className="mb-3 text-3xl font-extrabold uppercase text-white">Équipe introuvable</h1>
          <p className="mb-6 text-sm text-white/60">
            L'identifiant « {teamId} » ne correspond à aucune équipe référencée.
          </p>
          <Link to="/teams" className="btn-yellow">
            <ArrowLeft size={16} />
            Toutes les équipes
          </Link>
        </div>
      </div>
    );
  }

  const played = team.stats.wins + team.stats.draws + team.stats.losses;
  const sectionNames = Object.keys(sections);
  const activeEntries: PlayerEntry[] = sections[activeSection as keyof typeof sections] ?? [];
  const isStaff = activeSection === 'Staff';
  const rosterIsEmpty = sectionNames.every((name) => sections[name as keyof typeof sections].length === 0);

  return (
    <div className="bg-graphite">
      <PageHero
        kicker={`${team.subtitle} · ${team.ageRange}`}
        title={team.name}
        description={team.description}
        image={team.image || teamHero}
      >
        <Link
          to="/teams"
          className="inline-flex items-center gap-2 text-sm font-bold uppercase text-white/70 transition-colors hover:text-club-yellow"
        >
          <ArrowLeft size={16} />
          Toutes les équipes
        </Link>
      </PageHero>

      <section className="border-b border-white/10 bg-charcoal">
        <div className="site-container grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/50">Entraîneur</p>
            <p className="mt-1 font-extrabold uppercase text-white">{coach}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-white/50">
              <Users size={13} className="text-club-yellow" />
              Effectif
            </p>
            <p className="mt-1 font-extrabold uppercase text-white">
              {headcount > 0 ? `${headcount} joueurs` : 'À compléter'}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-white/50">
              <MapPin size={13} className="text-club-yellow" />
              Terrain
            </p>
            <p className="mt-1 font-extrabold uppercase text-white">{team.stadium}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/50">Entraînements</p>
            <p className="mt-1 font-extrabold uppercase text-white">{team.training}</p>
          </div>
        </div>
      </section>

      <section className="band-green py-12">
        <div className="site-container">
          <div className="mb-8 flex flex-wrap gap-2">
            {sectionNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setActiveSection(name)}
                aria-pressed={activeSection === name}
                className={`rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${
                  activeSection === name
                    ? 'bg-club-yellow text-black'
                    : 'bg-black/25 text-white/70 hover:bg-black/40 hover:text-white'
                }`}
              >
                {name} ({sections[name as keyof typeof sections].length})
              </button>
            ))}
          </div>

          {rosterIsEmpty ? (
            <p className="panel p-12 text-center text-white/60">Effectif en cours de mise à jour.</p>
          ) : activeEntries.length > 0 ? (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {activeEntries.map((entry) => (
                <div key={`${entry.name}-${entry.number ?? entry.role ?? ''}`}>
                  <PlayerCard
                    photo={entry.photo}
                    name={entry.name}
                    position={isStaff ? entry.role : activeSection}
                    number={entry.number}
                    meta={
                      isStaff
                        ? entry.experience && `${entry.experience} d'expérience`
                        : [entry.nationality, entry.age ? `${entry.age} ans` : null].filter(Boolean).join(' · ')
                    }
                  />
                  {isStaff && entry.contact && (
                    <div className="mt-2 space-y-1 px-1 text-xs text-white/60">
                      <p className="flex items-center gap-2 truncate">
                        <Mail size={12} className="shrink-0 text-club-yellow" />
                        {entry.contact.email}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone size={12} className="shrink-0 text-club-yellow" />
                        {entry.contact.phone}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="panel p-12 text-center text-white/60">Aucun élément dans cette ligne.</p>
          )}
        </div>
      </section>

      <section className="band-charcoal py-12">
        <div className="site-container">
          <h2 className="section-title mb-8">Bilan de la saison</h2>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {[
              { value: played, label: 'Matchs joués' },
              { value: team.stats.wins, label: 'Victoires' },
              { value: team.stats.draws, label: 'Nuls' },
              { value: team.stats.losses, label: 'Défaites' },
            ].map((item) => (
              <div key={item.label} className="panel p-6 text-center">
                <p className="text-4xl font-extrabold text-club-yellow">{item.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/50">{item.label}</p>
              </div>
            ))}
          </div>

          {team.achievements.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {team.achievements.map((achievement) => (
                <span key={achievement} className="chip bg-club-green text-white">{achievement}</span>
              ))}
            </div>
          )}
        </div>
      </section>

      {players.length > 0 && (
        <section className="band-graphite py-12">
          <div className="site-container">
            <h2 className="section-title mb-8">Statistiques des joueurs</h2>
            <PlayerStatsTable players={players} />
          </div>
        </section>
      )}
    </div>
  );
};

export default TeamRosterView;
