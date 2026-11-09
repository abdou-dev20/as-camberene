import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react';
import { useAlbum } from '../hooks/useContent';
import { handleImageError } from '../lib/imagePlaceholder';
import { formatLongDate } from '../lib/dates';
import LoadingSpinner from '../components/LoadingSpinner';

const AlbumDetail: React.FC = () => {
  const { id } = useParams();
  const { data: album, loading } = useAlbum(id);
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-graphite">
        <LoadingSpinner />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="bg-graphite">
        <div className="site-container flex min-h-[60vh] flex-col items-center justify-center gap-4 py-20 text-center">
          <ImageOff size={40} className="text-white/30" />
          <p className="text-white/70">Album introuvable ou non publié.</p>
          <Link to="/galerie" className="btn-ghost">
            <ArrowLeft size={16} /> Retour à la galerie
          </Link>
        </div>
      </div>
    );
  }

  const photos = album.photos ?? [];
  const current = lightbox !== null ? photos[lightbox] : null;
  const go = (delta: number) => {
    if (lightbox === null) return;
    setLightbox((lightbox + delta + photos.length) % photos.length);
  };

  return (
    <div className="bg-graphite">
      <section className="relative">
        <div className="relative h-[42vh] min-h-[280px] overflow-hidden">
          {(album.cover || photos[0]?.image) && (
            <img
              src={album.cover || photos[0]?.image}
              alt={album.title}
              onError={handleImageError}
              className="h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-graphite via-graphite/70 to-graphite/30" />
          <div className="site-container absolute inset-x-0 bottom-0 pb-8">
            <Link to="/galerie" className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-club-yellow hover:underline">
              <ArrowLeft size={14} /> Galerie
            </Link>
            <h1 className="text-3xl font-extrabold uppercase text-white md:text-5xl">{album.title}</h1>
            <p className="mt-2 text-sm text-white/60">
              {photos.length} photo{photos.length > 1 ? 's' : ''}
              {album.date ? ` · ${formatLongDate(album.date)}` : ''}
            </p>
          </div>
        </div>
      </section>

      <section className="site-container py-12">
        {album.description && (
          <p className="mb-8 max-w-3xl text-sm text-white/70">{album.description}</p>
        )}

        {photos.length === 0 ? (
          <p className="panel p-8 text-center text-sm text-white/60">
            Aucune photo dans cet album pour le moment.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo, index) => (
              <button
                key={String(photo.id)}
                type="button"
                onClick={() => setLightbox(index)}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-left transition hover:border-club-yellow/40"
              >
                <img
                  src={photo.image}
                  alt={photo.title}
                  onError={handleImageError}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-graphite/95 to-transparent p-4">
                  <p className="text-sm font-semibold text-white">{photo.title}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {current && lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-graphite/95 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Fermer"
            className="absolute right-6 top-6 text-white/70 hover:text-white"
          >
            <X size={24} />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); go(-1); }}
                aria-label="Photo précédente"
                className="absolute left-4 text-white/70 hover:text-white md:left-8"
              >
                <ChevronLeft size={36} />
              </button>
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); go(1); }}
                aria-label="Photo suivante"
                className="absolute right-4 text-white/70 hover:text-white md:right-8"
              >
                <ChevronRight size={36} />
              </button>
            </>
          )}

          <figure className="max-h-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
            <img
              src={current.image}
              alt={current.title}
              onError={handleImageError}
              className="max-h-[75vh] w-full rounded-2xl object-contain"
            />
            <figcaption className="mt-4 text-center">
              <p className="text-lg font-extrabold uppercase text-white">{current.title}</p>
              {current.description && <p className="mt-1 text-sm text-white/70">{current.description}</p>}
              <p className="mt-1 text-xs text-white/40">
                {lightbox + 1} / {photos.length}
              </p>
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
};

export default AlbumDetail;
