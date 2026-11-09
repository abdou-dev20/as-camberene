import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users } from 'lucide-react';
import teamHero from '../../assets/img/asc-camberene-equipe-2025.webp';
import { useTeamMembers, useTeams } from '../hooks/useContent';
import PageHero from '../components/ui/PageHero';
import { handleImageError } from '../lib/imagePlaceholder';

const CATEGORIES = [
  { id: 'all', name: 'Toutes les équipes' },
  { id: 'senior', name: 'Équipe première' },
  { id: 'youth', name: 'Formation' },
] as const;

const CLUB_STATS = [
  { value: '101', label: 'Licenciés' },
  { value: '15', label: 'Trophées' },
  { value: '60', label: "Ans d'existence" },
  { value: '3', label: 'Titres nationaux' },
];

const Teams: React.FC = () => {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['id']>('all');
  const { data: teams } = useTeams();
  const { data: members } = useTeamMembers();

  const countByTeam = useMemo(() => {
    const counts = new Map<string, number>();
    members.forEach((member) => {
      counts.set(member.team, (counts.get(member.team) ?? 0) + 1);
    });
    return counts;
  }, [members]);

  const visible = category === 'all' ? teams : teams.filter((team) => team.category === category);

  return (
    <div className="bg-graphite">
      <PageHero
        kicker="Structure sportive"
        title="Nos équipes"
        description="De l'éveil des plus jeunes à l'exigence du haut niveau, chaque catégorie porte la même identité de jeu."
        image={teamHero}
      />

      <section className="border-b border-white/10 bg-charcoal">
        <div className="site-container grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          {CLUB_STATS.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-extrabold text-club-yellow">{stat.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/50">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-white/10 bg-charcoal">
        <div className="site-container flex flex-wrap gap-2 py-5">
          {CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              aria-pressed={category === item.id}
              className={`rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${
                category === item.id
                  ? 'bg-club-yellow text-black'
                  : 'bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </section>

      <section className="band-green py-12">
        <div className="site-container grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((team) => (
            <Link
              key={team.slug}
              to={`/teams/${team.slug}`}
              className="group overflow-hidden rounded-[20px] border border-white/10 bg-black/25 transition-colors hover:border-club-yellow/50"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={team.image || teamHero}
                  alt={team.name}
                  onError={handleImageError}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                <span className="absolute left-3 top-3 chip bg-club-yellow text-black">{team.ageRange}</span>
                <div className="absolute inset-x-4 bottom-3">
                  <h2 className="text-xl font-extrabold uppercase text-white">{team.name}</h2>
                  <p className="truncate text-sm text-white/70">{team.subtitle}</p>
                </div>
              </div>

              <div className="space-y-3 p-4">
                <p className="text-sm text-white/70">{team.description}</p>
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/50">
                  <span className="flex items-center gap-1.5">
                    <Users size={13} className="text-club-yellow" />
                    {countByTeam.get(team.slug)
                      ? `${countByTeam.get(team.slug)} joueurs`
                      : 'Effectif à compléter'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-club-yellow" />
                    {team.stadium}
                  </span>
                  <span>Depuis {team.established}</span>
                </div>
                <p className="text-xs uppercase tracking-wide text-white/50">
                  Entraîneur · <span className="font-bold text-white">{team.coach}</span>
                </p>
              </div>
            </Link>
          ))}

          {visible.length === 0 && (
            <p className="panel col-span-full p-12 text-center text-white/60">
              Aucune équipe dans cette catégorie.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Teams;
