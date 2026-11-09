import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Clapperboard, Eye, EyeOff, Plus, X } from 'lucide-react';
import useEditableResource from '../../hooks/useEditableResource';
import { heroSlides as heroApi, HeroSlideRecord } from '../../services/site/content.service';
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminFeedback';
import ImageField from '../../components/admin/ImageField';
import { ApiError } from '../../lib/api';
import { youtubeId } from '../../lib/youtube';
import { handleImageError } from '../../lib/imagePlaceholder';
import AdminConfirmDelete from '../../components/admin/AdminConfirmDelete';

const EMPTY_FORM = {
  kicker: '',
  title: '',
  image: '',
  youtube: '',
  link: '/news',
  linkLabel: 'En savoir plus',
  isVisible: true,
};

const CarrouselAdmin: React.FC = () => {
  const {
    items: slides,
    loading,
    error,
    actionError,
    saving,
    reload,
    create,
    update,
    remove,
  } = useEditableResource<HeroSlideRecord>(heroApi, { sort: 'rank created_at' });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [reorderError, setReorderError] = useState<ApiError | null>(null);

  const detectedVideo = useMemo(() => youtubeId(form.youtube), [form.youtube]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  };

  const openEdit = (slide: HeroSlideRecord) => {
    setEditingId(slide.id);
    setForm({
      kicker: slide.kicker,
      title: slide.title,
      image: slide.image ?? '',
      youtube: slide.youtube ?? '',
      link: slide.link ?? '',
      linkLabel: slide.linkLabel ?? '',
      isVisible: slide.isVisible ?? true,
    });
    setModalOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      kicker: form.kicker,
      title: form.title,
      image: form.image,
      youtube: form.youtube,
      link: form.link,
      linkLabel: form.linkLabel,
      isVisible: form.isVisible,

      ...(editingId ? {} : { rank: slides.length }),
    };

    const saved = editingId ? await update(editingId, payload) : await create(payload);
    if (saved) setModalOpen(false);
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;

    const next = [...slides];
    [next[index], next[target]] = [next[target], next[index]];

    setReordering(true);
    setReorderError(null);
    try {
      await Promise.all(
        next
          .map((slide, position) =>
            slide.rank === position ? null : heroApi.update(slide.id, { rank: position })
          )
          .filter(Boolean)
      );
      reload();
    } catch (cause) {
      setReorderError(
        cause instanceof ApiError ? cause : new ApiError(0, "L'ordre n'a pas pu être enregistré.")
      );
    } finally {
      setReordering(false);
    }
  };

  const toggleVisibility = (slide: HeroSlideRecord) =>
    update(slide.id, { isVisible: !(slide.isVisible ?? true) });

  const confirmRemoval = async () => {
    if (!confirmDelete) return;
    if (await remove(confirmDelete)) setConfirmDelete(null);
  };

  const field =
    'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-club-yellow outline-none';

  return (
    <div>
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-white">
            <Clapperboard size={20} className="text-club-yellow" />
            Carrousel de tête
          </h2>
          <p className="text-sm text-white/60">
            Photos et vidéos de la page d’accueil ({slides.length})
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-full bg-club-yellow px-5 py-2.5 text-xs font-semibold text-black shadow hover:shadow-lg"
        >
          <Plus size={14} /> Nouvelle diapositive
        </button>
      </div>

      <AdminError error={error ?? actionError ?? reorderError} onRetry={reload} />

      {loading ? (
        <AdminLoading label="Chargement du carrousel…" />
      ) : slides.length === 0 ? (
        <AdminEmpty label="Aucune diapositive enregistrée pour le moment." />
      ) : (
        <div className="space-y-3">
          {slides.map((slide, index) => {
            const videoId = slide.youtube ? youtubeId(slide.youtube) : null;
            const visible = slide.isVisible ?? true;

            return (
              <div
                key={slide.id}
                className={`flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-xl sm:flex-row sm:items-center ${
                  visible ? '' : 'opacity-60'
                }`}
              >
                <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 sm:w-36">
                  {videoId ? (
                    <img
                      src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                      alt=""
                      onError={handleImageError}
                      className="h-full w-full object-cover"
                    />
                  ) : slide.image ? (
                    <img
                      src={slide.image}
                      alt=""
                      onError={handleImageError}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="band-green flex h-full w-full items-center justify-center text-[10px] text-white/70">
                      Fond vert
                    </div>
                  )}
                  {videoId && (
                    <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                      Vidéo
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-club-yellow">
                    {slide.kicker}
                  </p>
                  <p className="line-clamp-2 font-medium text-white">{slide.title}</p>
                  <p className="mt-1 truncate text-[11px] text-white/40">
                    {slide.linkLabel} → {slide.link}
                    {slide.youtube && !videoId && (
                      <span className="ml-2 text-amber-300">
                        lien YouTube non reconnu — la photo sera affichée
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || reordering}
                    aria-label="Monter"
                    className="rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20 disabled:opacity-30"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === slides.length - 1 || reordering}
                    aria-label="Descendre"
                    className="rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20 disabled:opacity-30"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleVisibility(slide)}
                    disabled={saving}
                    title={visible ? 'Retirer de l’accueil' : 'Remettre sur l’accueil'}
                    className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/20 disabled:opacity-50"
                  >
                    {visible ? <Eye size={13} /> : <EyeOff size={13} />}
                    {visible ? 'Visible' : 'Masquée'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(slide)}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                  >
                    Éditer
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(slide.id)}
                    className="rounded-full bg-red-500/30 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/40"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
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
              {editingId ? 'Modifier la diapositive' : 'Nouvelle diapositive'}
            </h3>

            <form onSubmit={submit} className="space-y-4 text-xs">
              <div>
                <label htmlFor="hero-kicker" className="mb-1 block text-white/60">
                  Surtitre <span className="text-white/30">— au-dessus du titre, en jaune</span>
                </label>
                <input
                  id="hero-kicker"
                  required
                  value={form.kicker}
                  onChange={(event) => setForm((f) => ({ ...f, kicker: event.target.value }))}
                  placeholder="Résumé, Palmarès, Supporters…"
                  className={field}
                />
              </div>

              <div>
                <label htmlFor="hero-title" className="mb-1 block text-white/60">
                  Titre <span className="text-white/30">— trois lignes au plus à l’écran</span>
                </label>
                <textarea
                  id="hero-title"
                  required
                  value={form.title}
                  onChange={(event) => setForm((f) => ({ ...f, title: event.target.value }))}
                  rows={2}
                  placeholder="L’ASC Cambérène retrouve l’élite"
                  className={`${field} resize-none`}
                />
              </div>

              <ImageField
                value={form.image}
                onChange={(value) => setForm((f) => ({ ...f, image: value }))}
                label="Photo de fond"
              />

              <div>
                <label htmlFor="hero-youtube" className="mb-1 block text-white/60">
                  Vidéo YouTube <span className="text-white/30">— facultatif</span>
                </label>
                <input
                  id="hero-youtube"
                  value={form.youtube}
                  onChange={(event) => setForm((f) => ({ ...f, youtube: event.target.value }))}
                  placeholder="https://youtu.be/… ou l’identifiant de la vidéo"
                  className={field}
                />
                {form.youtube.trim() && (
                  detectedVideo ? (
                    <div className="mt-2 flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-2">
                      <img
                        src={`https://img.youtube.com/vi/${detectedVideo}/mqdefault.jpg`}
                        alt=""
                        onError={handleImageError}
                        className="h-12 w-20 rounded object-cover"
                      />
                      <p className="text-[11px] text-green-300">
                        Vidéo reconnue — elle passera à la place de la photo.
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-amber-300">
                      Lien non reconnu : la diapositive affichera la photo.
                    </p>
                  )
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="hero-link" className="mb-1 block text-white/60">
                    Destination du bouton
                  </label>
                  <input
                    id="hero-link"
                    value={form.link}
                    onChange={(event) => setForm((f) => ({ ...f, link: event.target.value }))}
                    placeholder="/news"
                    className={field}
                  />
                </div>
                <div>
                  <label htmlFor="hero-linklabel" className="mb-1 block text-white/60">
                    Texte du bouton
                  </label>
                  <input
                    id="hero-linklabel"
                    value={form.linkLabel}
                    onChange={(event) => setForm((f) => ({ ...f, linkLabel: event.target.value }))}
                    placeholder="Lire l’actualité"
                    className={field}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-white/70">
                <input
                  type="checkbox"
                  checked={form.isVisible}
                  onChange={(event) => setForm((f) => ({ ...f, isVisible: event.target.checked }))}
                  className="h-4 w-4 accent-club-yellow"
                />
                Afficher sur la page d’accueil
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
          title="Supprimer la diapositive"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemoval}
          saving={saving}
        >
          Confirmez-vous la suppression ? Pour la retirer de l’accueil sans perdre sa saisie, préférez « Masquée ».
        </AdminConfirmDelete>
      )}
    </div>
  );
};

export default CarrouselAdmin;
