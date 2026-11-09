import React from 'react';
import { Link } from 'react-router-dom';
import { useArticles } from '../../hooks/useContent';
import { ArticleCategory } from '../../types';

const SECONDS_PER_TITLE = 6;
const MIN_TITLES = 8;

const NewsTicker: React.FC<{ className?: string; category?: ArticleCategory }> = ({ className = '', category }) => {
  const { data: allArticles } = useArticles({ limit: 50 });
  const articles = category ? allArticles.filter((article) => article.category === category) : allArticles;

  if (articles.length === 0) return null;

  const base = Array.from({ length: Math.ceil(MIN_TITLES / articles.length) }, () => articles).flat();
  const duration = base.length * SECONDS_PER_TITLE;

  const renderTitles = (copy: number) =>
    base.map((article, index) => {
      const repeat = copy > 0 || index >= articles.length;
      return (
      <Link
        key={`${copy}-${index}`}
        to={`/news/${article.id}`}
        tabIndex={repeat ? -1 : undefined}
        aria-hidden={repeat ? true : undefined}
        className="flex shrink-0 items-center gap-3 px-6 text-sm font-bold uppercase tracking-wide text-white/85 transition-colors hover:text-club-yellow"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-club-yellow" aria-hidden />
        {article.title}
      </Link>
      );
    });

  return (
    <section className={`flex items-stretch overflow-hidden border-y border-white/10 bg-charcoal ${className}`} aria-label="Titres de l'actualité">
      <span className="z-10 flex shrink-0 items-center bg-club-yellow px-4 py-3 text-xs font-extrabold uppercase tracking-widest text-black">
        Actualités
      </span>
      <div className="group relative flex-1 overflow-hidden">
        <div
          className="flex w-max animate-ticker py-3 group-hover:[animation-play-state:paused]"
          style={{ animationDuration: `${duration}s` }}
        >
          {renderTitles(0)}
          {renderTitles(1)}
        </div>
      </div>
    </section>
  );
};

export default NewsTicker;
