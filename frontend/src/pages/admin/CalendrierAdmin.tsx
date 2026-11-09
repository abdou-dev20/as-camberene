import React, { useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, Check, Plus, Search, Trash2, X } from 'lucide-react';
import useEditableResource from '../../hooks/useEditableResource';
import { useTeamMembers } from '../../hooks/useContent';
import { matches as matchesApi, MatchRecord } from '../../services/site/content.service';
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminFeedback';
import ImageField from '../../components/admin/ImageField';
import {
  MATCH_STATUSES,
  MATCH_VENUES,
  MatchScorer,
  MatchStatus,
  MatchVenue,
  ScorerSide,
} from '../../types';
import { handleImageError } from '../../lib/imagePlaceholder';
import { formatDayMonthYear } from '../../lib/dates';
import AdminConfirmDelete from '../../components/admin/AdminConfirmDelete';

const today = (): string => new Date().toISOString().slice(0, 10);

interface ScorerDraft {
  uid: string;
  name: string;
  minute: string;
  side: ScorerSide;
  assist: string;
}

let scorerUid = 0;

const StatLink: React.FC<{ name: string; linked: boolean; long?: boolean }> = ({ name, linked, long }) => {
  if (!name.trim()) return <span />;
  return linked ? (
    <span className="flex items-center gap-1 text-[10px] text-green-300/80">
      <Check size={11} aria-hidden="true" />
      {long ? 'Compté dans les statistiques du joueur' : 'Compté'}
    </span>
  ) : (
    <span
      className="flex items-center gap-1 text-[10px] text-club-yellow/80"
      title="Choisissez un nom dans la liste de l'effectif pour qu'il soit compté."
    >
      <AlertTriangle size={11} aria-hidden="true" />
      {long ? 'Pas dans l’effectif : non compté dans les statistiques' : 'Hors effectif'}
    </span>
  );
};

const newScorer = (): ScorerDraft => ({
  uid: `scorer-${(scorerUid += 1)}`,
  name: '',
  minute: '',
  side: 'club',
  assist: '',
});

const EMPTY_FORM = {
  opponent: '',
  date: today(),
  time: '16:00',
  venue: 'Domicile' as MatchVenue,
  competition: 'Ligue 1 Sénégal',
  status: 'À venir' as MatchStatus,
  image: '',
  scoreHome: '',
  scoreAway: '',
  scorers: [] as ScorerDraft[],
  liveTime: '',
};

const STATUS_STYLES: Record<MatchStatus, string> = {
  'À venir': 'bg-club-yellow/20 text-club-yellow',
  'En cours': 'bg-green-500/20 text-green-300',
  Terminé: 'bg-white/10 text-white/60',
};

