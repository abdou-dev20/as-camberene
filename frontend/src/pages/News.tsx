import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useArticles } from '../hooks/useContent';
import { ARTICLE_CATEGORIES, ArticleCategory } from '../types';
import ArticleCard from '../components/ui/ArticleCard';
import PageHero from '../components/ui/PageHero';
import NewsTicker from '../components/ui/NewsTicker';
import PlayerOfMonthVote from '../components/PlayerOfMonthVote';

const POTM_TAB = 'Joueur du mois';
const POTM_PARAM = 'joueur-du-mois';

const FILTERS = ['Toutes', ...ARTICLE_CATEGORIES, POTM_TAB] as const;

const News: React.FC = () => {
  const [search, setSearch] = useState('');
  const [params, setParams] = useSearchParams();
  const [category, setCategoryState] = useState<string>(params.get('onglet') === POTM_PARAM ? POTM_TAB : 'Toutes');
  const setCategory = (item: string) => {
    setCategoryState(item);
    setParams(item === POTM_TAB ? { onglet: POTM_PARAM } : {}, { replace: true });
  };
  const isPotm = category === POTM_TAB;
  const { data: articles } = useArticles();

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return articles.filter((article) => {
      const matchesCategory = category === 'Toutes' || article.category === category;
      const matchesSearch =
        !needle ||
        article.title.toLowerCase().includes(needle) ||
        article.excerpt.toLowerCase().includes(needle);
      return matchesCategory && matchesSearch;
    });
  }, [articles, category, search]);

  return (
    <div className="bg-graphite">
      <PageHero
        kicker="Le club"
        title="Actualités"
        description="Comptes rendus de match, mercato, vie du club et communiqués officiels."
      />

      <section className="border-b border-white/10 bg-charcoal">
        <div className="site-container flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${
                  category === item
                    ? 'bg-club-yellow text-black'
                    : 'bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className={`relative w-full lg:w-80 ${isPotm ? 'invisible' : ''}`}>
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <label htmlFor="news-search" className="sr-only">Rechercher un article</label>
            <input
              id="news-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un article"
              className="field pl-11"
            />
          </div>
        </div>
      </section>

      <NewsTicker
        category={!isPotm && category !== 'Toutes' ? (category as ArticleCategory) : undefined}
      />

      <section className="band-green py-12">
        <div className="site-container">
          {isPotm ? (
            <PlayerOfMonthVote />
          ) : filtered.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-5 sm:justify-start">
              {filtered.map((article) => (
                <ArticleCard
                  key={String(article.id)}
                  to={`/news/${article.id}`}
                  image={article.image}
                  imagePosition={article.imagePosition}
                  kicker={article.category}
                  title={article.title}
                  date={article.publishedAt}
                />
              ))}
            </div>
          ) : (
            <div className="panel p-12 text-center">
              <h2 className="text-xl font-extrabold uppercase text-white">Aucun article trouvé</h2>
              <p className="mt-2 text-sm text-white/60">
                Modifiez la rubrique sélectionnée ou vos termes de recherche.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default News;
