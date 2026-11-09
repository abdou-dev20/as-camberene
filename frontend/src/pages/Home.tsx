import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useArticles, useHeroSlides, useLegends, useMatches, useProducts } from '../hooks/useContent';
import { formatCFA } from '../lib/currency';
import { formatDayMonth } from '../lib/dates';
import { formatVideoTime, youtubeId } from '../lib/youtube';
import { handleImageError } from '../lib/imagePlaceholder';
import ArticleCard from '../components/ui/ArticleCard';
import HeroVideo from '../components/ui/HeroVideo';
import Rail from '../components/ui/Rail';
import SectionHeader from '../components/ui/SectionHeader';
import NewsTicker from '../components/ui/NewsTicker';
import TeamGallery from '../components/TeamGallery';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { kickoff } from '../lib/matches';
import { safeHref, socialLinks } from '../lib/socials';
import { settingsImage } from '../services/site/settings.service';

const Home: React.FC = () => {
  const settings = useSiteSettings();
  const show = settings.homeSections;
  const HERO_SOCIALS = socialLinks(settings);
  const partners = settings.partners.filter((partner) => partner.logo);
  const [slide, setSlide] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const [unavailable, setUnavailable] = useState<string[]>([]);

  const { data: heroSlides } = useHeroSlides();

  const slides = useMemo(
    () =>
      heroSlides.map((item) => {
        const id = item.youtube ? youtubeId(item.youtube) : null;
        return { ...item, videoId: id && !unavailable.includes(id) ? id : null };
      }),
    [heroSlides, unavailable]
  );

  const activeIndex = slides.length > 0 ? Math.min(slide, slides.length - 1) : 0;
  const active = slides[activeIndex];
  const isVideo = Boolean(active?.videoId);

  const goTo = useCallback(
    (index: number) => {
      // Sans diapositive, le modulo par zéro donnerait NaN.
      if (slides.length === 0) return;
      setSlide((index + slides.length) % slides.length);
      setProgress({ current: 0, duration: 0 });
    },
    [slides.length]
  );

  useEffect(() => {
    if (!playing || isVideo) return undefined;
    const timer = setInterval(() => goTo(activeIndex + 1), 6000);
    return () => clearInterval(timer);
  }, [playing, isVideo, activeIndex, goTo]);

  const onVideoTime = useCallback((current: number, duration: number) => {
    setProgress({ current, duration });
  }, []);

  const { data: allArticles } = useArticles({ limit: 30 });
  const articles = allArticles.slice(0, 9);
  const { data: products } = useProducts({ limit: 8 });
  const { data: legends } = useLegends({ limit: 8 });
  const { data: matches } = useMatches();

  const orderedMatches = useMemo(() => [...matches].sort((a, b) => kickoff(a) - kickoff(b)), [matches]);
  const liveMatch = orderedMatches.find((match) => match.status === 'En cours');
  const upcoming = orderedMatches.filter((match) => match.status === 'À venir').slice(0, 3);
  const recent = orderedMatches.filter((match) => match.status === 'Terminé').sort((a, b) => kickoff(b) - kickoff(a)).slice(0, 3);

  return (
    <div className="bg-graphite">
      {show.hero && (
      <section className="relative h-[95vh] min-h-[520px] overflow-hidden bg-graphite xl:h-[56.25vw] xl:max-h-none">
        {slides.map((item, index) => (
          <div
            key={item.id}
            aria-hidden={index !== activeIndex}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === activeIndex ? 'opacity-100' : 'opacity-0'
            } ${item.image || item.videoId ? '' : 'band-green'}`}
          >
            {item.videoId ? (
              index === activeIndex && (
              <HeroVideo
                videoId={item.videoId}
                active
                playing={playing}
                muted={muted}
                onTime={onVideoTime}
                onEnded={() => goTo(index + 1)}
                onUnavailable={() =>
                  setUnavailable((current) =>
                    current.includes(item.videoId!) ? current : [...current, item.videoId!]
                  )
                }
              />
              )
            ) : (
              item.image && (
                <img
                  src={item.image}
                  alt=""
                  onError={handleImageError}
                  className="h-full w-full object-cover"
                />
              )
            )}
          </div>
        ))}

        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              'linear-gradient(90deg, rgba(24,25,28,.3), rgba(24,25,28,.08) 85%, rgba(24,25,28,.5)), linear-gradient(rgba(24,25,28,0), rgba(24,25,28,.9) 99%)',
            boxShadow: 'inset 4px -57px 106px -35px #000',
          }}
        />

        <div className="absolute right-5 top-5 z-20 hidden flex-col items-center justify-center gap-[15px] md:flex lg:right-10">
          {HERO_SOCIALS.map(({ label, icon: Icon, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="text-white opacity-70 transition-opacity hover:opacity-100"
            >
              <Icon size={24} />
            </a>
          ))}
          <span className="mt-[15px] rotate-180 text-sm uppercase tracking-[2px] text-white/60 [writing-mode:vertical-rl]">
            Suivez-nous
          </span>
        </div>

        {active && (
          <div className="absolute bottom-[3.25rem] left-5 z-20 flex h-[70vh] max-w-[40rem] flex-col justify-center pr-5 lg:left-10">
            <p className="text-shadow-hero text-xl font-bold uppercase leading-tight text-club-yellow md:text-[26px] lg:text-[32px] lg:leading-10">
              {active.kicker}
            </p>
            <h1 className="text-shadow-hero line-clamp-3 text-3xl font-extrabold uppercase leading-tight text-white md:text-5xl lg:text-[60px] lg:leading-[1.15]">
              {active.title}
            </h1>
            <Link to={active.link} className="btn-yellow mt-8 w-fit">
              {active.linkLabel}
              <ChevronRight size={16} />
            </Link>
          </div>
        )}

        {isVideo && (
          <button
            type="button"
            onClick={() => setPlaying(!playing)}
            aria-label={playing ? 'Mettre la vidéo en pause' : 'Lire la vidéo'}
            className="absolute left-1/2 top-1/2 z-20 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-white opacity-80 transition-opacity hover:opacity-100"
          >
            {playing ? <Pause size={40} /> : <Play size={40} />}
          </button>
        )}

        <div className="absolute bottom-8 left-1/2 z-20 flex w-full max-w-3xl -translate-x-1/2 flex-col items-center gap-4 px-4 lg:bottom-[60px]">
          {partners.length > 0 && (
            <div className="flex w-[70%] justify-around">
              {partners.map((partner) => (
                <a
                  key={partner.name}
                  href={safeHref(partner.href) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-1.5 text-center"
                >
                  <img
                    src={settingsImage(partner.logo)}
                    alt={partner.name}
                    className="h-[30px] w-auto brightness-0 invert transition-[filter] hover:filter-none"
                  />
                </a>
              ))}
            </div>
          )}

          <div className="flex w-full items-center justify-center gap-4 text-[#eee]">
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              aria-label="Diapositive précédente"
              className="flex h-3 items-center font-bold text-white transition-opacity hover:opacity-70"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-2">
              {slides.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Diapositive ${index + 1}`}
                  aria-current={index === activeIndex}
                  className={`h-3 rounded-full border-2 border-transparent transition-all duration-700 ${
                    index === activeIndex ? 'w-[45px] bg-club-yellow opacity-70' : 'w-3 bg-white opacity-30 hover:opacity-60'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              aria-label="Diapositive suivante"
              className="flex h-3 items-center font-bold text-white transition-opacity hover:opacity-70"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {isVideo ? (
            <div className="flex items-center gap-3 text-sm leading-[1.4] text-white">
              <button
                type="button"
                onClick={() => setPlaying(!playing)}
                aria-label={playing ? 'Mettre la vidéo en pause' : 'Lire la vidéo'}
                className="flex items-center gap-2 transition-opacity hover:opacity-70"
              >
                {playing ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <a
                href={`https://www.youtube.com/watch?v=${active.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70"
              >
                Voir la vidéo complète : {formatVideoTime(progress.duration)}
              </a>
              <button
                type="button"
                onClick={() => setMuted(!muted)}
                aria-label={muted ? 'Activer le son' : 'Couper le son'}
                className="transition-opacity hover:opacity-70"
              >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(!playing)}
              aria-label={playing ? 'Mettre le carrousel en pause' : 'Relancer le carrousel'}
              className="text-white opacity-80 transition-opacity hover:opacity-100"
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
          )}
        </div>
      </section>
      )}

      {show.matchCenter && (
      <section className="band-charcoal border-y border-white/5">
        <div className="site-container py-12">
          <SectionHeader title="Centre de match" linkLabel="Calendrier" linkTo="/calendrier" className="mb-8" />

          {liveMatch && (
            <div className="mb-6 overflow-hidden rounded-[24px] border border-club-green/70 bg-gradient-to-br from-club-green/30 via-graphite to-graphite shadow-[0_0_60px_-30px_rgba(34,197,94,0.5)]">
              <div className="flex flex-col items-center gap-4 px-6 py-6 text-center md:flex-row md:justify-between md:text-left">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-2 rounded-full bg-club-green px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.3em] text-black">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-black" /> Match en cours
                  </span>
                  <span className="text-xs uppercase tracking-wide text-white/60">
                    {liveMatch.competition} · {liveMatch.venue}
                  </span>
                </div>
                <Link to={`/calendrier/${liveMatch.id}`} className="btn-yellow px-5 py-2 text-xs">
                  Voir le match
                </Link>
              </div>
              <div className="flex flex-col items-center justify-center gap-6 px-6 pb-8 md:flex-row md:items-center">
                <div className="flex flex-1 items-center justify-center md:justify-end">
                  <p className="text-lg font-extrabold uppercase text-white sm:text-2xl md:text-3xl">
                    {liveMatch.venue === 'Domicile' ? 'ASC Cambérène' : liveMatch.opponent}
                  </p>
                </div>
                <div className="flex items-center gap-6 text-white">
                  <span className="text-5xl font-extrabold md:text-7xl">
                    {liveMatch.venue === 'Domicile' ? liveMatch.result?.home ?? 0 : liveMatch.result?.away ?? 0}
                  </span>
                  <span className="text-3xl font-extrabold text-white/40">-</span>
                  <span className="text-5xl font-extrabold md:text-7xl">
                    {liveMatch.venue === 'Domicile' ? liveMatch.result?.away ?? 0 : liveMatch.result?.home ?? 0}
                  </span>
                </div>
                <div className="flex flex-1 items-center justify-center md:justify-start">
                  <p className="text-lg font-extrabold uppercase text-white sm:text-2xl md:text-3xl">
                    {liveMatch.venue === 'Domicile' ? liveMatch.opponent : 'ASC Cambérène'}
                  </p>
                </div>
              </div>
              {(() => {
                const clubScorersLive = (liveMatch.scorers ?? []).filter((scorer) => scorer.side === 'club');
                return clubScorersLive.length > 0 ? (
                  <div className="border-t border-white/10 px-6 py-4 text-center text-sm text-club-yellow">
                    {clubScorersLive
                      .map((scorer) => (scorer.minute ? `${scorer.name} ${scorer.minute}’` : scorer.name))
                      .join(' · ')}
                  </div>
                ) : null;
              })()}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="min-w-0">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-club-yellow">
                Prochaines rencontres
              </p>
              <div className="space-y-3">
                {upcoming.map((match) => (
                  <article key={String(match.id)} className="panel panel-hover flex items-center gap-4 p-4">
                    <div className="w-16 shrink-0 text-center">
                      <p className="text-xs uppercase text-white/50">{formatDayMonth(match.date)}</p>
                      <p className="text-lg font-extrabold text-club-yellow">{match.time}</p>
                    </div>
                    {match.image && (
                      <img
                        src={match.image}
                        alt=""
                        onError={handleImageError}
                        className="hidden h-14 w-14 shrink-0 rounded-lg border border-white/10 object-cover sm:block"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-extrabold uppercase text-white">
                        {match.venue === 'Domicile'
                          ? `ASC Cambérène — ${match.opponent}`
                          : `${match.opponent} — ASC Cambérène`}
                      </h3>
                      <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} />
                          {match.competition}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={13} />
                          {match.venue}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={13} />
                          {match.time}
                        </span>
                      </p>
                    </div>
                    <Link
                      to={`/billetterie?match=${match.id}`}
                      className="btn-yellow shrink-0 px-4 py-2 text-xs"
                    >
                      Billets
                    </Link>
                  </article>
                ))}
                {upcoming.length === 0 && (
                  <p className="panel p-6 text-sm text-white/60">Aucune rencontre programmée pour le moment.</p>
                )}
              </div>
            </div>

            <div className="min-w-0">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-club-yellow">
                Derniers résultats
              </p>
              <div className="space-y-3">
                {recent.map((match) => {
                  const scored = match.venue === 'Domicile' ? match.result?.home : match.result?.away;
                  const conceded = match.venue === 'Domicile' ? match.result?.away : match.result?.home;
                  const outcome =
                    scored === undefined || conceded === undefined
                      ? null
                      : scored > conceded
                        ? { label: 'Victoire', className: 'bg-club-green text-white' }
                        : scored === conceded
                          ? { label: 'Nul', className: 'bg-white/15 text-white' }
                          : { label: 'Défaite', className: 'bg-red-500/20 text-red-300' };
                  const clubScorers = (match.scorers ?? []).filter(
                    (scorer) => scorer.side === 'club'
                  );

                  return (
                    <article key={String(match.id)} className="panel panel-hover flex items-center gap-4 p-4">
                      <div className="w-16 shrink-0 text-center text-2xl font-extrabold text-white">
                        {scored ?? '-'}<span className="text-white/40">:</span>{conceded ?? '-'}
                      </div>
                      {match.image && (
                        <img
                          src={match.image}
                          alt=""
                          onError={handleImageError}
                          className="hidden h-14 w-14 shrink-0 rounded-lg border border-white/10 object-cover sm:block"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-extrabold uppercase text-white">
                          {match.venue === 'Domicile'
                            ? `ASC Cambérène — ${match.opponent}`
                            : `${match.opponent} — ASC Cambérène`}
                        </h3>
                        <p className="mt-1 text-xs text-white/60">
                          {match.competition} · {formatDayMonth(match.date)}
                        </p>
                        {clubScorers.length > 0 && (
                          <p className="mt-1 truncate text-xs text-club-yellow/80">
                            {clubScorers
                              .map((scorer) =>
                                scorer.minute ? `${scorer.name} ${scorer.minute}’` : scorer.name
                              )
                              .join(' · ')}
                          </p>
                        )}
                      </div>
                      {outcome && <span className={`chip shrink-0 ${outcome.className}`}>{outcome.label}</span>}
                    </article>
                  );
                })}
                {recent.length === 0 && (
                  <p className="panel p-6 text-sm text-white/60">Aucun résultat enregistré pour le moment.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {show.news && (
      <section className="band-green py-8">
        <div className="site-container">
          <SectionHeader title="Actualités" linkLabel="Toutes les actualités" linkTo="/news" className="mb-6" />
        </div>
        <NewsTicker className="mb-6" />
        <div className="site-container">
          <Rail>
            {articles.map((article, index) => (
              <ArticleCard
                key={String(article.id)}
                to={`/news/${article.id}`}
                image={article.image}
                imagePosition={article.imagePosition}
                kicker={article.category}
                title={article.title}
                date={article.publishedAt}
                wide={(index + 1) % 3 === 0}
              />
            ))}
          </Rail>
        </div>
      </section>
      )}

      {show.facts && (
      <section className="band-graphite">
        <div className="site-container grid grid-cols-2 gap-6 py-12 md:grid-cols-4">
          {settings.facts.map((fact) => (
            <div key={fact.label} className="text-center">
              <p className="text-4xl font-extrabold text-club-yellow md:text-5xl">{fact.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/50">{fact.label}</p>
            </div>
          ))}
        </div>
      </section>
      )}

      {show.shop && (
      <section className="band-charcoal py-8">
        <div className="site-container">
          <SectionHeader title="Boutique officielle" linkLabel="Toute la collection" linkTo="/shop" className="mb-8" />
          <Rail>
            {products.map((product, index) => (
              <ArticleCard
                key={String(product.id)}
                to={`/shop/${product.id}`}
                image={product.image}
                kicker={product.type}
                title={product.name}
                note={formatCFA(product.price)}
                wide={(index + 1) % 3 === 0}
              />
            ))}
          </Rail>
        </div>
      </section>
      )}

      {show.banner && (
      <section className="relative overflow-hidden">
        <img
          src={settingsImage(settings.banner.image)}
          alt="Effectif de l'ASC Cambérène"
          onError={handleImageError}
          className="h-[420px] w-full object-cover md:h-[520px]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(24,25,28,.9), rgba(24,25,28,.3) 75%), linear-gradient(rgba(24,25,28,0), rgba(24,25,28,.9) 99%)',
          }}
        />
        <div className="site-container absolute inset-0 flex flex-col justify-center">
          <div className="max-w-xl">
            <p className="text-shadow-hero text-lg font-bold uppercase text-club-yellow md:text-2xl">
              {settings.banner.kicker}
            </p>
            <h2 className="text-shadow-hero mt-2 text-3xl font-extrabold uppercase text-white md:text-5xl">
              {settings.banner.title}
            </h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/players" className="btn-yellow">Voir l'effectif</Link>
              <Link to="/teams" className="btn-ghost">Toutes les équipes</Link>
            </div>
          </div>
        </div>
      </section>
      )}

      {show.legends && (
      <section className="band-green py-8">
        <div className="site-container">
          <SectionHeader title="Légendes du club" linkLabel="Hall of Fame" linkTo="/legends" className="mb-8" />
          <Rail>
            {legends.map((legend, index) => (
              <ArticleCard
                key={String(legend.id)}
                to={`/legends/${legend.id}`}
                image={legend.photo}
                kicker={legend.position}
                title={legend.name}
                note={legend.period}
                wide={(index + 1) % 3 === 0}
              />
            ))}
          </Rail>
        </div>
      </section>
      )}

      {show.gallery && (
      <TeamGallery />
      )}
    </div>
  );
};

export default Home;