const CalendrierAdmin: React.FC = () => {
  const {
    items: matches,
    loading,
    error,
    actionError,
    saving,
    reload,
    create,
    update,
    remove,
  } = useEditableResource<MatchRecord>(matchesApi, { sort: 'date time' });

  const { data: roster } = useTeamMembers('equipe-a');

  const playerNames = useMemo(
    () =>
      roster
        .filter((member) => member.kind === 'player')
        .map((member) => member.name)
        .sort((a, b) => a.localeCompare(b, 'fr')),
    [roster]
  );

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return matches.filter((match) => {
      const matchesQuery =
        !needle ||
        match.opponent.toLowerCase().includes(needle) ||
        (match.competition ?? '').toLowerCase().includes(needle) ||
        match.date.includes(needle);
      return matchesQuery && (!statusFilter || match.status === statusFilter);
    });
  }, [matches, query, statusFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, date: today(), scorers: [] });
    setModalOpen(true);
  };

  const openEdit = (match: MatchRecord) => {
    setEditingId(match.id);
    setForm({
      opponent: match.opponent,
      date: match.date,
      time: match.time || '16:00',
      venue: match.venue,
      competition: match.competition ?? '',
      status: match.status,
      image: match.image ?? '',
      scoreHome: match.result ? String(match.result.home) : '',
      scoreAway: match.result ? String(match.result.away) : '',
      scorers: (match.scorers ?? []).map((scorer) => ({
        uid: `scorer-${(scorerUid += 1)}`,
        name: scorer.name,
        minute: scorer.minute ? String(scorer.minute) : '',
        side: scorer.side,
        assist: scorer.assistName ?? '',
      })),
      liveTime: match.liveTime ?? '',
    });
    setModalOpen(true);
  };

  const addScorer = () =>
    setForm((f) => ({ ...f, scorers: [...f.scorers, newScorer()] }));

  const updateScorer = (uid: string, patch: Partial<ScorerDraft>) =>
    setForm((f) => ({
      ...f,
      scorers: f.scorers.map((scorer) => (scorer.uid === uid ? { ...scorer, ...patch } : scorer)),
    }));

  const removeScorer = (uid: string) =>
    setForm((f) => ({ ...f, scorers: f.scorers.filter((scorer) => scorer.uid !== uid) }));

  const findPlayerId = (name: string): string | null => {
    const needle = name.trim().toLowerCase();
    return roster.find((member) => member.name.trim().toLowerCase() === needle)?.id ?? null;
  };

  const scoreCheck = useMemo(() => {
    if ((form.status !== 'Terminé' && form.status !== 'En cours') || form.scoreHome === '' || form.scoreAway === '') return null;

    const home = Number(form.scoreHome);
    const away = Number(form.scoreAway);
    const named = form.scorers.filter((scorer) => scorer.name.trim() !== '');

    const expected = { club: form.venue === 'Domicile' ? home : away, opponent: form.venue === 'Domicile' ? away : home };
    const saisis = {
      club: named.filter((scorer) => scorer.side === 'club').length,
      opponent: named.filter((scorer) => scorer.side === 'opponent').length,
    };

    return {
      ...saisis,
      expected,
      complete: saisis.club === expected.club && saisis.opponent === expected.opponent,
    };
  }, [form.status, form.scoreHome, form.scoreAway, form.venue, form.scorers]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const hasScore =
      (form.status === 'Terminé' || form.status === 'En cours') &&
      form.scoreHome !== '' &&
      form.scoreAway !== '';

    const scorers: MatchScorer[] =
      form.status === 'Terminé' || form.status === 'En cours'
        ? form.scorers
            .filter((scorer) => scorer.name.trim() !== '')
            .map((scorer) => ({
              name: scorer.name.trim(),
              minute: Number(scorer.minute) || 0,
              side: scorer.side,
              player: scorer.side === 'club' ? findPlayerId(scorer.name) : null,
              assistName: scorer.side === 'club' ? scorer.assist.trim() : '',
              assistPlayer: scorer.side === 'club' && scorer.assist.trim() ? findPlayerId(scorer.assist) : null,
            }))
            .sort((a, b) => (a.minute || Infinity) - (b.minute || Infinity))
        : [];

    const payload = {
      opponent: form.opponent,
      date: form.date,
      time: form.time,
      venue: form.venue,
      competition: form.competition,
      status: form.status,
      image: form.image,
      result: hasScore
        ? { home: Number(form.scoreHome), away: Number(form.scoreAway) }
        : null,
      scorers,
    };

    const saved = editingId ? await update(editingId, payload) : await create(payload);
    if (saved) setModalOpen(false);
  };

  const confirmRemoval = async () => {
    if (!confirmDelete) return;
    if (await remove(confirmDelete)) setConfirmDelete(null);
  };

  const field =
    'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-club-yellow outline-none';

  const rowField =
    'w-full min-w-0 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:border-club-yellow outline-none';

  return (
    <div>
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-white">
            <CalendarDays size={20} className="text-club-yellow" />
            Calendrier
          </h2>
          <p className="text-sm text-white/60">Matchs et résultats ({filtered.length})</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <label htmlFor="match-search" className="sr-only">Rechercher un match</label>
            <input
              id="match-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Adversaire, compétition…"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-xs text-white placeholder-white/40 outline-none focus:border-club-yellow"
            />
          </div>
          <label htmlFor="match-status" className="sr-only">Filtrer par état</label>
          <select
            id="match-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-club-yellow"
          >
            <option value="">Tous les matchs</option>
            {MATCH_STATUSES.map((status) => (
              <option key={status} value={status} className="bg-graphite">{status}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center justify-center gap-2 rounded-full bg-club-yellow px-5 py-2.5 text-xs font-semibold text-black shadow hover:shadow-lg"
          >
            <Plus size={14} /> Nouveau match
          </button>
        </div>
      </div>

      <AdminError error={error ?? actionError} onRetry={reload} />

      {loading ? (
        <AdminLoading label="Chargement du calendrier…" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-white/60">
              <tr>
                <th className="px-4 py-3 text-left">Affiche</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Adversaire</th>
                <th className="px-4 py-3 text-left">Lieu</th>
                <th className="px-4 py-3 text-left">Compétition</th>
                <th className="px-4 py-3 text-left">Score</th>
                <th className="px-4 py-3 text-left">État</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/70">
              {filtered.map((match) => (
                <tr key={match.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    {match.image ? (
                      <img
                        src={match.image}
                        alt=""
                        onError={handleImageError}
                        className="h-10 w-16 rounded-lg border border-white/10 object-cover"
                      />
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <p className="font-medium text-white">{formatDayMonthYear(match.date)}</p>
                    <p className="text-[11px] text-white/40">{match.time}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{match.opponent}</td>
                  <td className="px-4 py-3 text-xs">{match.venue}</td>
                  <td className="px-4 py-3 text-xs text-white/50">{match.competition}</td>
                  <td className="px-4 py-3">
                    {match.result ? (
                      <span className="font-mono font-semibold text-club-yellow">
                        {match.result.home} – {match.result.away}
                      </span>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                    {(match.scorers ?? []).some((scorer) => scorer.side === 'club') && (
                      <p className="mt-1 max-w-[12rem] truncate text-[11px] text-white/40">
                        {(match.scorers ?? [])
                          .filter((scorer) => scorer.side === 'club')
                          .map((scorer) => (scorer.minute ? `${scorer.name} ${scorer.minute}’` : scorer.name))
                          .join(' · ')}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold ${STATUS_STYLES[match.status]}`}
                    >
                      {match.status}
                    </span>
                  </td>
                  <td className="space-x-2 whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(match)}
                      className="rounded-full bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                    >
                      Éditer
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(match.id)}
                      className="rounded-full bg-red-500/30 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/40"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-0">
                    <AdminEmpty
                      label={
                        matches.length === 0
                          ? 'Aucun match enregistré pour le moment.'
                          : 'Aucun match ne correspond à la recherche'
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-graphite/90 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.05] p-6">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              aria-label="Fermer"
              className="absolute right-3 top-3 text-white/60 hover:text-white"
            >
              <X size={16} />
            </button>
            <h3 className="mb-4 text-lg font-semibold text-white">
              {editingId ? 'Modifier le match' : 'Nouveau match'}
            </h3>

            <form onSubmit={submit} className="space-y-4 text-xs">
              <div>
                <label htmlFor="match-opponent" className="mb-1 block text-white/60">Adversaire</label>
                <input
                  id="match-opponent"
                  required
                  value={form.opponent}
                  onChange={(event) => setForm((f) => ({ ...f, opponent: event.target.value }))}
                  placeholder="ASC Jaraaf"
                  className={field}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="match-date" className="mb-1 block text-white/60">Date</label>
                  <input
                    id="match-date"
                    type="date"
                    required
                    value={form.date}
                    onChange={(event) => setForm((f) => ({ ...f, date: event.target.value }))}
                    className={field}
                  />
                </div>
                <div>
                  <label htmlFor="match-time" className="mb-1 block text-white/60">Coup d’envoi</label>
                  <input
                    id="match-time"
                    type="time"
                    required
                    value={form.time}
                    onChange={(event) => setForm((f) => ({ ...f, time: event.target.value }))}
                    className={field}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="match-venue" className="mb-1 block text-white/60">Lieu</label>
                  <select
                    id="match-venue"
                    value={form.venue}
                    onChange={(event) =>
                      setForm((f) => ({ ...f, venue: event.target.value as MatchVenue }))
                    }
                    className={field}
                  >
                    {MATCH_VENUES.map((venue) => (
                      <option key={venue} value={venue} className="bg-graphite">{venue}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="match-status-input" className="mb-1 block text-white/60">État</label>
                  <select
                    id="match-status-input"
                    value={form.status}
                    onChange={(event) =>
                      setForm((f) => ({ ...f, status: event.target.value as MatchStatus }))
                    }
                    className={field}
                  >
                    {MATCH_STATUSES.map((status) => (
                      <option key={status} value={status} className="bg-graphite">{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="match-competition" className="mb-1 block text-white/60">Compétition</label>
                <input
                  id="match-competition"
                  value={form.competition}
                  onChange={(event) => setForm((f) => ({ ...f, competition: event.target.value }))}
                  placeholder="Ligue 1 Sénégal"
                  className={field}
                />
              </div>

              <ImageField
                value={form.image}
                onChange={(value) => setForm((f) => ({ ...f, image: value }))}
                label="Affiche du match"
              />

              {(form.status === 'Terminé' || form.status === 'En cours') && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="mb-3 text-white/60">
                    Score —{' '}
                    <span className="text-white/40">
                      {form.venue === 'Domicile'
                        ? 'Cambérène reçoit : ses buts sont ceux de l’équipe à domicile'
                        : 'Cambérène se déplace : ses buts sont ceux de l’équipe visiteuse'}
                    </span>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="match-score-home" className="mb-1 block text-white/60">
                        Domicile
                      </label>
                      <input
                        id="match-score-home"
                        type="number"
                        min={0}
                        max={99}
                        value={form.scoreHome}
                        onChange={(event) => setForm((f) => ({ ...f, scoreHome: event.target.value }))}
                        className={field}
                      />
                    </div>
                    <div>
                      <label htmlFor="match-score-away" className="mb-1 block text-white/60">
                        Extérieur
                      </label>
                      <input
                        id="match-score-away"
                        type="number"
                        min={0}
                        max={99}
                        value={form.scoreAway}
                        onChange={(event) => setForm((f) => ({ ...f, scoreAway: event.target.value }))}
                        className={field}
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-white/40">
                    Mettre à jour en temps réel pour un match « En cours ».
                  </p>
                </div>
              )}

              {(form.status === 'Terminé' || form.status === 'En cours') && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-white/60">Buteurs et passeurs</p>
                    <button
                      type="button"
                      onClick={addScorer}
                      className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[11px] text-white hover:bg-white/20"
                    >
                      <Plus size={12} /> Ajouter un buteur
                    </button>
                  </div>

                  {form.scorers.length === 0 ? (
                    <p className="text-[11px] text-white/40">
                      Aucun buteur saisi — le score reste affiché seul.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {form.scorers.map((scorer) => (
                        <div key={scorer.uid} className="space-y-1.5 rounded-lg bg-white/[0.02] p-2">
                        <div className="grid grid-cols-[3.25rem_minmax(0,1fr)_6.5rem_1.5rem] items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={130}
                            value={scorer.minute}
                            onChange={(event) =>
                              updateScorer(scorer.uid, { minute: event.target.value })
                            }
                            placeholder="min"
                            aria-label="Minute du but"
                            className={rowField}
                          />
                          <input
                            value={scorer.name}
                            onChange={(event) =>
                              updateScorer(scorer.uid, { name: event.target.value })
                            }

                            list={scorer.side === 'club' ? 'match-scorer-players' : undefined}
                            placeholder="Nom du buteur"
                            aria-label="Nom du buteur"
                            className={rowField}
                          />
                          <select
                            value={scorer.side}
                            onChange={(event) =>
                              updateScorer(scorer.uid, { side: event.target.value as ScorerSide })
                            }
                            aria-label="Équipe du buteur"
                            className={rowField}
                          >
                            <option value="club" className="bg-graphite">Cambérène</option>
                            <option value="opponent" className="bg-graphite">
                              {form.opponent.trim() || 'Adversaire'}
                            </option>
                          </select>
                          <button
                            type="button"
                            onClick={() => removeScorer(scorer.uid)}
                            aria-label={`Retirer ${scorer.name.trim() || 'ce buteur'}`}
                            className="text-white/40 hover:text-red-300"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {scorer.side === 'club' && (
                          <div className="grid grid-cols-[3.25rem_minmax(0,1fr)_8.5rem] items-center gap-2">
                            <span className="text-right text-[10px] uppercase tracking-wide text-white/40">Passe</span>
                            <input
                              value={scorer.assist}
                              onChange={(event) => updateScorer(scorer.uid, { assist: event.target.value })}
                              list="match-scorer-players"
                              placeholder="Passeur décisif (facultatif)"
                              aria-label="Passeur décisif"
                              className={rowField}
                            />
                            <StatLink name={scorer.assist} linked={Boolean(findPlayerId(scorer.assist))} />
                          </div>
                        )}
                        {scorer.side === 'club' && scorer.name.trim() && (
                          <p className="pl-[3.75rem] text-[10px]">
                            <StatLink name={scorer.name} linked={Boolean(findPlayerId(scorer.name))} long />
                          </p>
                        )}
                        </div>
                      ))}
                    </div>
                  )}

                  <datalist id="match-scorer-players">
                    {playerNames.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>

                  {scoreCheck && !scoreCheck.complete && (
                    <p className="mt-3 text-[11px] text-club-yellow/80">
                      {scoreCheck.club}/{scoreCheck.expected.club} but
                      {scoreCheck.expected.club > 1 ? 's' : ''} de Cambérène et{' '}
                      {scoreCheck.opponent}/{scoreCheck.expected.opponent} de l’adversaire saisis.
                      La feuille peut rester incomplète : elle s’enregistre telle quelle.
                    </p>
                  )}
                  {scoreCheck?.complete && form.scorers.length > 0 && (
                    <p className="mt-3 text-[11px] text-green-300/80">
                      Feuille complète : tous les buts du score sont attribués.
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full bg-white/5 px-4 py-2 text-white/70 hover:bg-white/10"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-club-yellow px-5 py-2 font-semibold text-black disabled:opacity-60"
                >
                  {saving ? 'Enregistrement…' : editingId ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <AdminConfirmDelete
          title="Supprimer le match"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemoval}
          saving={saving}
        >
          Confirmez-vous la suppression ? Cette action est définitive.
        </AdminConfirmDelete>
      )}
    </div>
  );
};

export default CalendrierAdmin;
