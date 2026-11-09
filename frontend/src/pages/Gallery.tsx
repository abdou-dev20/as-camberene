import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Images } from 'lucide-react';
import { useAlbums } from '../hooks/useContent';
import { GALLERY_CATEGORIES, GALLERY_CATEGORY_LABELS, GalleryCategory } from '../types';
import { handleImageError } from '../lib/imagePlaceholder';
import { formatFullDate } from '../lib/dates';
import PageHero from '../components/ui/PageHero';
import galleryHero from '../../assets/img/asc-camberene-equipe-2025.webp';

type Tab = GalleryCategory;

const TABS: { id: Tab; label: string }[] = GALLERY_CATEGORIES.map((category) => ({
  id: category as Tab,
  label: GALLERY_CATEGORY_LABELS[category],
}));

const Gallery: React.FC = () => {
  const [tab, setTab] = useState<Tab>('match');

  const { data: albums, loading } = useAlbums();

  const visible = useMemo(
    () => albums.filter((album) => album.category === tab),
    [albums, tab]
  );

  const albumCard = (album: (typeof albums)[number]) => {
    const count = album.photoCount ?? album.photos?.length ?? 0;
    return (
      <Link
        key={String(album.id)}
        to={`/galerie/${album.id}`}
        className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-club-yellow/40"
      >
        {album.cover ? (
          <img
            src={album.cover}
            alt={album.title}
            onError={handleImageError}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-white/5 text-white/30">
            <Images size={40} />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-graphite/95 to-transparent p-4">
          <p className="font-extrabold uppercase text-white">{album.title}</p>
          <p className="text-[11px] text-white/60">
            {count} photo{count > 1 ? 's' : ''}
            {album.date ? ` · ${formatFullDate(album.date)}` : ''}
          </p>
        </div>
        <span className="absolute right-3 top-3 rounded-full bg-graphite/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
          {count}
        </span>
      </Link>
    );
  };

  return (
    <div className="bg-graphite">
      <PageHero
        kicker="En images"
        title="Galerie"
        description="Les matchs, les entraînements et les visages du club, réunis en albums."
        image={galleryHero}
      />

      <section className="site-container py-12">
        <div className="mb-8 flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-pressed={tab === item.id}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition ${
                tab === item.id
                  ? 'bg-club-yellow text-black'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="panel p-8 text-center text-sm text-white/60">Chargement des albums…</p>
        ) : visible.length === 0 ? (
          <p className="panel p-8 text-center text-sm text-white/60">
            Aucun album dans cette rubrique pour le moment.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{visible.map(albumCard)}</div>
        )}
      </section>
    </div>
  );
};

export default Gallery;
