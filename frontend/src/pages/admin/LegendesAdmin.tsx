import React, { useMemo, useState } from 'react';
import { Crown, Plus, Search, X } from 'lucide-react';
import useEditableResource from '../../hooks/useEditableResource';
import { legends as legendsApi, LegendRecord } from '../../services/site/content.service';
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminFeedback';
import ImageField from '../../components/admin/ImageField';
import { LEGEND_ERAS, LegendEra } from '../../types';
import AdminConfirmDelete from '../../components/admin/AdminConfirmDelete';

const toLines = (values: string[] = []): string => values.join('\n');
const fromLines = (value: string): string[] =>
  value.split('\n').map((line) => line.trim()).filter(Boolean);

const EMPTY_FORM = {
  name: '',
  position: '',
  period: '',
  nationality: '',
  photo: '',
  jerseyNumber: '',
  era: 'Modern Era' as LegendEra,
  isHallOfFame: false,
  matches: '',
  goals: '',
  assists: '',
  trophies: '',
  achievements: '',
  biography: '',
  quote: '',
  rank: '',
};

const toNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const LegendesAdmin: React.FC = () => {
  const {
    items: legends,
    loading,
    error,
    actionError,
    saving,
    reload,
    create,
    update,
    remove,
  } = useEditableResource<LegendRecord>(legendsApi);

  const [query, setQuery] = useState('');
  const [eraFilter, setEraFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      legends
        .filter((legend) => {
          const needle = query.trim().toLowerCase();
          const matchesQuery =
            !needle ||
            legend.name.toLowerCase().includes(needle) ||
            (legend.position ?? '').toLowerCase().includes(needle) ||
            (legend.period ?? '').toLowerCase().includes(needle);
          const matchesEra = !eraFilter || legend.era === eraFilter;
          return matchesQuery && matchesEra;
        })
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0) || a.name.localeCompare(b.name)),
    [legends, query, eraFilter]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (legend: LegendRecord) => {
    setEditingId(legend.id);
    setForm({
      name: legend.name,
      position: legend.position ?? '',
      period: legend.period ?? '',
      nationality: legend.nationality ?? '',
      photo: legend.photo ?? '',
      jerseyNumber: String(legend.jerseyNumber ?? ''),
      era: legend.era,
      isHallOfFame: Boolean(legend.isHallOfFame),
      matches: String(legend.stats?.matches ?? ''),
      goals: String(legend.stats?.goals ?? ''),
      assists: String(legend.stats?.assists ?? ''),
      trophies: String(legend.stats?.trophies ?? ''),
      achievements: toLines(legend.achievements),
      biography: legend.biography ?? '',
      quote: legend.quote ?? '',
      rank: String(legend.rank ?? ''),
    });
    setModalOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      name: form.name,
      position: form.position,
      period: form.period,
      nationality: form.nationality,
      photo: form.photo,
      jerseyNumber: toNumber(form.jerseyNumber),
      era: form.era,
      isHallOfFame: form.isHallOfFame,
      stats: {
        matches: toNumber(form.matches),
        goals: toNumber(form.goals),
        assists: toNumber(form.assists),
        trophies: toNumber(form.trophies),
      },
      achievements: fromLines(form.achievements),
      biography: form.biography,
      quote: form.quote,
      rank: toNumber(form.rank),
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
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-white">
            <Crown size={20} className="text-club-yellow" />
            Légendes
          </h2>
          <p className="text-sm text-white/60">Hall of Fame ({filtered.length})</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <label htmlFor="legend-search" className="sr-only">Rechercher une légende</label>
            <input
              id="legend-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Recherche légende…"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-xs text-white placeholder-white/40 outline-none focus:border-club-yellow"
            />
          </div>
          <label htmlFor="legend-era" className="sr-only">Filtrer par époque</label>
          <select
            id="legend-era"
            value={eraFilter}
            onChange={(event) => setEraFilter(event.target.value)}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-club-yellow"
          >
            <option value="">Toutes époques</option>
            {LEGEND_ERAS.map((era) => (
              <option key={era} value={era} className="bg-graphite">{era}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center justify-center gap-2 rounded-full bg-club-yellow px-5 py-2.5 text-xs font-semibold text-black shadow hover:shadow-lg"
          >
            <Plus size={14} /> Nouvelle
          </button>
        </div>
      </div>

      <AdminError error={error ?? actionError} onRetry={reload} />

      {loading ? (
        <AdminLoading label="Chargement des légendes…" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-white/60">
              <tr>
                <th className="px-4 py-3 text-left">Légende</th>
                <th className="px-4 py-3 text-left">Époque</th>
                <th className="px-4 py-3 text-left">Statistiques</th>
                <th className="px-4 py-3 text-left">Hall of Fame</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/70">
              {filtered.map((legend) => (
                <tr key={legend.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <p className="line-clamp-1 font-medium text-white">
                      {legend.jerseyNumber ? `#${legend.jerseyNumber} ` : ''}{legend.name}
                    </p>
                    <p className="line-clamp-1 text-xs text-white/40">
                      {[legend.position, legend.period].filter(Boolean).join(' · ')}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-club-yellow/20 px-2 py-1 text-[10px] font-semibold text-club-yellow">
                      {legend.era}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {legend.stats?.matches ?? 0} m · {legend.stats?.goals ?? 0} b ·{' '}
                    {legend.stats?.trophies ?? 0} tr
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {legend.isHallOfFame ? (
                      <span className="rounded-full bg-green-500/20 px-2 py-1 text-[10px] font-semibold text-green-300">
                        Oui
                      </span>
                    ) : (
                      <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/70">
                        Non
                      </span>
                    )}
                  </td>
                  <td className="space-x-2 whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(legend)}
                      className="rounded-full bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                    >
                      Éditer
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(legend.id)}
                      className="rounded-full bg-red-500/30 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/40"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-0">
                    <AdminEmpty
                      label={
                        legends.length === 0
                          ? 'Aucune légende en base'
                          : 'Aucune légende ne correspond à la recherche'
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
              {editingId ? 'Modifier la légende' : 'Nouvelle légende'}
            </h3>

            <form onSubmit={submit} className="space-y-4 text-xs">
              <input
                required
                value={form.name}
                onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
                placeholder="Nom complet"
                className={field}
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  value={form.position}
                  onChange={(event) => setForm((f) => ({ ...f, position: event.target.value }))}
                  placeholder="Poste"
                  className={field}
                />
                <input
                  value={form.period}
                  onChange={(event) => setForm((f) => ({ ...f, period: event.target.value }))}
                  placeholder="Période (1985-1997)"
                  className={field}
                />
                <input
                  value={form.nationality}
                  onChange={(event) => setForm((f) => ({ ...f, nationality: event.target.value }))}
                  placeholder="Nationalité"
                  className={field}
                />
              </div>

              <ImageField
                value={form.photo}
                onChange={(value) => setForm((f) => ({ ...f, photo: value }))}
                label="Portrait"
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={form.jerseyNumber}
                  onChange={(event) => setForm((f) => ({ ...f, jerseyNumber: event.target.value }))}
                  placeholder="Numéro"
                  className={field}
                />
                <select
                  value={form.era}
                  onChange={(event) => setForm((f) => ({ ...f, era: event.target.value as LegendEra }))}
                  className={field}
                >
                  {LEGEND_ERAS.map((era) => (
                    <option key={era} value={era} className="bg-graphite">{era}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  value={form.rank}
                  onChange={(event) => setForm((f) => ({ ...f, rank: event.target.value }))}
                  placeholder="Ordre d'affichage"
                  className={field}
                />
              </div>

              <fieldset>
                <legend className="mb-2 text-white/60">Statistiques en club</legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {([
                    ['matches', 'Matchs'],
                    ['goals', 'Buts'],
                    ['assists', 'Passes'],
                    ['trophies', 'Trophées'],
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

              <textarea
                value={form.achievements}
                onChange={(event) => setForm((f) => ({ ...f, achievements: event.target.value }))}
                placeholder="Palmarès — une ligne par titre"
                rows={3}
                className={`${field} resize-none`}
              />
              <textarea
                value={form.quote}
                onChange={(event) => setForm((f) => ({ ...f, quote: event.target.value }))}
                placeholder="Citation"
                rows={2}
                className={`${field} resize-none`}
              />
              <textarea
                value={form.biography}
                onChange={(event) => setForm((f) => ({ ...f, biography: event.target.value }))}
                placeholder="Biographie"
                rows={5}
                className={`${field} resize-none`}
              />

              <label className="flex cursor-pointer select-none items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isHallOfFame}
                  onChange={(event) => setForm((f) => ({ ...f, isHallOfFame: event.target.checked }))}
                  className="accent-club-yellow"
                />
                <span>Membre du Hall of Fame</span>
              </label>

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
          title="Supprimer la légende"
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

export default LegendesAdmin;
