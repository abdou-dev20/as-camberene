import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Quote, Target, Trophy, Users } from 'lucide-react';
import { useLegends } from '../hooks/useContent';
import PageHero from '../components/ui/PageHero';

const ERAS = ['Toutes', 'Classic Era', 'Golden Age', 'Modern Era'];

const Legends: React.FC = () => {
  const [era, setEra] = useState('Toutes');
  const { data: legends } = useLegends();

  const filtered = useMemo(
    () => (era === 'Toutes' ? legends : legends.filter((legend) => legend.era === era)),
    [legends, era]
  );

  const featured = useMemo(
    () => legends.find((legend) => legend.isHallOfFame) ?? legends[0],
    [legends]
  );

  const totals = useMemo(
    () => ({
      count: legends.length,
      hallOfFame: legends.filter((legend) => legend.isHallOfFame).length,
      trophies: legends.reduce((acc, legend) => acc + legend.stats.trophies, 0),
      goals: legends.reduce((acc, legend) => acc + legend.stats.goals, 0),
    }),
    [legends]
  );

  if (!featured) {
    return (
      <div className="band-green flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-3xl font-extrabold uppercase text-white">Aucune légende publiée</h1>
          <p className="mt-3 text-sm text-white/70">
            Les fiches se saisissent dans l'administration du site.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-graphite">
      <PageHero
        kicker="Hall of Fame"
        title="Légendes"
        description="Les joueurs qui ont marqué l'histoire de l'ASC Cambérène."
        image={featured.photo}
      />

      <section className="border-b border-white/10 bg-charcoal">
        <div className="site-container grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          {[
            { icon: Users, value: totals.count, label: 'Légendes' },
            { icon: Crown, value: totals.hallOfFame, label: 'Hall of Fame' },
            { icon: Trophy, value: totals.trophies, label: 'Trophées' },
            { icon: Target, value: totals.goals, label: 'Buts marqués' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label}>
              <Icon size={20} className="text-club-yellow" />
              <p className="mt-2 text-3xl font-extrabold text-white">{value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/50">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="band-charcoal py-12">
        <div className="site-container grid items-center gap-10 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div className="relative overflow-hidden rounded-[20px] border border-white/10">
            <img src={featured.photo} alt={featured.name} className="aspect-[3/4] w-full object-cover" />
            <span className="absolute right-4 top-4 flex h-14 w-14 items-center justify-center rounded-full bg-club-yellow text-2xl font-extrabold text-black">
              {featured.jerseyNumber}
            </span>
            {featured.isHallOfFame && (
              <span className="absolute bottom-4 left-4 chip flex items-center gap-1.5 bg-club-yellow text-black">
                <Crown size={12} />
                Hall of Fame
              </span>
            )}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-club-yellow">Portrait</p>
            <h2 className="mt-2 text-4xl font-extrabold uppercase text-white md:text-6xl">{featured.name}</h2>
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
              <span className="font-bold uppercase text-club-yellow">{featured.position}</span>
              <span className="text-white/30">·</span>
              <span>{featured.period}</span>
              <span className="text-white/30">·</span>
              <span>{featured.nationality}</span>
            </p>

            <blockquote className="panel mt-8 p-6">
              <Quote size={24} className="text-club-yellow" />
              <p className="mt-3 text-lg italic leading-relaxed text-white">« {featured.quote} »</p>
            </blockquote>

            <p className="mt-6 leading-relaxed text-white/70">{featured.biography}</p>

            <Link to={`/legends/${featured.id}`} className="btn-yellow mt-8">Voir la fiche complète</Link>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-charcoal">
        <div className="site-container flex flex-wrap gap-2 py-5">
          {ERAS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setEra(item)}
              aria-pressed={era === item}
              className={`rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${
                era === item
                  ? 'bg-club-yellow text-black'
                  : 'bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="band-green py-12">
        <div className="site-container">
          {filtered.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((legend) => (
                <Link
                  key={String(legend.id)}
                  to={`/legends/${legend.id}`}
                  className="group flex flex-col overflow-hidden rounded-[20px] border border-white/10 bg-black/25 transition-colors hover:border-club-yellow/50"
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img
                      src={legend.photo}
                      alt={legend.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                    <span className="absolute left-3 top-3 chip bg-black/60 text-white">{legend.era}</span>
                    <span className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-club-yellow font-extrabold text-black">
                      {legend.jerseyNumber}
                    </span>
                    {legend.isHallOfFame && (
                      <span className="absolute right-3 bottom-3 chip flex items-center gap-1 bg-club-yellow text-black">
                        <Crown size={11} />
                        HOF
                      </span>
                    )}
                    <div className="absolute bottom-3 left-3 flex gap-4">
                      {[
                        { value: legend.stats.matches, label: 'Matchs' },
                        { value: legend.stats.goals, label: 'Buts' },
                        { value: legend.stats.trophies, label: 'Trophées' },
                      ].map((stat) => (
                        <div key={stat.label} className="text-center">
                          <p className="text-base font-extrabold text-white">{stat.value}</p>
                          <p className="text-[10px] uppercase text-white/60">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative flex flex-1 flex-col p-4">
                    <span
                      className="absolute inset-x-0 top-0 block h-[2px]"
                      style={{ background: 'linear-gradient(90deg, var(--club-yellow) 60%, var(--club-green))' }}
                    />
                    <p className="text-xs font-extrabold uppercase text-club-yellow">{legend.position}</p>
                    <h2 className="mt-0.5 text-xl font-extrabold uppercase text-white">{legend.name}</h2>
                    <p className="mt-1 text-xs text-white/50">{legend.period} · {legend.nationality}</p>
                    <p className="mt-3 line-clamp-2 text-sm italic text-white/70">« {legend.quote} »</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="panel p-12 text-center text-white/60">Aucune légende pour cette époque.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Legends;
