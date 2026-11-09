import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Ticket, Trophy } from 'lucide-react';
import { useMatch, useMatchGallery } from '../hooks/useContent';
import { isOver } from '../lib/matches';
import { handleImageError } from '../lib/imagePlaceholder';
import { formatLongDate } from '../lib/dates';
import { siteMediaUrl } from '../services/site/media';
import { Match, MatchScorer } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const CLUB = 'ASC Cambérène';
const CLUB_LOGO = '/assets/img/asc-camberene-logo-officiel.png';

const scoreOf = (match: Match) => {
  if (!match.result) return null;
  const home = match.venue === 'Domicile';
  const scored = home ? match.result.home : match.result.away;
  const conceded = home ? match.result.away : match.result.home;
  const outcome =
    scored > conceded
      ? { label: 'Victoire', className: 'bg-club-green text-white' }
      : scored < conceded
        ? { label: 'Défaite', className: 'bg-red-600 text-white' }
        : { label: 'Match nul', className: 'bg-white/20 text-white' };
  return { scored, conceded, outcome };
};

const byMinute = (a: MatchScorer, b: MatchScorer) => (a.minute || Infinity) - (b.minute || Infinity);

const statsOf = (match: Match, scored: number, conceded: number) => {
  const goals = match.scorers ?? [];
  const club = goals.filter((goal) => goal.side === 'club');
  const tally = new Map<string, number>();
  club.forEach((goal) => tally.set(goal.name, (tally.get(goal.name) ?? 0) + 1));
  const best = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
  const timed = goals.filter((goal) => goal.minute > 0);
  return [
    { label: 'Buts marqués', value: scored },
    { label: 'Buts encaissés', value: conceded },
    { label: 'Buteurs différents', value: tally.size },
    { label: 'Passes décisives', value: club.filter((goal) => goal.assistName).length },
    { label: 'Buts en 1re période', value: timed.length ? timed.filter((goal) => goal.minute <= 45).length : '—' },
    { label: 'Buts en 2e période', value: timed.length ? timed.filter((goal) => goal.minute > 45).length : '—' },
    ...(best && best[1] >= 2 ? [{ label: best[1] >= 3 ? 'Triplé' : 'Doublé', value: best[0] }] : []),
  ];
};

const countdown = (match: Match): string | null => {
  const ms = new Date(`${match.date}T${match.time || '00:00'}:00`).getTime() - Date.now();
  if (ms <= 0) return null;
  const hours = Math.round(ms / 3_600_000);
  if (hours < 24) return `Coup d'envoi dans ${hours} h`;
  const days = Math.round(hours / 24);
  return `Coup d'envoi dans ${days} jour${days > 1 ? 's' : ''}`;
};

const TeamBadge: React.FC<{ team: { name: string; logo: string | null } }> = ({ team }) => (
  <div className="flex min-w-0 flex-1 flex-col items-center gap-3 text-center">
    {team.logo ? (
      <img src={team.logo} alt="" className="h-20 w-20 object-contain md:h-24 md:w-24" />
    ) : (
      <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 text-3xl font-extrabold uppercase text-white md:h-24 md:w-24">
        {team.name.trim().charAt(0)}
      </span>
    )}
    <p className="text-base font-extrabold uppercase leading-tight text-white md:text-2xl">{team.name}</p>
  </div>
);

const MatchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { match, loading } = useMatch(id);
  const { data: photos } = useMatchGallery(id);
  const [zoomed, setZoomed] = useState<string | null>(null);

  useEffect(() => {
    if (!zoomed) return undefined;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setZoomed(null);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [zoomed]);

  const goals = useMemo(() => [...(match?.scorers ?? [])].sort(byMinute), [match]);

  if (loading && !match) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-graphite">
        <LoadingSpinner />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-graphite px-4">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-extrabold uppercase text-white">Match introuvable</h1>
          <Link to="/calendrier" className="btn-yellow">Retour au calendrier</Link>
        </div>
      </div>
    );
  }

  const home = match.venue === 'Domicile';
  const over = isOver(match);
  const live = match.status === 'En cours';
  const score = scoreOf(match);
  const left = home ? { name: CLUB, logo: CLUB_LOGO } : { name: match.opponent, logo: null };
  const right = home ? { name: match.opponent, logo: null } : { name: CLUB, logo: CLUB_LOGO };
  const remaining = !over && !live ? countdown(match) : null;

  return (
    <div className="bg-graphite">
      <section className="band-green pb-12 pt-32">
        <div className="site-container max-w-4xl">
          <Link to="/calendrier" className="mb-8 inline-flex items-center gap-2 text-sm font-bold uppercase text-white/70 transition-colors hover:text-club-yellow">
            <ArrowLeft size={16} /> Calendrier
          </Link>

          <div className="mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/70">
            <span className="flex items-center gap-1.5 font-bold uppercase text-club-yellow"><Trophy size={15} /> {match.competition}</span>
            <span className="flex items-center gap-1.5 capitalize"><Calendar size={15} /> {formatLongDate(match.date)}</span>
            <span className="flex items-center gap-1.5"><Clock size={15} /> {match.time}</span>
            <span className="flex items-center gap-1.5"><MapPin size={15} /> {match.venue}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <TeamBadge team={left} />
            <div className="shrink-0 text-center">
              {match.result ? (
                <p className="text-5xl font-extrabold tabular-nums text-white md:text-7xl">
                  {match.result.home}
                  <span className="mx-2 text-white/40">-</span>
                  {match.result.away}
                </p>
              ) : (
                <p className="text-4xl font-extrabold text-club-yellow md:text-6xl">{match.time}</p>
              )}
              <div className="mt-3 flex justify-center">
                {live ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-extrabold uppercase text-white">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> En direct
                  </span>
                ) : over && score ? (
                  <span className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${score.outcome.className}`}>{score.outcome.label}</span>
                ) : over ? (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold uppercase text-white">Terminé</span>
                ) : (
                  <span className="rounded-full bg-green-400 px-3 py-1 text-xs font-extrabold uppercase text-black">À venir</span>
                )}
              </div>
            </div>
            <TeamBadge team={right} />
          </div>

          {remaining && <p className="mt-6 text-center text-sm font-bold uppercase tracking-wide text-white/80">{remaining}</p>}
          {!over && home && (
            <div className="mt-6 flex justify-center">
              <Link to="/billetterie" className="btn-yellow"><Ticket size={16} /> Réserver des billets</Link>
            </div>
          )}
        </div>
      </section>

      <section className="band-charcoal py-12">
        <div className="site-container grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <h2 className="section-title mb-6">Feuille de match</h2>
            {goals.length > 0 ? (
              <ol className="panel divide-y divide-white/5">
                {goals.map((goal, index) => {
                  const ours = goal.side === 'club';
                  const onLeft = ours === home;
                  return (
                    <li key={`${goal.name}-${goal.minute}-${index}`} className={`flex items-center gap-4 p-4 ${onLeft ? '' : 'flex-row-reverse text-right'}`}>
                      <span className={`flex h-10 w-12 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold ${ours ? 'bg-club-yellow text-black' : 'bg-white/10 text-white'}`}>
                        {goal.minute ? `${goal.minute}’` : '—'}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-extrabold uppercase text-white">{goal.name}</p>
                        <p className="text-xs text-white/50">
                          {ours ? CLUB : match.opponent}
                          {ours && goal.assistName ? ` · passe décisive de ${goal.assistName}` : ''}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="panel p-8 text-center text-sm text-white/60">
                {over ? 'Les buteurs de cette rencontre n’ont pas été renseignés.' : 'La feuille de match sera publiée après la rencontre.'}
              </p>
            )}
          </div>

          <aside>
            <h2 className="section-title mb-6">Statistiques</h2>
            {score ? (
              <dl className="panel divide-y divide-white/5">
                {statsOf(match, score.scored, score.conceded).map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between gap-4 px-5 py-3.5">
                    <dt className="text-sm text-white/60">{stat.label}</dt>
                    <dd className="truncate text-right text-lg font-extrabold text-club-yellow">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="panel p-8 text-center text-sm text-white/60">Disponibles après le match.</p>
            )}
          </aside>
        </div>
      </section>

      {(match.image || photos.length > 0) && (
        <section className="band-graphite py-12">
          <div className="site-container max-w-5xl">
            <h2 className="section-title mb-6">Photos du match</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {[...(match.image ? [{ id: 'affiche', image: match.image, title: 'Affiche' }] : []), ...photos.map((photo) => ({ id: String(photo.id), image: siteMediaUrl(photo.image), title: photo.title }))].map((photo) => (
                <button key={photo.id} type="button" onClick={() => setZoomed(photo.image)} className="group overflow-hidden rounded-2xl bg-black/40" aria-label={`Agrandir ${photo.title || 'la photo'}`}>
                  <img src={photo.image} onError={handleImageError} alt={photo.title} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {zoomed && (
        <div role="dialog" aria-modal="true" onClick={() => setZoomed(null)} className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/95 p-4">
          <img src={zoomed} alt="" className="max-h-full max-w-full object-contain" />
          <button type="button" className="absolute right-5 top-5 text-3xl leading-none text-white/80 hover:text-white" aria-label="Fermer">×</button>
        </div>
      )}
    </div>
  );
};

export default MatchDetail;
