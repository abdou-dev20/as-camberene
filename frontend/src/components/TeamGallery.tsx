import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Images, Minus, Plus } from 'lucide-react';
import SectionHeader from './ui/SectionHeader';
import { useAlbums } from '../hooks/useContent';
import { handleImageError } from '../lib/imagePlaceholder';
import { formatShortDate } from '../lib/dates';
import { Album, GALLERY_CATEGORIES, GALLERY_CATEGORY_LABELS, GalleryCategory } from '../types';

type TabId = GalleryCategory;

const PREVIEW_COUNT = 4;

const albumCount = (album: Album): number => album.photoCount ?? album.photos?.length ?? 0;

const byMostRecent = (a: Album, b: Album): number =>
  (b.date ?? '').localeCompare(a.date ?? '') || (a.rank ?? 0) - (b.rank ?? 0);

const TeamGallery: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('match');
  const [expanded, setExpanded] = useState(false);

  const { data: albums } = useAlbums();

  const visibleAlbums = useMemo(
    () => albums.filter((album) => album.isVisible !== false && albumCount(album) > 0),
    [albums]
  );

  const tabAlbums = useMemo(
    () => visibleAlbums.filter((album) => album.category === activeTab).sort(byMostRecent),
    [visibleAlbums, activeTab]
  );

  const shown = useMemo(
    () => (expanded ? tabAlbums : tabAlbums.slice(0, PREVIEW_COUNT)),
    [tabAlbums, expanded]
  );

  const hasMore = tabAlbums.length > PREVIEW_COUNT;

  const changeTab = (tab: TabId) => {
    setActiveTab(tab);
    setExpanded(false);
  };

  const albumCard = (album: Album) => {
    const count = albumCount(album);
    return (
      <Link
        key={String(album.id)}
        to={`/galerie/${album.id}`}
        className="group overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.04] text-left transition-colors hover:border-club-yellow/40"
      >
        <div className="relative aspect-square overflow-hidden">
          {album.cover ? (
            <img
              src={album.cover}
              alt={album.title}
              loading="lazy"
              onError={handleImageError}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/5 text-white/30">
              <Images size={40} />
            </div>
          )}
          <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">
            <Images size={12} />
            {count}
          </span>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-extrabold uppercase text-white transition-colors group-hover:text-club-yellow">
            {album.title}
          </h3>
          <p className="mt-1 text-sm text-white/60">
            {count} photo{count > 1 ? 's' : ''}
            {album.date ? ` · ${formatShortDate(album.date)}` : ''}
          </p>
        </div>
      </Link>
    );
  };

  return (
    <section className="band-charcoal py-12">
      <div className="site-container">
        <SectionHeader
          title="Galerie"
          linkLabel="Toute la galerie"
          linkTo="/galerie"
          className="mb-8"
        />

        <div className="mb-8 flex flex-wrap gap-2">
          {GALLERY_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => changeTab(category)}
              aria-pressed={activeTab === category}
              className={`rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${
                activeTab === category
                  ? 'bg-club-yellow text-black'
                  : 'bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {GALLERY_CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>

        {tabAlbums.length === 0 ? (
          <p className="panel p-8 text-center text-sm text-white/60">
            Aucun album dans cette rubrique pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {shown.map(albumCard)}
            {!expanded && hasMore && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="flex aspect-square items-center justify-center rounded-[20px] border border-dashed border-white/20 bg-white/[0.02] text-white/60 transition-colors hover:border-club-yellow/40 hover:text-club-yellow"
              >
                <span className="flex flex-col items-center gap-1">
                  <Plus size={28} />
                  <span className="text-xs font-bold uppercase">Voir plus d'albums</span>
                </span>
              </button>
            )}
            {expanded && (
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="flex aspect-square items-center justify-center rounded-[20px] border border-dashed border-white/20 bg-white/[0.02] text-white/60 transition-colors hover:border-club-yellow/40 hover:text-club-yellow"
              >
                <span className="flex flex-col items-center gap-1">
                  <Minus size={28} />
                  <span className="text-xs font-bold uppercase">Réduire</span>
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default TeamGallery;
