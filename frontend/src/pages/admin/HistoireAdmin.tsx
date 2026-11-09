import React, { useMemo, useState } from 'react';
import { Landmark, Plus, Search, X } from 'lucide-react';
import useEditableResource from '../../hooks/useEditableResource';
import { history as historyApi, HistoryEventRecord } from '../../services/site/content.service';
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminFeedback';
import ImageField from '../../components/admin/ImageField';
import AdminConfirmDelete from '../../components/admin/AdminConfirmDelete';

const toLines = (values: string[] = []): string => values.join('\n');
const fromLines = (value: string): string[] =>
  value.split('\n').map((line) => line.trim()).filter(Boolean);

const EMPTY_FORM = {
  year: String(new Date().getFullYear()),
  dateLabel: '',
  title: '',
  description: '',
  phase: '',
  tags: '',
  image: '',
};

const HistoireAdmin: React.FC = () => {
  const {
    items: events,
    loading,
    error,
    actionError,
    saving,
    reload,
    create,
    update,
    remove,
  } = useEditableResource<HistoryEventRecord>(historyApi);

  const [query, setQuery] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const phases = useMemo(
    () => Array.from(new Set(events.map((event) => event.phase).filter(Boolean))) as string[],
    [events]
  );

  const filtered = useMemo(
    () =>
      events
        .filter((event) => {
          const needle = query.trim().toLowerCase();
          const matchesQuery =
            !needle ||
            event.title.toLowerCase().includes(needle) ||
            (event.description ?? '').toLowerCase().includes(needle) ||
            String(event.year).includes(needle);
          const matchesPhase = !phaseFilter || event.phase === phaseFilter;
          return matchesQuery && matchesPhase;
        })
        .sort((a, b) => a.year - b.year),
    [events, query, phaseFilter]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (event: HistoryEventRecord) => {
    setEditingId(event.id);
    setForm({
      year: String(event.year),
      dateLabel: event.dateLabel ?? '',
      title: event.title,
      description: event.description ?? '',
      phase: event.phase ?? '',
      tags: toLines(event.tags),
      image: event.image ?? '',
    });
    setModalOpen(true);
  };

  const submit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();

    const payload = {
      year: Number(form.year),
      dateLabel: form.dateLabel,
      title: form.title,
      description: form.description,
      phase: form.phase,
      tags: fromLines(form.tags),
      image: form.image,
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
            <Landmark size={20} className="text-club-yellow" />
            Histoire
          </h2>
          <p className="text-sm text-white/60">Étapes de la frise ({filtered.length})</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <label htmlFor="history-search" className="sr-only">Rechercher une étape</label>
            <input
              id="history-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Recherche étape ou année…"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-xs text-white placeholder-white/40 outline-none focus:border-club-yellow"
            />
          </div>
          <label htmlFor="history-phase" className="sr-only">Filtrer par phase</label>
          <select
            id="history-phase"
            value={phaseFilter}
            onChange={(event) => setPhaseFilter(event.target.value)}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-club-yellow"
          >
            <option value="">Toutes phases</option>
            {phases.map((phase) => (
              <option key={phase} value={phase} className="bg-graphite">{phase}</option>
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
        <AdminLoading label="Chargement de la frise…" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-white/60">
              <tr>
                <th className="px-4 py-3 text-left">Année</th>
                <th className="px-4 py-3 text-left">Étape</th>
                <th className="px-4 py-3 text-left">Phase</th>
                <th className="px-4 py-3 text-left">Visuel</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/70">
              {filtered.map((event) => (
                <tr key={event.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <p className="font-mono font-semibold text-club-yellow">{event.year}</p>
                    {event.dateLabel && (
                      <p className="text-[11px] text-white/40">{event.dateLabel}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="line-clamp-1 font-medium text-white">{event.title}</p>
                    <p className="line-clamp-1 text-xs text-white/40">{event.description}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {event.phase ? (
                      <span className="rounded-full bg-club-yellow/20 px-2 py-1 text-[10px] font-semibold text-club-yellow">
                        {event.phase}
                      </span>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {event.image ? (
                      <span className="text-green-300">Oui</span>
                    ) : (
                      <span className="text-white/30">À venir</span>
                    )}
                  </td>
                  <td className="space-x-2 whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(event)}
                      className="rounded-full bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                    >
                      Éditer
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(event.id)}
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
                        events.length === 0
                          ? 'Aucune étape en base'
                          : 'Aucune étape ne correspond à la recherche'
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
              {editingId ? "Modifier l'étape" : 'Nouvelle étape'}
            </h3>

            <form onSubmit={submit} className="space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="history-year" className="mb-1 block text-white/60">Année</label>
                  <input
                    id="history-year"
                    type="number"
                    required
                    min={1800}
                    max={new Date().getFullYear() + 5}
                    value={form.year}
                    onChange={(event) => setForm((f) => ({ ...f, year: event.target.value }))}
                    className={field}
                  />
                </div>
                <div>
                  <label htmlFor="history-datelabel" className="mb-1 block text-white/60">
                    Précision <span className="text-white/30">— facultatif</span>
                  </label>
                  <input
                    id="history-datelabel"
                    value={form.dateLabel}
                    onChange={(event) => setForm((f) => ({ ...f, dateLabel: event.target.value }))}
                    placeholder="Mai 1974"
                    className={field}
                  />
                </div>
              </div>

              <input
                required
                value={form.title}
                onChange={(event) => setForm((f) => ({ ...f, title: event.target.value }))}
                placeholder="Titre de l'étape"
                className={field}
              />

              <textarea
                value={form.description}
                onChange={(event) => setForm((f) => ({ ...f, description: event.target.value }))}
                placeholder="Description"
                rows={4}
                className={`${field} resize-none`}
              />

              <div>
                <label htmlFor="history-phase-input" className="mb-1 block text-white/60">
                  Phase <span className="text-white/30">— regroupe les étapes</span>
                </label>
                <input
                  id="history-phase-input"
                  list="history-phases"
                  value={form.phase}
                  onChange={(event) => setForm((f) => ({ ...f, phase: event.target.value }))}
                  placeholder="Fondation, Expansion, Modernisation…"
                  className={field}
                />
                <datalist id="history-phases">
                  {phases.map((phase) => (
                    <option key={phase} value={phase} />
                  ))}
                </datalist>
              </div>

              <textarea
                value={form.tags}
                onChange={(event) => setForm((f) => ({ ...f, tags: event.target.value }))}
                placeholder="Mots-clés — un par ligne"
                rows={3}
                className={`${field} resize-none`}
              />

              <ImageField
                value={form.image}
                onChange={(value) => setForm((f) => ({ ...f, image: value }))}
                label="Visuel de l'étape"
              />

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
          title="Supprimer l'étape"
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

export default HistoireAdmin;
