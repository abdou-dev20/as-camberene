import React, { useMemo, useState } from 'react';
import { ChevronLeft, FolderOpen, Images, Layers, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import useEditableResource from '../../hooks/useEditableResource';
import {
  albums as albumsApi,
  AlbumRecord,
  gallery as galleryApi,
  GalleryItemRecord,
} from '../../services/site/content.service';
import { useMatches } from '../../hooks/useContent';
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminFeedback';
import ImageField from '../../components/admin/ImageField';
import { IMAGE_PLACEHOLDER, handleImageError } from '../../lib/imagePlaceholder';
import { formatShortDate } from '../../lib/dates';
import { GALLERY_CATEGORIES, GALLERY_CATEGORY_LABELS, GalleryCategory } from '../../types';

const EMPTY_ALBUM = {
  title: '',
  description: '',
  cover: '',
  category: 'match' as GalleryCategory,
  match: '',
  date: '',
};

const EMPTY_PHOTO = {
  image: '',
  title: '',
  description: '',
  album: '',
};

const GalerieAdmin: React.FC = () => {
  const albumResource = useEditableResource<AlbumRecord>(albumsApi);
  const photoResource = useEditableResource<GalleryItemRecord>(galleryApi);
  const { data: matches } = useMatches();

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null);

  const [albumModal, setAlbumModal] = useState(false);
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [albumForm, setAlbumForm] = useState(EMPTY_ALBUM);
  const [confirmAlbumDelete, setConfirmAlbumDelete] = useState<string | null>(null);

  const [photoModal, setPhotoModal] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [photoForm, setPhotoForm] = useState(EMPTY_PHOTO);
  const [confirmPhotoDelete, setConfirmPhotoDelete] = useState<string | null>(null);

  const matchOptions = useMemo(
    () => [...matches].sort((a, b) => b.date.localeCompare(a.date)),
    [matches]
  );

  const openAlbum = albumResource.items.find((album) => String(album.id) === openAlbumId) ?? null;

  const albumPhotos = useMemo(
    () => photoResource.items.filter((photo) => String(photo.album) === openAlbumId),
    [photoResource.items, openAlbumId]
  );

  const filteredAlbums = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return albumResource.items.filter((album) => {
      const matchesQuery =
        !needle ||
        album.title.toLowerCase().includes(needle) ||
        (album.description ?? '').toLowerCase().includes(needle);
      return matchesQuery && (!categoryFilter || album.category === categoryFilter);
    });
  }, [albumResource.items, query, categoryFilter]);

  const field =
    'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-club-yellow outline-none';

  const openCreateAlbum = () => {
    setEditingAlbumId(null);
    setAlbumForm({ ...EMPTY_ALBUM });
    setAlbumModal(true);
  };

  const openEditAlbum = (album: AlbumRecord) => {
    setEditingAlbumId(album.id);
    setAlbumForm({
      title: album.title,
      description: album.description ?? '',
      cover: album.cover ?? '',
      category: album.category,
      match: album.match ?? '',
      date: album.date ?? '',
    });
    setAlbumModal(true);
  };

  const submitAlbum = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      title: albumForm.title,
      description: albumForm.description,
      cover: albumForm.cover,
      category: albumForm.category,
      match: albumForm.category === 'match' && albumForm.match ? albumForm.match : null,
      date: albumForm.date,
    };
    const saved = editingAlbumId
      ? await albumResource.update(editingAlbumId, payload)
      : await albumResource.create(payload);
    if (saved) setAlbumModal(false);
  };

  const confirmAlbumRemoval = async () => {
    if (!confirmAlbumDelete) return;
    if (await albumResource.remove(confirmAlbumDelete)) setConfirmAlbumDelete(null);
  };

  const [grouping, setGrouping] = useState(false);
  const [groupMessage, setGroupMessage] = useState('');

  const groupByTitle = async () => {
    setGrouping(true);
    setGroupMessage('');
    try {
      const groups = new Map<string, GalleryItemRecord[]>();
      for (const photo of photoResource.items) {
        const key = `${photo.category}|${photo.title.trim().toLowerCase()}`;
        const bucket = groups.get(key);
        if (bucket) bucket.push(photo);
        else groups.set(key, [photo]);
      }

      let created = 0;
      let moved = 0;
      for (const photos of groups.values()) {
        const first = photos[0];
        const title = first.title.trim();
        let album: AlbumRecord | null =
          albumResource.items.find(
            (candidate) =>
              candidate.category === first.category &&
              candidate.title.trim().toLowerCase() === title.toLowerCase()
          ) ?? null;
        if (!album) {
          album = await albumResource.create({
            title,
            description: '',
            cover: first.image,
            category: first.category,
            match: first.category === 'match' ? first.match ?? null : null,
            date: first.date ?? '',
          });
          if (!album) throw new Error('create');
          created += 1;
        }
        for (const photo of photos) {
          if (String(photo.album ?? '') === String(album.id)) continue;
          await photoResource.update(photo.id, {
            image: photo.image,
            title: photo.title,
            description: photo.description ?? '',
            category: first.category,
            album: album.id,
            match: first.category === 'match' ? first.match ?? null : null,
            date: first.date ?? '',
          });
          moved += 1;
        }
      }
      setGroupMessage(
        `Regroupement terminé : ${created} album${created > 1 ? 's' : ''} créé${
          created > 1 ? 's' : ''
        }, ${moved} photo${moved > 1 ? 's' : ''} déplacée${moved > 1 ? 's' : ''}.`
      );
    } catch {
      setGroupMessage("Le regroupement a échoué. Réessayez.");
    } finally {
      setGrouping(false);
    }
  };

  const openCreatePhoto = () => {
    setEditingPhotoId(null);
    setPhotoForm({ ...EMPTY_PHOTO, album: openAlbumId ?? '' });
    setPhotoModal(true);
  };

  const openEditPhoto = (photo: GalleryItemRecord) => {
    setEditingPhotoId(photo.id);
    setPhotoForm({
      image: photo.image ?? '',
      title: photo.title,
      description: photo.description ?? '',
      album: photo.album ?? '',
    });
    setPhotoModal(true);
  };

  const submitPhoto = async (event: React.FormEvent) => {
    event.preventDefault();
    const targetAlbum =
      albumResource.items.find((album) => String(album.id) === photoForm.album) ?? openAlbum;
    if (!targetAlbum) return;
    const payload = {
      image: photoForm.image,
      title: photoForm.title,
      description: photoForm.description,
      category: targetAlbum.category,
      album: targetAlbum.id,
      match: targetAlbum.category === 'match' ? targetAlbum.match ?? null : null,
      date: targetAlbum.date ?? '',
    };
    const saved = editingPhotoId
      ? await photoResource.update(editingPhotoId, payload)
      : await photoResource.create(payload);
    if (saved) setPhotoModal(false);
  };

  const confirmPhotoRemoval = async () => {
    if (!confirmPhotoDelete) return;
    if (await photoResource.remove(confirmPhotoDelete)) setConfirmPhotoDelete(null);
  };

  const saving = albumResource.saving || photoResource.saving;

  if (openAlbum) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpenAlbumId(null)}
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-club-yellow hover:underline"
        >
          <ChevronLeft size={14} /> Tous les albums
        </button>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-white">
              <FolderOpen size={20} className="text-club-yellow" /> {openAlbum.title}
            </h2>
            <p className="text-sm text-white/60">
              {albumPhotos.length} photo{albumPhotos.length > 1 ? 's' : ''} ·{' '}
              {GALLERY_CATEGORY_LABELS[openAlbum.category]}
              {openAlbum.date ? ` · ${formatShortDate(openAlbum.date)}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreatePhoto}
            className="flex items-center justify-center gap-2 rounded-full bg-club-yellow px-5 py-2.5 text-xs font-semibold text-black shadow"
          >
            <Plus size={14} /> Ajouter une photo
          </button>
        </div>

        <AdminError error={photoResource.error ?? photoResource.actionError} onRetry={photoResource.reload} />

        {photoResource.loading && photoResource.items.length === 0 ? (
          <AdminLoading label="Chargement des photos…" />
        ) : albumPhotos.length === 0 ? (
          <AdminEmpty label="Aucune photo dans cet album. Ajoutez-en une." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {albumPhotos.map((photo) => (
              <div
                key={photo.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"
              >
                <img
                  src={photo.image || IMAGE_PLACEHOLDER}
                  alt=""
                  onError={handleImageError}
                  className="h-40 w-full object-cover"
                />
                <div className="space-y-2 p-4">
                  <p className="line-clamp-1 font-medium text-white">{photo.title}</p>
                  {photo.description && (
                    <p className="line-clamp-2 text-xs text-white/50">{photo.description}</p>
                  )}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => openEditPhoto(photo)}
                      className="rounded-full bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                    >
                      Éditer
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmPhotoDelete(photo.id)}
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

        {photoModal && (
          <Modal title={editingPhotoId ? 'Modifier la photo' : 'Ajouter une photo'} onClose={() => setPhotoModal(false)}>
            <form onSubmit={submitPhoto} className="space-y-4 text-xs">
              <ImageField
                value={photoForm.image}
                onChange={(value) => setPhotoForm((f) => ({ ...f, image: value }))}
                label="Photo"
              />
              <div>
                <label htmlFor="photo-title" className="mb-1 block text-white/60">Titre</label>
                <input
                  id="photo-title"
                  required
                  value={photoForm.title}
                  onChange={(event) => setPhotoForm((f) => ({ ...f, title: event.target.value }))}
                  placeholder="Le but de la victoire"
                  className={field}
                />
              </div>
              <div>
                <label htmlFor="photo-album" className="mb-1 block text-white/60">Album</label>
                <select
                  id="photo-album"
                  value={photoForm.album}
                  onChange={(event) => setPhotoForm((f) => ({ ...f, album: event.target.value }))}
                  className={field}
                >
                  <option value="" className="bg-graphite">Aucun album</option>
                  {albumResource.items
                    .filter((album) => album.category === (openAlbum?.category ?? album.category))
                    .map((album) => (
                      <option key={String(album.id)} value={String(album.id)} className="bg-graphite">
                        {album.title}
                        {album.date ? ` · ${formatShortDate(album.date)}` : ''}
                      </option>
                    ))}
                </select>
              </div>
              <textarea
                value={photoForm.description}
                onChange={(event) => setPhotoForm((f) => ({ ...f, description: event.target.value }))}
                placeholder="Légende de la photo"
                rows={3}
                className={`${field} resize-none`}
              />
              {photoResource.actionError && (
                <p className="text-red-300">{photoResource.actionError.fullMessage}</p>
              )}
              <ModalActions
                saving={saving}
                onCancel={() => setPhotoModal(false)}
                submitLabel={editingPhotoId ? 'Mettre à jour' : 'Ajouter'}
              />
            </form>
          </Modal>
        )}

        {confirmPhotoDelete && (
          <ConfirmDialog
            title="Supprimer la photo"
            message="Confirmez-vous la suppression de cette photo ? Cette action est définitive."
            saving={saving}
            onCancel={() => setConfirmPhotoDelete(null)}
            onConfirm={confirmPhotoRemoval}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-white">
            <Images size={20} className="text-club-yellow" />
            Albums photo
          </h2>
          <p className="text-sm text-white/60">Albums du club ({filteredAlbums.length})</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <label htmlFor="album-search" className="sr-only">Rechercher un album</label>
            <input
              id="album-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Titre, description…"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-xs text-white placeholder-white/40 outline-none focus:border-club-yellow"
            />
          </div>
          <button
            type="button"
            onClick={groupByTitle}
            disabled={grouping || photoResource.items.length === 0}
            className="flex items-center justify-center gap-2 rounded-full border border-club-yellow/40 bg-white/5 px-5 py-2.5 text-xs font-semibold text-club-yellow hover:bg-white/10 disabled:opacity-50"
          >
            <Layers size={14} /> {grouping ? 'Regroupement…' : 'Regrouper par titre'}
          </button>
          <button
            type="button"
            onClick={openCreateAlbum}
            className="flex items-center justify-center gap-2 rounded-full bg-club-yellow px-5 py-2.5 text-xs font-semibold text-black shadow hover:shadow-lg"
          >
            <Plus size={14} /> Nouvel album
          </button>
        </div>
      </div>

      {groupMessage && (
        <p className="mb-4 rounded-lg border border-club-yellow/30 bg-club-yellow/10 px-4 py-2 text-xs text-club-yellow">
          {groupMessage}
        </p>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategoryFilter('')}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
            categoryFilter === '' ? 'bg-club-yellow text-black' : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          Tous ({albumResource.items.length})
        </button>
        {GALLERY_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setCategoryFilter(category)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              categoryFilter === category
                ? 'bg-club-yellow text-black'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {GALLERY_CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      <AdminError error={albumResource.error ?? albumResource.actionError} onRetry={albumResource.reload} />

      {albumResource.loading && albumResource.items.length === 0 ? (
        <AdminLoading label="Chargement des albums…" />
      ) : filteredAlbums.length === 0 ? (
        <AdminEmpty
          label={albumResource.items.length === 0 ? 'Aucun album en base' : 'Aucun album ne correspond'}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAlbums.map((album) => (
            <div
              key={album.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"
            >
              <button
                type="button"
                onClick={() => setOpenAlbumId(String(album.id))}
                className="block w-full text-left"
              >
                <img
                  src={album.cover || IMAGE_PLACEHOLDER}
                  alt=""
                  onError={handleImageError}
                  className="h-40 w-full object-cover"
                />
              </button>
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenAlbumId(String(album.id))}
                    className="line-clamp-1 text-left font-medium text-white hover:text-club-yellow"
                  >
                    {album.title}
                  </button>
                  <span className="shrink-0 rounded-full bg-club-yellow/20 px-2 py-1 text-[10px] font-semibold text-club-yellow">
                    {GALLERY_CATEGORY_LABELS[album.category]}
                  </span>
                </div>
                <p className="text-[11px] text-white/40">
                  {album.photoCount ?? 0} photo{(album.photoCount ?? 0) > 1 ? 's' : ''}
                  {album.date ? ` · ${formatShortDate(album.date)}` : ''}
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpenAlbumId(String(album.id))}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                  >
                    Photos
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditAlbum(album)}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmAlbumDelete(album.id)}
                    className="rounded-full bg-red-500/30 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/40"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {albumModal && (
        <Modal title={editingAlbumId ? "Modifier l'album" : 'Nouvel album'} onClose={() => setAlbumModal(false)}>
          <form onSubmit={submitAlbum} className="space-y-4 text-xs">
            <ImageField
              value={albumForm.cover}
              onChange={(value) => setAlbumForm((f) => ({ ...f, cover: value }))}
              label="Photo de couverture"
            />
            <div>
              <label htmlFor="album-title" className="mb-1 block text-white/60">Titre</label>
              <input
                id="album-title"
                required
                value={albumForm.title}
                onChange={(event) => setAlbumForm((f) => ({ ...f, title: event.target.value }))}
                placeholder="Match contre Oslo"
                className={field}
              />
            </div>
            <textarea
              value={albumForm.description}
              onChange={(event) => setAlbumForm((f) => ({ ...f, description: event.target.value }))}
              placeholder="Description de l’album"
              rows={3}
              className={`${field} resize-none`}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="album-category" className="mb-1 block text-white/60">Onglet</label>
                <select
                  id="album-category"
                  value={albumForm.category}
                  onChange={(event) =>
                    setAlbumForm((f) => ({ ...f, category: event.target.value as GalleryCategory }))
                  }
                  className={field}
                >
                  {GALLERY_CATEGORIES.map((category) => (
                    <option key={category} value={category} className="bg-graphite">
                      {GALLERY_CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="album-date" className="mb-1 block text-white/60">
                  Date <span className="text-white/30">— facultatif</span>
                </label>
                <input
                  id="album-date"
                  type="date"
                  value={albumForm.date}
                  onChange={(event) => setAlbumForm((f) => ({ ...f, date: event.target.value }))}
                  className={field}
                />
              </div>
            </div>

            {albumForm.category === 'match' && (
              <div>
                <label htmlFor="album-match" className="mb-1 block text-white/60">
                  Rencontre <span className="text-white/30">— facultatif</span>
                </label>
                <select
                  id="album-match"
                  value={albumForm.match}
                  onChange={(event) => setAlbumForm((f) => ({ ...f, match: event.target.value }))}
                  className={field}
                >
                  <option value="" className="bg-graphite">Aucune rencontre</option>
                  {matchOptions.map((match) => (
                    <option key={String(match.id)} value={String(match.id)} className="bg-graphite">
                      {match.venue === 'Domicile'
                        ? `ASC Cambérène — ${match.opponent}`
                        : `${match.opponent} — ASC Cambérène`}{' '}
                      · {formatShortDate(match.date)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {albumResource.actionError && (
              <p className="text-red-300">{albumResource.actionError.fullMessage}</p>
            )}
            <ModalActions
              saving={saving}
              onCancel={() => setAlbumModal(false)}
              submitLabel={editingAlbumId ? 'Mettre à jour' : 'Créer'}
            />
          </form>
        </Modal>
      )}

      {confirmAlbumDelete && (
        <ConfirmDialog
          title="Supprimer l'album"
          message="Les photos resteront dans la galerie mais seront détachées de cet album. Confirmez-vous ?"
          saving={saving}
          onCancel={() => setConfirmAlbumDelete(null)}
          onConfirm={confirmAlbumRemoval}
        />
      )}
    </div>
  );
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({
  title,
  onClose,
  children,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-graphite/90 backdrop-blur-sm" onClick={onClose} />
    <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.05] p-6">
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="absolute right-3 top-3 text-white/60 hover:text-white"
      >
        <X size={16} />
      </button>
      <h3 className="mb-4 text-lg font-semibold text-white">{title}</h3>
      {children}
    </div>
  </div>
);

const ModalActions: React.FC<{
  saving: boolean;
  onCancel: () => void;
  submitLabel: string;
}> = ({ saving, onCancel, submitLabel }) => (
  <div className="flex justify-end gap-3 pt-2">
    <button
      type="button"
      onClick={onCancel}
      className="rounded-full bg-white/5 px-4 py-2 text-white/70 hover:bg-white/10"
    >
      Annuler
    </button>
    <button
      type="submit"
      disabled={saving}
      className="rounded-full bg-club-yellow px-5 py-2 font-semibold text-black disabled:opacity-60"
    >
      {saving ? 'Enregistrement…' : submitLabel}
    </button>
  </div>
);

const ConfirmDialog: React.FC<{
  title: string;
  message: string;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ title, message, saving, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-graphite/90 backdrop-blur-sm" onClick={onCancel} />
    <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.05] p-6">
      <h4 className="mb-2 text-sm font-semibold text-white">{title}</h4>
      <p className="mb-4 text-xs text-white/60">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full bg-white/5 px-4 py-1.5 text-xs text-white/70 hover:bg-white/10"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={saving}
          className="rounded-full bg-red-500/30 px-4 py-1.5 text-xs text-red-200 hover:bg-red-500/40 disabled:opacity-60"
        >
          {saving ? 'Suppression…' : 'Supprimer'}
        </button>
      </div>
    </div>
  </div>
);

export default GalerieAdmin;
