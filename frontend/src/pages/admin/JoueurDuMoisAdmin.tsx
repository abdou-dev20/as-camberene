import React, { useMemo, useState } from 'react';
import { Check, Crown, Lock, Pencil, Plus, Sparkles, Trash2, Unlock, Vote, X } from 'lucide-react';
import useApiResource from '../../hooks/useApiResource';
import useEditableResource from '../../hooks/useEditableResource';
import { useTeams } from '../../hooks/useContent';
import { teamMembers as teamMembersApi, TeamMemberRecord } from '../../services/site/content.service';
import {
  createPotm,
  deletePotm,
  formatPotmPercent,
  getCurrentPotm,
  listPotm,
  monthName,
  PotmAdmin,
  PotmCurrent,
  updatePotm,
  votePotm,
} from '../../services/site/playerOfMonth.service';
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminFeedback';
import { ApiError } from '../../lib/api';
import { IMAGE_PLACEHOLDER, handleImageError } from '../../lib/imagePlaceholder';
import { PLAYER_TEAM_LABELS } from '../../types';

const currentMonth = () => new Date().toISOString().slice(0, 7);

const JoueurDuMoisAdmin: React.FC = () => {
  const { data: polls, loading, error, reload } = useApiResource<PotmAdmin[]>((signal) => listPotm(signal), []);
  const { items: roster } = useEditableResource<TeamMemberRecord>(teamMembersApi, { kind: 'player', limit: 100 });
  const { data: teams } = useTeams();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PotmAdmin | null>(null);
  const [form, setForm] = useState({ month: currentMonth(), title: '', nominees: [] as string[] });
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<ApiError | null>(null);

  const { data: current, reload: reloadCurrent } = useApiResource<PotmCurrent | null>(
    (signal) => getCurrentPotm(signal, { auth: true }),
    null
  );
  const [picked, setPicked] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [bonusPoll, setBonusPoll] = useState<PotmAdmin | null>(null);
  const [bonusForm, setBonusForm] = useState<Record<string, number>>({});

  const openBonus = (poll: PotmAdmin) => {
    setActionError(null);
    setBonusPoll(poll);
    setBonusForm(Object.fromEntries(poll.results.map((row) => [row.id, row.bonus])));
  };

  const addBonus = (playerId: string, amount: number) => {
    setBonusForm((form) => ({
      ...form,
      [playerId]: Math.min(100, Math.round(((form[playerId] ?? 0) + amount) * 10) / 10),
    }));
  };

  const saveBonus = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!bonusPoll) return;
    const ok = await run(() =>
      updatePotm(
        bonusPoll.id,
        {
          bonuses: bonusPoll.results.map((row) => ({
            player: row.id,
            points: Math.round(Number(bonusForm[row.id] ?? 0) * 10) / 10,
          })),
        }
      )
    );
    if (ok) {
      setBonusPoll(null);
      reloadCurrent();
    }
  };

  const castVote = async () => {
    if (!current || !picked) return;
    setVoting(true);
    setVoteError('');
    try {
      await votePotm(current.id, picked, { auth: true });
      setPicked(null);
      reloadCurrent();
      reload();
    } catch (cause) {
      setVoteError(cause instanceof ApiError ? cause.fullMessage : 'Vote non enregistré.');
      reloadCurrent();
    } finally {
      setVoting(false);
    }
  };

  const teamName = (slug: string) => teams.find((team) => team.slug === slug)?.name ?? PLAYER_TEAM_LABELS[slug] ?? slug;

  const byTeam = useMemo(() => {
    const groups = new Map<string, TeamMemberRecord[]>();
    [...roster]
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      .forEach((player) => groups.set(player.team, [...(groups.get(player.team) ?? []), player]));
    return [...groups.entries()];
  }, [roster]);

  const run = async (operation: () => Promise<unknown>) => {
    setBusy(true);
    setActionError(null);
    try {
      await operation();
      reload();
      return true;
    } catch (cause) {
      setActionError(cause instanceof ApiError ? cause : new ApiError(0, 'Action impossible.'));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ month: currentMonth(), title: '', nominees: [] });
    setActionError(null);
    setModalOpen(true);
  };

  const openEdit = (poll: PotmAdmin) => {
    setEditing(poll);
    setForm({ month: poll.month, title: poll.title, nominees: poll.results.map((row) => row.id) });
    setActionError(null);
    setModalOpen(true);
  };

  const toggleNominee = (id: string) =>
    setForm((f) => ({
      ...f,
      nominees: f.nominees.includes(id) ? f.nominees.filter((n) => n !== id) : [...f.nominees, id],
    }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (editing) {
      const removedWithVotes = editing.results.filter((row) => row.votes > 0 && !form.nominees.includes(row.id));
      if (
        removedWithVotes.length > 0 &&
        !window.confirm(`Retirer ${removedWithVotes.map((r) => r.name).join(', ')} supprimera leurs votes. Continuer ?`)
      ) {
        return;
      }
    }
    const ok = await run(() =>
      editing
        ? updatePotm(editing.id, { title: form.title, nominees: form.nominees })
        : createPotm({ month: form.month, title: form.title, nominees: form.nominees, status: 'open' })
    );
    if (ok) setModalOpen(false);
  };

  const toggleStatus = (poll: PotmAdmin) => {
    const opening = poll.status === 'closed';
    const others = polls.some((p) => p.id !== poll.id && p.status === 'open');
    const message = opening
      ? `Rouvrir le vote de ${monthName(poll.month)} ?${others ? ' Le vote actuellement ouvert sera clos.' : ''}`
      : `Clore le vote de ${monthName(poll.month)} ? Le vainqueur sera affiché sur le site.`;
    if (window.confirm(message)) void run(() => updatePotm(poll.id, { status: opening ? 'open' : 'closed' }));
  };

  const remove = (poll: PotmAdmin) => {
    if (window.confirm(`Supprimer l’élection de ${monthName(poll.month)} et ses ${poll.totalVotes} vote(s) ? Action définitive.`)) {
      void run(() => deletePotm(poll.id));
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="mb-1 text-2xl font-bold text-white">Joueur du mois</h2>
          <p className="text-sm text-white/60">
            Nommez des joueurs de l’effectif ; chacun peut voter une fois sans compte depuis Actualités → Joueur du mois.
          </p>
        </div>
        <button onClick={openCreate} className="flex items-center justify-center gap-2 rounded-full bg-club-yellow px-5 py-2.5 text-xs font-semibold text-black shadow">
          <Plus size={14} /> Nouvelle élection
        </button>
      </div>

      <AdminError error={error ?? (modalOpen ? null : actionError)} onRetry={reload} />

      {current && current.status === 'open' && (
        <section className="mb-8 rounded-2xl border border-club-yellow/40 bg-club-yellow/[0.06] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Vote size={18} className="text-club-yellow" /> Voter — {monthName(current.month)}
              </h3>
            </div>
            {current.myVote && (
              <span className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-300">
                <Check size={13} /> Vote enregistré
              </span>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {current.nominees.map((nominee) => {
              const isMine = current.myVote === nominee.id;
              const isPicked = picked === nominee.id;
              const canPick = !current.myVote;
              return (
                <button
                  key={nominee.id}
                  type="button"
                  disabled={!canPick}
                  onClick={() => setPicked(nominee.id)}
                  aria-pressed={isPicked}
                  className={`flex items-center gap-3 rounded-xl border-2 bg-black/20 p-2.5 text-left transition ${
                    isMine || isPicked ? 'border-club-yellow' : 'border-white/10'
                  } ${canPick ? 'cursor-pointer hover:border-club-yellow/60' : 'cursor-default opacity-90'}`}
                >
                  <img src={nominee.photo || IMAGE_PLACEHOLDER} onError={handleImageError} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover object-top" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold uppercase text-club-yellow">
                      {nominee.number > 0 ? `N°${nominee.number} · ` : ''}{nominee.position || nominee.line}
                    </span>
                    <span className="block truncate text-sm font-semibold text-white">{nominee.name}</span>
                    {isMine && <span className="text-[11px] text-club-yellow">Votre vote</span>}
                  </span>
                  {(isMine || isPicked) && (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-club-yellow text-black">
                      <Check size={15} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {voteError && <p className="mt-3 text-xs text-red-300">{voteError}</p>}

          {!current.myVote && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => void castVote()}
                disabled={!picked || voting}
                className="flex items-center gap-2 rounded-full bg-club-yellow px-5 py-2.5 text-xs font-semibold text-black shadow disabled:opacity-50"
              >
                <Vote size={14} />
                {voting ? 'Enregistrement…' : picked ? 'Valider mon vote' : 'Choisissez un joueur'}
              </button>
            </div>
          )}
        </section>
      )}

      {loading && polls.length === 0 ? (
        <AdminLoading label="Chargement des élections…" />
      ) : polls.length === 0 ? (
        <AdminEmpty label="Aucune élection. Créez la première avec « Nouvelle élection »." />
      ) : (
        <div className="space-y-6">
          {polls.map((poll) => {
            const top = poll.results[0]?.votes ?? 0;
            return (
              <section key={poll.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{monthName(poll.month)}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${poll.status === 'open' ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/60'}`}>
                        {poll.status === 'open' ? 'Vote ouvert' : 'Vote clos'}
                      </span>
                    </div>
                    {poll.title && <p className="text-xs text-white/50">{poll.title}</p>}
                    <p className="mt-1 text-xs text-white/60">
                      <strong className="text-white">{poll.totalVotes}</strong> vote{poll.totalVotes > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button onClick={() => toggleStatus(poll)} disabled={busy} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-white hover:bg-white/20">
                      {poll.status === 'open' ? <><Lock size={12} /> Clore le vote</> : <><Unlock size={12} /> Rouvrir</>}
                    </button>
                    <button onClick={() => openEdit(poll)} disabled={busy} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-white hover:bg-white/20">
                      <Pencil size={12} /> Nommés
                    </button>
                    <button onClick={() => openBonus(poll)} disabled={busy} className="flex items-center gap-1.5 rounded-full bg-club-yellow/15 px-3 py-1.5 text-club-yellow hover:bg-club-yellow/25">
                      <Sparkles size={12} /> Bonus
                    </button>
                    <button onClick={() => remove(poll)} disabled={busy} className="flex items-center gap-1.5 rounded-full bg-red-500/30 px-3 py-1.5 text-red-200 hover:bg-red-500/40">
                      <Trash2 size={12} /> Supprimer
                    </button>
                  </div>
                </div>

                <ol className="space-y-2">
                  {poll.results.map((row, index) => {
                    const share = row.percent ?? (poll.totalVotes > 0 ? Math.round((row.votes / poll.totalVotes) * 100) : 0);
                    const leading = row.votes > 0 && row.votes === top;
                    return (
                      <li key={row.id} className="flex items-center gap-3">
                        <span className="w-5 text-right text-xs font-bold text-white/40">{index + 1}</span>
                        <img src={row.photo || IMAGE_PLACEHOLDER} onError={handleImageError} alt="" className="h-9 w-9 shrink-0 rounded-full border border-white/10 object-cover object-top" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <span className="flex min-w-0 items-center gap-1.5 truncate text-white">
                              {leading && <Crown size={13} className="shrink-0 text-club-yellow" />}
                              {row.name}
                              {row.bonus > 0 && (
                                <span className="shrink-0 rounded-full bg-club-yellow/15 px-1.5 py-0.5 text-[10px] text-club-yellow">
                                  +{formatPotmPercent(row.bonus)} %
                                </span>
                              )}
                            </span>
                            <span className="shrink-0 text-xs text-white/70">
                              <strong className="text-white">{row.votes}</strong> · {formatPotmPercent(share)} %
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div className={`h-full rounded-full ${leading ? 'bg-club-yellow' : 'bg-white/40'}`} style={{ width: `${Math.min(100, share)}%` }} />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-graphite/90 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.05] p-6">
            <button onClick={() => setModalOpen(false)} className="absolute right-3 top-3 text-white/60 hover:text-white"><X size={16} /></button>
            <h3 className="mb-4 text-lg font-semibold text-white">
              {editing ? `Nommés — ${monthName(editing.month)}` : 'Nouvelle élection'}
            </h3>
            <form onSubmit={submit} className="space-y-4 text-xs">
              {!editing && (
                <label className="block">
                  <span className="mb-1.5 block uppercase tracking-wide text-white/50">Mois</span>
                  <input type="month" required value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-club-yellow" />
                </label>
              )}
              <label className="block">
                <span className="mb-1.5 block uppercase tracking-wide text-white/50">Titre (facultatif)</span>
                <input value={form.title} maxLength={150} placeholder="Élisez le joueur du mois" onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-club-yellow" />
              </label>

              <div>
                <p className="mb-1.5 uppercase tracking-wide text-white/50">
                  Joueurs nommés ({form.nominees.length}) — au moins 2
                </p>
                {roster.length === 0 ? (
                  <p className="rounded-lg bg-white/5 p-3 text-white/60">Aucun joueur dans l’effectif. Ajoutez-en depuis l’onglet Effectif.</p>
                ) : (
                  <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border border-white/10 p-3">
                    {byTeam.map(([slug, players]) => (
                      <div key={slug}>
                        <p className="mb-1 text-[10px] uppercase tracking-wider text-white/40">{teamName(slug)}</p>
                        {players.map((player) => (
                          <label key={player.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-white/5">
                            <input type="checkbox" checked={form.nominees.includes(player.id)} onChange={() => toggleNominee(player.id)} />
                            <span className="text-sm text-white">{player.name}</span>
                            <span className="text-white/40">{player.number > 0 ? `N°${player.number} · ` : ''}{player.line}</span>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {actionError && <p className="text-red-300">{actionError.fullMessage}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-full bg-white/5 px-4 py-2 text-white/70 hover:bg-white/10">Annuler</button>
                <button type="submit" disabled={busy || form.nominees.length < 2} className="rounded-full bg-club-yellow px-5 py-2 font-semibold text-black disabled:opacity-60">
                  {busy ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Ouvrir le vote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {bonusPoll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-graphite/90 backdrop-blur-sm" onClick={() => setBonusPoll(null)} />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.05] p-6">
            <button onClick={() => setBonusPoll(null)} className="absolute right-3 top-3 text-white/60 hover:text-white"><X size={16} /></button>
            <h3 className="mb-1 text-lg font-semibold text-white">Bonus de score — {monthName(bonusPoll.month)}</h3>
            <p className="mb-4 text-xs text-white/50">
              Chaque vote vaut 0,5 %. Le bonus s’ajoute directement en points de pourcentage.
            </p>
            <form onSubmit={saveBonus} className="space-y-3 text-xs">
              {bonusPoll.results.map((row) => (
                <div key={row.id} className="rounded-lg bg-white/5 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white">{row.name}</span>
                      <span className="block text-white/50">
                        {row.votes} vote{row.votes > 1 ? 's' : ''} · {formatPotmPercent(row.percent)} %
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={bonusForm[row.id] ?? 0}
                        onChange={(event) => setBonusForm((form) => ({ ...form, [row.id]: Number(event.target.value) }))}
                        className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-right text-white outline-none focus:border-club-yellow"
                      />
                      <span className="text-white/50">%</span>
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[10, 20, 30, 50].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => addBonus(row.id, value)}
                        className="rounded-full bg-club-yellow/15 px-2.5 py-1 text-[11px] font-semibold text-club-yellow hover:bg-club-yellow/25"
                      >
                        +{value} %
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setBonusForm((form) => ({ ...form, [row.id]: 0 }))}
                      className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/60 hover:bg-white/10"
                    >
                      Remettre à 0
                    </button>
                  </div>
                </div>
              ))}

              {actionError && <p className="text-red-300">{actionError.fullMessage}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setBonusPoll(null)} className="rounded-full bg-white/5 px-4 py-2 text-white/70 hover:bg-white/10">Annuler</button>
                <button type="submit" disabled={busy} className="rounded-full bg-club-yellow px-5 py-2 font-semibold text-black disabled:opacity-60">
                  {busy ? 'Enregistrement…' : 'Appliquer les bonus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoueurDuMoisAdmin;
