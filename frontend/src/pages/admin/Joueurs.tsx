import React, { useCallback, useMemo, useState } from 'react';
import { Plus, Search, Users, X } from 'lucide-react';
import useEditableResource from '../../hooks/useEditableResource';
import { useTeams } from '../../hooks/useContent';
import { teamMembers as teamMembersApi, TeamMemberRecord } from '../../services/site/content.service';
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminFeedback';
import ImageField from '../../components/admin/ImageField';
import { IMAGE_PLACEHOLDER, handleImageError } from '../../lib/imagePlaceholder';
import {
  PLAYER_KINDS,
  PLAYER_LINES,
  PLAYER_STATUSES,
  PLAYER_TEAM_LABELS,
  PlayerKind,
  PlayerLine,
  PlayerStatus,
  PlayerTeam,
  STRONG_FEET,
  StrongFoot,
} from '../../types';
import AdminConfirmDelete from '../../components/admin/AdminConfirmDelete';

const toNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const toDateInput = (value: string | null): string => (value ? String(value).slice(0, 10) : '');

const EMPTY_FORM = {
  kind: 'player' as PlayerKind,
  name: '',
  team: 'equipe-a' as PlayerTeam,
  number: '',
  line: 'Milieu' as PlayerLine,
  position: '',
  role: '',
  photo: '',
  status: 'actif' as PlayerStatus,
  birthDate: '',
  nationality: 'Sénégal',
  height: '',
  weight: '',
  strongFoot: '' as StrongFoot | '',
  matches: '',
  goals: '',
  assists: '',
  yellowCards: '',
  redCards: '',
  biography: '',
  joinedYear: '',
  rank: '',
  isVisible: true,
  isFeatured: false,
};

const STATUS_STYLES: Record<PlayerStatus, string> = {
  actif: 'bg-green-500/20 text-green-300',
  blessé: 'bg-red-500/20 text-red-200',
  suspendu: 'bg-orange-500/20 text-orange-200',
  prêté: 'bg-blue-500/20 text-blue-200',
  inactif: 'bg-white/10 text-white/60',
};

const KIND_LABELS: Record<PlayerKind, string> = {
  player: 'Joueur',
  staff: 'Encadrement',
};

