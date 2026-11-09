import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check, Crown, Loader2, Vote } from 'lucide-react';
import useApiResource from '../hooks/useApiResource';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../lib/api';
import { IMAGE_PLACEHOLDER, handleImageError } from '../lib/imagePlaceholder';
import { getCurrentPotm, monthName, PotmCurrent, votePotm } from '../services/site/playerOfMonth.service';

const PlayerOfMonthVote: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { data: poll, loading, reload } = useApiResource<PotmCurrent | null>(
    (signal) => getCurrentPotm(signal),
    null,
    { deps: [user?.id] }
  );

  const [selected, setSelected] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  if (loading && !poll) {
    return <p className="panel p-12 text-center text-white/60">Chargement du vote…</p>;
  }

  if (!poll) {
    return (
      <p className="panel p-12 text-center text-white/60">
        Aucun vote en cours. Le prochain joueur du mois sera bientôt soumis à vos suffrages.
      </p>
    );
  }

  const open = poll.status === 'open';
  const voted = poll.myVote;
  const winner = poll.nominees.find((nominee) => nominee.id === poll.winner);
  const reveal = poll.resultsRevealed;

  const submit = async () => {
    if (!selected) return;
    setSending(true);
    setError('');
    try {
      await votePotm(poll.id, selected);
      reload();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.fullMessage : 'Vote non enregistré.');
      reload();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-club-yellow">{monthName(poll.month)}</p>
        <h2 className="mt-2 text-3xl font-extrabold uppercase text-white md:text-4xl">
          {poll.title || 'Élisez le joueur du mois'}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/60">
          {!open
            ? 'Le vote est clos. Voici le résultat officiel, basé sur les votes des supporters.'
            : voted
              ? 'Merci, votre vote est enregistré. Voici le score actuel du vote.'
              : user
                ? 'Choisissez votre joueur puis validez. Un seul vote par supporter. Le score s’affiche après votre vote.'
                : 'Connectez-vous pour voter. Un seul vote par supporter.'}
        </p>      </div>

      {!open && winner && (
        <div className="mx-auto flex max-w-md items-center gap-5 rounded-[20px] border border-club-yellow/60 bg-club-yellow/10 p-5">
          <img src={winner.photo || IMAGE_PLACEHOLDER} onError={handleImageError} alt="" className="h-20 w-20 rounded-full border-2 border-club-yellow object-cover object-top" />
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-club-yellow">
              <Crown size={14} /> Joueur du mois
            </p>
            <p className="text-2xl font-extrabold uppercase text-white">{winner.name}</p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl space-y-3">
        {poll.nominees.map((nominee, index) => {
          const isMine = voted === nominee.id;
          const isPicked = selected === nominee.id;
          const canPick = open && !voted && Boolean(user);
          const leading = reveal && nominee.votes > 0 && index === 0;
          return (
            <button
              key={nominee.id}
              type="button"
              disabled={!canPick}
              onClick={() => setSelected(nominee.id)}
              aria-pressed={isPicked}
              className={`group relative flex items-center gap-4 overflow-hidden rounded-[20px] border-2 bg-black/30 p-3 pl-4 text-left transition ${
                isMine || isPicked ? 'border-club-yellow' : 'border-white/10'
              } ${canPick ? 'cursor-pointer hover:border-club-yellow/60' : 'cursor-default'}`}
            >
              <span className="flex w-6 shrink-0 items-center justify-center text-sm font-extrabold text-white/40">
                {reveal ? (leading ? <Crown size={16} className="text-club-yellow" /> : index + 1) : ''}
              </span>

              <img
                src={nominee.photo || IMAGE_PLACEHOLDER}
                onError={handleImageError}
                alt=""
                className="h-16 w-16 shrink-0 rounded-xl object-cover object-top"
              />

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase text-club-yellow">
                  {nominee.number > 0 ? `N°${nominee.number} · ` : ''}
                  {nominee.position || nominee.line}
                </p>
                <p className="truncate text-lg font-extrabold uppercase text-white">{nominee.name}</p>
                {isMine && <p className="text-xs text-club-yellow">Votre vote</p>}
                {reveal && (
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${leading ? 'bg-club-yellow' : 'bg-white/40'}`}
                      style={{ width: `${nominee.percent}%` }}
                    />
                  </div>
                )}
              </div>

              {(isMine || isPicked) && (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-club-yellow text-black">
                  <Check size={18} />
                </span>
              )}

              {reveal && (
                <div className="flex shrink-0 flex-col items-end">
                  <span className="text-2xl font-extrabold text-club-yellow">{nominee.percent}%</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {error && <p className="text-center text-sm text-red-300">{error}</p>}

      {open && !voted && (
        <div className="flex justify-center">
          {user ? (
            <button type="button" onClick={() => void submit()} disabled={!selected || sending} className="btn-yellow disabled:opacity-50">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Vote size={16} />}
              {selected ? 'Valider mon vote' : 'Choisissez un joueur'}
            </button>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/login" state={{ from: `${location.pathname}${location.search}` }} className="btn-yellow">
                Se connecter pour voter
              </Link>
              <Link to="/inscription" state={{ from: `${location.pathname}${location.search}` }} className="btn-ghost">
                Créer un compte
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerOfMonthVote;
