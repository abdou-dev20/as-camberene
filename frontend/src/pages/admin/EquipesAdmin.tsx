import React, { useMemo, useState } from 'react';
import { Plus, Search, Shield, Users, X } from 'lucide-react';
import useEditableResource from '../../hooks/useEditableResource';
import { teams as teamsApi, TeamRecord } from '../../services/site/content.service';
import { useTeamMembers } from '../../hooks/useContent';
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminFeedback';
import ImageField from '../../components/admin/ImageField';
import { handleImageError } from '../../lib/imagePlaceholder';
import { TEAM_CATEGORIES, TeamCategory } from '../../types';
import AdminConfirmDelete from '../../components/admin/AdminConfirmDelete';

const CATEGORY_LABELS: Record<TeamCategory, string> = {
  senior: 'Équipe première',
  youth: 'Formation',
};

const toLines = (values: string[] = []): string => values.join('\n');
const fromLines = (value: string): string[] =>
  value.split('\n').map((line) => line.trim()).filter(Boolean);

const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const EMPTY_FORM = {
  slug: '',
  name: '',
  category: 'youth' as TeamCategory,
  ageRange: '',
  subtitle: '',
  description: '',
  coach: '',
  training: '',
  stadium: '',
  achievements: '',
  established: '',
  image: '',
  wins: '0',
  draws: '0',
  losses: '0',
  rank: '0',
  isVisible: true,
};