const Joueurs: React.FC = () => {
  const {
    items: members,
    loading,
    error,
    actionError,
    saving,
    reload,
    create,
    update,
    remove,
  } = useEditableResource<TeamMemberRecord>(teamMembersApi);

  const { data: teams } = useTeams();

  const teamOrder = useCallback(
    (slug: string) => {
      const index = teams.findIndex((team) => team.slug === slug);
      return index === -1 ? teams.length : index;
    },
    [teams]
  );

  const teamLabel = useCallback(
    (slug: string) => teams.find((team) => team.slug === slug)?.name ?? PLAYER_TEAM_LABELS[slug] ?? slug,
    [teams]
  );

  const [query, setQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState<PlayerTeam | ''>('');
  const [kindFilter, setKindFilter] = useState<PlayerKind | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const isStaff = form.kind === 'staff';

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return members
      .filter((member) => {
        const matchesQuery =
          !needle ||
          member.name.toLowerCase().includes(needle) ||
          (member.position ?? '').toLowerCase().includes(needle) ||
          (member.role ?? '').toLowerCase().includes(needle) ||
          String(member.number ?? '').includes(needle);
        const matchesTeam = !teamFilter || member.team === teamFilter;
        const matchesKind = !kindFilter || member.kind === kindFilter;
        return matchesQuery && matchesTeam && matchesKind;
      })
      .sort((a, b) => {
        if (a.team !== b.team) return teamOrder(a.team) - teamOrder(b.team);
        if (a.kind !== b.kind) return a.kind === 'player' ? -1 : 1;
        if (a.kind === 'player' && a.line !== b.line) {
          return PLAYER_LINES.indexOf(a.line) - PLAYER_LINES.indexOf(b.line);
        }
        return (a.rank ?? 0) - (b.rank ?? 0) || (a.number ?? 0) - (b.number ?? 0) || a.name.localeCompare(b.name);
      });
  }, [members, query, teamFilter, kindFilter, teamOrder]);

  const countByTeam = useMemo(() => {
    const counts = new Map<PlayerTeam, number>();
    for (const member of members) counts.set(member.team, (counts.get(member.team) ?? 0) + 1);
    return counts;
  }, [members]);

  const openCreate = () => {
    setEditingId(null);

    setForm({ ...EMPTY_FORM, team: teamFilter || EMPTY_FORM.team });
    setModalOpen(true);
  };

  const openEdit = (member: TeamMemberRecord) => {
    setEditingId(member.id);
    setForm({
      kind: member.kind,
      name: member.name,
      team: member.team,
      number: member.number ? String(member.number) : '',
      line: member.line,
      position: member.position ?? '',
      role: member.role ?? '',
      photo: member.photo ?? '',
      status: member.status,
      birthDate: toDateInput(member.birthDate),
      nationality: member.nationality ?? '',
      height: member.height ? String(member.height) : '',
      weight: member.weight ? String(member.weight) : '',
      strongFoot: member.strongFoot ?? '',
      matches: String(member.stats?.matches ?? ''),
      goals: String(member.stats?.goals ?? ''),
      assists: String(member.stats?.assists ?? ''),
      yellowCards: String(member.stats?.yellowCards ?? ''),
      redCards: String(member.stats?.redCards ?? ''),
      biography: member.biography ?? '',
      joinedYear: member.joinedYear ? String(member.joinedYear) : '',
      rank: String(member.rank ?? ''),
      isVisible: member.isVisible !== false,
      isFeatured: member.isFeatured === true,
    });
    setModalOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      kind: form.kind,
      name: form.name,
      team: form.team,
      number: isStaff ? 0 : toNumber(form.number),
      line: isStaff ? 'Milieu' : form.line,
      position: isStaff ? '' : form.position,
      role: isStaff ? form.role : '',
      photo: form.photo,
      status: form.status,
      birthDate: form.birthDate || null,
      nationality: form.nationality,
      height: toNumber(form.height),
      weight: toNumber(form.weight),
      strongFoot: isStaff ? '' : form.strongFoot,
      stats: {
        matches: toNumber(form.matches),
        goals: toNumber(form.goals),
        assists: toNumber(form.assists),
        yellowCards: toNumber(form.yellowCards),
        redCards: toNumber(form.redCards),
      },
      biography: form.biography,
      joinedYear: toNumber(form.joinedYear),
      rank: toNumber(form.rank),
      isVisible: form.isVisible,
      isFeatured: form.isFeatured,
    };

    const saved = editingId ? await update(editingId, payload) : await create(payload);
    if (saved) setModalOpen(false);
  };

  const confirmRemoval = async () => {
    if (!confirmDelete) return;
    if (await remove(confirmDelete)) setConfirmDelete(null);
  };

  const field = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-club-yellow outline-none';

  return (
    <div>
      <div className="mb-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-white">
            <Users size={20} className="text-club-yellow" />
            Effectif
          </h2>
          <p className="text-sm text-white/60">
            Joueurs et encadrement de toutes les équipes ({filtered.length})
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <label htmlFor="member-search" className="sr-only">Rechercher un membre</label>
            <input
              id="member-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nom, poste, numéro…"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-xs text-white placeholder-white/40 outline-none focus:border-club-yellow"
            />
          </div>
          <label htmlFor="member-kind" className="sr-only">Filtrer par nature</label>
          <select
            id="member-kind"
            value={kindFilter}
            onChange={(event) => setKindFilter(event.target.value as PlayerKind | '')}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-club-yellow"
          >
            <option value="">Tous</option>
            {PLAYER_KINDS.map((kind) => (
              <option key={kind} value={kind} className="bg-graphite">{KIND_LABELS[kind]}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center justify-center gap-2 rounded-full bg-club-yellow px-5 py-2.5 text-xs font-semibold text-black shadow hover:shadow-lg"
          >
            <Plus size={14} /> Nouveau
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTeamFilter('')}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
            teamFilter === '' ? 'bg-club-yellow text-black' : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          Toutes les équipes ({members.length})
        </button>
        {teams.map((team) => (
          <button
            key={team.slug}
            type="button"
            onClick={() => setTeamFilter(team.slug)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              teamFilter === team.slug ? 'bg-club-yellow text-black' : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {team.name} ({countByTeam.get(team.slug) ?? 0})
          </button>
        ))}
      </div>

      <AdminError error={error ?? actionError} onRetry={reload} />

      {loading ? (
        <AdminLoading label="Chargement de l’effectif…" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-white/60">
              <tr>
                <th className="px-4 py-3 text-left">Membre</th>
                <th className="px-4 py-3 text-left">Équipe</th>
                <th className="px-4 py-3 text-left">Poste</th>
                <th className="px-4 py-3 text-left">Âge</th>
                <th className="px-4 py-3 text-left">Statistiques</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/70">
              {filtered.map((member) => (
                <tr key={member.id} className={`hover:bg-white/5 ${member.isVisible ? '' : 'opacity-50'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.photo || IMAGE_PLACEHOLDER}
                        alt=""
                        onError={handleImageError}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-medium text-white">{member.name}</p>
                        <p className="text-xs text-white/40">
                          {member.kind === 'staff'
                            ? KIND_LABELS.staff
                            : member.number
                              ? `#${member.number}`
                              : 'Sans numéro'}
                          {member.isVisible ? '' : ' · masqué'}
                          {member.isFeatured ? ' · vedette' : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">{teamLabel(member.team)}</td>
                  <td className="px-4 py-3 text-xs">
                    {member.kind === 'staff'
                      ? member.role || '—'
                      : [member.line, member.position].filter(Boolean).join(' · ')}
                  </td>
                  <td className="px-4 py-3 text-xs">{member.age || '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    {member.kind === 'staff'
                      ? '—'
                      : `${member.stats?.matches ?? 0} m · ${member.stats?.goals ?? 0} b · ${member.stats?.assists ?? 0} p`}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold capitalize ${STATUS_STYLES[member.status]}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="space-x-2 whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(member)}
                      className="rounded-full bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                    >
                      Éditer
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(member.id)}
                      className="rounded-full bg-red-500/30 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/40"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-0">
                    <AdminEmpty
                      label={
                        members.length === 0
                          ? 'Aucun membre en base — commencez par « Nouveau »'
                          : 'Aucun membre ne correspond à la recherche'
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
          <div className="absolute inset-0 bg-graphite/90 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.05] p-6">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              aria-label="Fermer"
              className="absolute right-3 top-3 text-white/60 hover:text-white"
            >
              <X size={16} />
            </button>
            <h3 className="mb-4 text-lg font-semibold text-white">
              {editingId ? 'Modifier la fiche' : 'Nouveau membre'}
            </h3>

            <form onSubmit={submit} className="space-y-4 text-xs">
              <div className="flex gap-2">
                {PLAYER_KINDS.map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, kind }))}
                    className={`flex-1 rounded-lg px-4 py-2 font-semibold transition ${
                      form.kind === kind ? 'bg-club-yellow text-black' : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {KIND_LABELS[kind]}
                  </button>
                ))}
              </div>

              <input
                required
                value={form.name}
                onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
                placeholder="Nom complet"
                aria-label="Nom complet"
                className={field}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="member-team" className="mb-1 block text-white/60">Équipe</label>
                  <select
                    id="member-team"
                    value={form.team}
                    onChange={(event) => setForm((f) => ({ ...f, team: event.target.value as PlayerTeam }))}
                    className={field}
                  >
                    {teams.map((team) => (
                      <option key={team.slug} value={team.slug} className="bg-graphite">
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="member-status" className="mb-1 block text-white/60">Statut</label>
                  <select
                    id="member-status"
                    value={form.status}
                    onChange={(event) => setForm((f) => ({ ...f, status: event.target.value as PlayerStatus }))}
                    className={`${field} capitalize`}
                  >
                    {PLAYER_STATUSES.map((status) => (
                      <option key={status} value={status} className="bg-graphite capitalize">{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              {isStaff ? (
                <input
                  value={form.role}
                  onChange={(event) => setForm((f) => ({ ...f, role: event.target.value }))}
                  placeholder="Fonction (Entraîneur, Adjoint, Préparateur physique…)"
                  aria-label="Fonction"
                  className={field}
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label htmlFor="member-number" className="mb-1 block text-white/60">Numéro</label>
                    <input
                      id="member-number"
                      type="number"
                      min={0}
                      max={99}
                      value={form.number}
                      onChange={(event) => setForm((f) => ({ ...f, number: event.target.value }))}
                      placeholder="10"
                      className={field}
                    />
                  </div>
                  <div>
                    <label htmlFor="member-line" className="mb-1 block text-white/60">Ligne</label>
                    <select
                      id="member-line"
                      value={form.line}
                      onChange={(event) => setForm((f) => ({ ...f, line: event.target.value as PlayerLine }))}
                      className={field}
                    >
                      {PLAYER_LINES.map((line) => (
                        <option key={line} value={line} className="bg-graphite">{line}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="member-position" className="mb-1 block text-white/60">Poste précis</label>
                    <input
                      id="member-position"
                      value={form.position}
                      onChange={(event) => setForm((f) => ({ ...f, position: event.target.value }))}
                      placeholder="Ailier gauche"
                      className={field}
                    />
                  </div>
                </div>
              )}

              <ImageField
                value={form.photo}
                onChange={(value) => setForm((f) => ({ ...f, photo: value }))}
                label="Portrait"
              />

              <fieldset>
                <legend className="mb-2 text-white/60">État civil</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="member-birth" className="mb-1 block text-white/50">
                      Date de naissance
                    </label>
                    <input
                      id="member-birth"
                      type="date"
                      value={form.birthDate}
                      onChange={(event) => setForm((f) => ({ ...f, birthDate: event.target.value }))}
                      className={`${field} [color-scheme:dark]`}
                    />
                  </div>
                  <div>
                    <label htmlFor="member-nationality" className="mb-1 block text-white/50">
                      Nationalité
                    </label>
                    <input
                      id="member-nationality"
                      value={form.nationality}
                      onChange={(event) => setForm((f) => ({ ...f, nationality: event.target.value }))}
                      placeholder="Sénégal"
                      className={field}
                    />
                  </div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                  <input
                    type="number"
                    min={0}
                    max={260}
                    value={form.height}
                    onChange={(event) => setForm((f) => ({ ...f, height: event.target.value }))}
                    placeholder="Taille (cm)"
                    aria-label="Taille en centimètres"
                    className={field}
                  />
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={form.weight}
                    onChange={(event) => setForm((f) => ({ ...f, weight: event.target.value }))}
                    placeholder="Poids (kg)"
                    aria-label="Poids en kilogrammes"
                    className={field}
                  />
                  {!isStaff && (
                    <select
                      value={form.strongFoot}
                      onChange={(event) => setForm((f) => ({ ...f, strongFoot: event.target.value as StrongFoot | '' }))}
                      aria-label="Pied fort"
                      className={field}
                    >
                      <option value="" className="bg-graphite">Pied fort</option>
                      {STRONG_FEET.map((foot) => (
                        <option key={foot} value={foot} className="bg-graphite">{foot}</option>
                      ))}
                    </select>
                  )}
                  <input
                    type="number"
                    min={0}
                    value={form.joinedYear}
                    onChange={(event) => setForm((f) => ({ ...f, joinedYear: event.target.value }))}
                    placeholder="Arrivée (année)"
                    aria-label="Année d'arrivée au club"
                    className={field}
                  />
                </div>
              </fieldset>

              {!isStaff && (
                <fieldset>
                  <legend className="mb-2 text-white/60">Statistiques de la saison</legend>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {([
                      ['matches', 'Matchs'],
                      ['goals', 'Buts'],
                      ['assists', 'Passes'],
                      ['yellowCards', 'Jaunes'],
                      ['redCards', 'Rouges'],
                    ] as const).map(([key, label]) => (
                      <input
                        key={key}
                        type="number"
                        min={0}
                        value={form[key]}
                        onChange={(event) => setForm((f) => ({ ...f, [key]: event.target.value }))}
                        placeholder={label}
                        aria-label={label}
                        className={field}
                      />
                    ))}
                  </div>
                </fieldset>
              )}

              <textarea
                value={form.biography}
                onChange={(event) => setForm((f) => ({ ...f, biography: event.target.value }))}
                placeholder="Biographie"
                aria-label="Biographie"
                rows={4}
                className={`${field} resize-none`}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="number"
                  min={0}
                  value={form.rank}
                  onChange={(event) => setForm((f) => ({ ...f, rank: event.target.value }))}
                  placeholder="Ordre d'affichage"
                  aria-label="Ordre d'affichage"
                  className={field}
                />
                <label className="flex cursor-pointer select-none items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isVisible}
                    onChange={(event) => setForm((f) => ({ ...f, isVisible: event.target.checked }))}
                    className="accent-club-yellow"
                  />
                  <span>Visible sur le site</span>
                </label>
                <label className="flex cursor-pointer select-none items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(event) => setForm((f) => ({ ...f, isFeatured: event.target.checked }))}
                    className="accent-club-yellow"
                  />
                  <span>
                    Vedette <span className="text-white/40">— « Nos stars »</span>
                  </span>
                </label>
              </div>

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
          title="Supprimer la fiche"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemoval}
          saving={saving}
        >
          Confirmez-vous la suppression ? Elle est définitive. Pour retirer un membre du site sans perdre sa fiche, décochez plutôt « Visible sur le site ».
        </AdminConfirmDelete>
      )}
    </div>
  );
};

export default Joueurs;
