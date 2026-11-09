import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Crown, Quote, Star, Target, Trophy, Users } from 'lucide-react';
import { useLegend, useLegends } from '../hooks/useContent';
import LoadingSpinner from '../components/LoadingSpinner';

const LegendDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { legend, loading } = useLegend(id);
  const { data: legends } = useLegends();

  if (loading && !legend) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-graphite">
        <LoadingSpinner />
      </div>
    );
  }

  if (!legend) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-graphite px-4">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-extrabold uppercase text-white">Légende introuvable</h1>
          <Link to="/legends" className="btn-yellow">Retour aux légendes</Link>
        </div>
      </div>
    );
  }

  const stats = [
    { icon: Users, label: 'Matchs joués', value: legend.stats.matches },
    { icon: Target, label: 'Buts marqués', value: legend.stats.goals },
    { icon: Star, label: 'Passes décisives', value: legend.stats.assists },
    { icon: Trophy, label: 'Trophées', value: legend.stats.trophies },
  ];

  const others = legends.filter((entry) => String(entry.id) !== String(legend.id)).slice(0, 6);

  return (
    <div className="bg-graphite">
      <section className="page-hero page-hero--image min-h-[520px] bg-graphite">
        <img src={legend.photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="site-container relative z-20 pb-12 pt-32">
          <Link
            to="/legends"
            className="mb-6 inline-flex items-center gap-2 text-sm font-bold uppercase text-white/70 transition-colors hover:text-club-yellow"
          >
            <ArrowLeft size={16} />
            Retour aux légendes
          </Link>

          {legend.isHallOfFame && (
            <span className="chip mb-4 flex w-fit items-center gap-1.5 bg-club-yellow text-black">
              <Crown size={12} />
              Hall of Fame
            </span>
          )}

          <p className="page-hero__kicker text-shadow-hero">{legend.position}</p>
          <h1 className="page-hero__title text-shadow-hero">{legend.name}</h1>
          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
            <span className="font-bold">#{legend.jerseyNumber}</span>
            <span className="text-white/30">·</span>
            <span>{legend.period}</span>
            <span className="text-white/30">·</span>
            <span>{legend.nationality}</span>
            <span className="text-white/30">·</span>
            <span>{legend.era}</span>
          </p>
        </div>
      </section>

      <section className="band-charcoal py-12">
        <div className="site-container grid grid-cols-2 gap-5 lg:grid-cols-4">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="panel p-6 text-center">
              <Icon size={22} className="mx-auto text-club-yellow" />
              <p className="mt-3 text-4xl font-extrabold text-white">{value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/50">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="band-graphite py-12">
        <div className="site-container grid gap-10 lg:grid-cols-[1fr_minmax(0,360px)]">
          <div>
            <blockquote className="panel p-8">
              <Quote size={28} className="text-club-yellow" />
              <p className="mt-4 text-xl italic leading-relaxed text-white">« {legend.quote} »</p>
            </blockquote>

            <h2 className="mb-4 mt-10 text-2xl font-extrabold uppercase text-white">Biographie</h2>
            <p className="leading-relaxed text-white/75">{legend.biography}</p>
          </div>

          <aside>
            <h2 className="mb-4 text-2xl font-extrabold uppercase text-white">Palmarès</h2>
            <ul className="space-y-2">
              {legend.achievements.map((achievement) => (
                <li key={achievement} className="panel flex items-center gap-3 p-4 text-sm text-white/80">
                  <Trophy size={16} className="shrink-0 text-club-yellow" />
                  {achievement}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {others.length > 0 && (
        <section className="band-green py-12">
          <div className="site-container">
            <h2 className="section-title mb-8">Autres légendes</h2>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
              {others.map((entry) => (
                <Link key={String(entry.id)} to={`/legends/${entry.id}`} className="group text-center">
                  <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border-4 border-club-yellow">
                    <img
                      src={entry.photo}
                      alt={entry.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <p className="mt-3 text-sm font-extrabold uppercase text-white transition-colors group-hover:text-club-yellow">
                    {entry.name}
                  </p>
                  <p className="text-xs text-white/60">{entry.period}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default LegendDetail;