const EquipesAdmin: React.FC = () => {
  const {
    items: teams,
    loading,
    error,
    actionError,
    saving,
    reload,
    create,
    update,
    remove,
  } = useEditableResource<TeamRecord>(teamsApi);

  const { data: members } = useTeamMembers();

  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [slugTouched, setSlugTouched] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<TeamRecord | null>(null);

  const countByTeam = useMemo(() => {
    const counts = new Map<string, number>();
    members.forEach((member) => counts.set(member.team, (counts.get(member.team) ?? 0) + 1));
    return counts;
  }, [members]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return teams;
    return teams.filter(
      (team) =>
        team.name.toLowerCase().includes(needle) ||
        team.slug.includes(needle) ||
        (team.coach ?? '').toLowerCase().includes(needle)
    );
  }, [teams, query]);

  const openCreate = () => {
    setEditingId(null);
    setSlugTouched(false);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  };

  const openEdit = (team: TeamRecord) => {
    setEditingId(team.id);
    setSlugTouched(true);
    setForm({
      slug: team.slug,
      name: team.name,
      category: team.category,
      ageRange: team.ageRange ?? '',
      subtitle: team.subtitle ?? '',
      description: team.description ?? '',
      coach: team.coach ?? '',
      training: team.training ?? '',
      stadium: team.stadium ?? '',
      achievements: toLines(team.achievements),
      established: team.established ?? '',
      image: team.image ?? '',
      wins: String(team.stats?.wins ?? 0),
      draws: String(team.stats?.draws ?? 0),
      losses: String(team.stats?.losses ?? 0),
      rank: String(team.rank ?? 0),
      isVisible: team.isVisible !== false,
    });
    setModalOpen(true);
  };

  const onNameChange = (value: string) => {
    setForm((f) => ({
      ...f,
      name: value,
      slug: editingId || slugTouched ? f.slug : slugify(value),
    }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const common = {
      name: form.name,
      category: form.category,
      ageRange: form.ageRange,
      subtitle: form.subtitle,
      description: form.description,
      coach: form.coach,
      training: form.training,
      stadium: form.stadium,
      achievements: fromLines(form.achievements),
      established: form.established,
      image: form.image,
      stats: {
        wins: Number(form.wins) || 0,
        draws: Number(form.draws) || 0,
        losses: Number(form.losses) || 0,
      },
      rank: Number(form.rank) || 0,
      isVisible: form.isVisible,
    };

    const saved = editingId
      ? await update(editingId, common)
      : await create({ ...common, slug: form.slug });

    if (saved) setModalOpen(false);
  };

  const confirmRemoval = async () => {
    if (!confirmDelete) return;
    if (await remove(confirmDelete.id)) setConfirmDelete(null);
  };

  const field =
    'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-club-yellow outline-none';

  const orphansOf = (team: TeamRecord) => countByTeam.get(team.slug) ?? 0;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-white">
            <Shield size={20} className="text-club-yellow" />
            Équipes
          </h2>
          <p className="text-sm text-white/60">
            Équipe première et catégories de jeunes ({filtered.length})
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <label htmlFor="team-search" className="sr-only">Rechercher une équipe</label>
            <input
              id="team-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nom, entraîneur…"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-xs text-white placeholder-white/40 outline-none focus:border-club-yellow"
            />
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center justify-center gap-2 rounded-full bg-club-yellow px-5 py-2.5 text-xs font-semibold text-black shadow hover:shadow-lg"
          >
            <Plus size={14} /> Nouvelle équipe
          </button>
        </div>
      </div>

      <AdminError error={error ?? actionError} onRetry={reload} />

      {loading ? (
        <AdminLoading label="Chargement des équipes…" />
      ) : filtered.length === 0 ? (
        <AdminEmpty
          label={teams.length === 0 ? 'Aucune équipe en base' : 'Aucune équipe ne correspond'}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((team) => (
            <div
              key={team.id}
              className={`overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl ${
                team.isVisible === false ? 'opacity-60' : ''
              }`}
            >
              {team.image ? (
                <img
                  src={team.image}
                  alt=""
                  onError={handleImageError}
                  className="h-36 w-full object-cover"
                />
              ) : (
                <div className="band-green flex h-36 w-full items-center justify-center text-xs text-white/70">
                  Photo à venir
                </div>
              )}
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-extrabold uppercase text-white">{team.name}</p>
                    <p className="truncate text-xs text-white/50">{team.subtitle}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-club-yellow/20 px-2 py-1 text-[10px] font-semibold text-club-yellow">
                    {CATEGORY_LABELS[team.category]}
                  </span>
                </div>

                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/50">
                  <span className="flex items-center gap-1">
                    <Users size={12} className="text-club-yellow" />
                    {orphansOf(team)} joueur(s)
                  </span>
                  {team.coach && <span>Coach · {team.coach}</span>}
                  {team.established && <span>Depuis {team.established}</span>}
                </p>

                <p className="font-mono text-[10px] text-white/30">/{team.slug}</p>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => openEdit(team)}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                  >
                    Éditer
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(team)}
                    className="rounded-full bg-red-500/30 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/40"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-graphite/90 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
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
              {editingId ? "Modifier l'équipe" : 'Nouvelle équipe'}
            </h3>

            <form onSubmit={submit} className="space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="team-name" className="mb-1 block text-white/60">Nom</label>
                  <input
                    id="team-name"
                    required
                    value={form.name}
                    onChange={(event) => onNameChange(event.target.value)}
                    placeholder="U13"
                    className={field}
                  />
                </div>
                <div>
                  <label htmlFor="team-slug" className="mb-1 block text-white/60">
                    Identifiant{' '}
                    <span className="text-white/30">
                      {editingId ? '— définitif' : "— l'adresse de l'équipe"}
                    </span>
                  </label>
                  <input
                    id="team-slug"
                    required
                    disabled={Boolean(editingId)}
                    value={form.slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setForm((f) => ({ ...f, slug: slugify(event.target.value) }));
                    }}
                    placeholder="equipe-u13"
                    className={`${field} font-mono disabled:opacity-50`}
                  />
                  <p className="mt-1 text-[11px] text-white/40">
                    {editingId
                      ? "Non modifiable : l'effectif y est rattaché."
                      : `Adresse : /teams/${form.slug || '…'}`}
                  </p>
                </div>
              </div>

              <ImageField
                value={form.image}
                onChange={(value) => setForm((f) => ({ ...f, image: value }))}
                label="Photo de l'équipe"
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="team-category" className="mb-1 block text-white/60">Catégorie</label>
                  <select
                    id="team-category"
                    value={form.category}
                    onChange={(event) =>
                      setForm((f) => ({ ...f, category: event.target.value as TeamCategory }))
                    }
                    className={field}
                  >
                    {TEAM_CATEGORIES.map((category) => (
                      <option key={category} value={category} className="bg-graphite">
                        {CATEGORY_LABELS[category]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="team-agerange" className="mb-1 block text-white/60">Tranche d’âge</label>
                  <input
                    id="team-agerange"
                    value={form.ageRange}
                    onChange={(event) => setForm((f) => ({ ...f, ageRange: event.target.value }))}
                    placeholder="11–13"
                    className={field}
                  />
                </div>
                <div>
                  <label htmlFor="team-established" className="mb-1 block text-white/60">Créée en</label>
                  <input
                    id="team-established"
                    value={form.established}
                    onChange={(event) => setForm((f) => ({ ...f, established: event.target.value }))}
                    placeholder="2005"
                    className={field}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="team-subtitle" className="mb-1 block text-white/60">
                  Sous-titre <span className="text-white/30">— sous le nom, sur la carte</span>
                </label>
                <input
                  id="team-subtitle"
                  value={form.subtitle}
                  onChange={(event) => setForm((f) => ({ ...f, subtitle: event.target.value }))}
                  placeholder="Éveil, Transition, Groupe Elite…"
                  className={field}
                />
              </div>

              <textarea
                value={form.description}
                onChange={(event) => setForm((f) => ({ ...f, description: event.target.value }))}
                placeholder="Description de l’équipe"
                rows={3}
                className={`${field} resize-none`}
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="team-coach" className="mb-1 block text-white/60">Entraîneur</label>
                  <input
                    id="team-coach"
                    value={form.coach}
                    onChange={(event) => setForm((f) => ({ ...f, coach: event.target.value }))}
                    className={field}
                  />
                </div>
                <div>
                  <label htmlFor="team-stadium" className="mb-1 block text-white/60">Terrain</label>
                  <input
                    id="team-stadium"
                    value={form.stadium}
                    onChange={(event) => setForm((f) => ({ ...f, stadium: event.target.value }))}
                    placeholder="Stade Léopold Senghor"
                    className={field}
                  />
                </div>
                <div>
                  <label htmlFor="team-training" className="mb-1 block text-white/60">Entraînements</label>
                  <input
                    id="team-training"
                    value={form.training}
                    onChange={(event) => setForm((f) => ({ ...f, training: event.target.value }))}
                    placeholder="Mar · Jeu — 16h00"
                    className={field}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="team-achievements" className="mb-1 block text-white/60">
                  Palmarès <span className="text-white/30">— une distinction par ligne</span>
                </label>
                <textarea
                  id="team-achievements"
                  value={form.achievements}
                  onChange={(event) => setForm((f) => ({ ...f, achievements: event.target.value }))}
                  placeholder={'Champion 2024\nFinale de coupe 2023'}
                  rows={3}
                  className={`${field} resize-none`}
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="mb-3 text-white/60">
                  Bilan de la saison{' '}
                  <span className="text-white/40">— affiché sur la page de l’équipe</span>
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="team-wins" className="mb-1 block text-white/60">Victoires</label>
                    <input
                      id="team-wins"
                      type="number"
                      min={0}
                      value={form.wins}
                      onChange={(event) => setForm((f) => ({ ...f, wins: event.target.value }))}
                      className={field}
                    />
                  </div>
                  <div>
                    <label htmlFor="team-draws" className="mb-1 block text-white/60">Nuls</label>
                    <input
                      id="team-draws"
                      type="number"
                      min={0}
                      value={form.draws}
                      onChange={(event) => setForm((f) => ({ ...f, draws: event.target.value }))}
                      className={field}
                    />
                  </div>
                  <div>
                    <label htmlFor="team-losses" className="mb-1 block text-white/60">Défaites</label>
                    <input
                      id="team-losses"
                      type="number"
                      min={0}
                      value={form.losses}
                      onChange={(event) => setForm((f) => ({ ...f, losses: event.target.value }))}
                      className={field}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label htmlFor="team-rank" className="mb-1 block text-white/60">
                    Ordre <span className="text-white/30">— petit nombre en tête</span>
                  </label>
                  <input
                    id="team-rank"
                    type="number"
                    value={form.rank}
                    onChange={(event) => setForm((f) => ({ ...f, rank: event.target.value }))}
                    className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-club-yellow"
                  />
                </div>
                <label className="mt-5 flex cursor-pointer select-none items-center gap-2 text-white/70">
                  <input
                    type="checkbox"
                    checked={form.isVisible}
                    onChange={(event) => setForm((f) => ({ ...f, isVisible: event.target.checked }))}
                    className="accent-club-yellow"
                  />
                  Visible sur le site
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
          title={<>Supprimer {confirmDelete.name}</>}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemoval}
          saving={saving}
        >
          {orphansOf(confirmDelete) > 0 ? (
            <p className="mb-4 text-xs text-amber-200">
              {orphansOf(confirmDelete)} fiche(s) de l’effectif sont rattachées à cette équipe.
              Elles ne seront pas supprimées, mais se retrouveront sans équipe : il faudra les
              réaffecter depuis l’Effectif. Pour retirer l’équipe du site sans y toucher,
              décochez « Visible sur le site ».
            </p>
          ) : (
            <p className="mb-4 text-xs text-white/60">
              Aucune fiche n’y est rattachée. Cette action est définitive.
            </p>
          )}
        </AdminConfirmDelete>
      )}
    </div>
  );
};

export default EquipesAdmin;
