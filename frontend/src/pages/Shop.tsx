import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useProducts } from '../hooks/useContent';
import { useCart } from '../hooks/useCart';
import { Product } from '../types';
import { formatCFA } from '../lib/currency';
import Notification from '../components/Notification';
import PageHero from '../components/ui/PageHero';

const Shop: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selected = searchParams.get('categorie') ?? 'Tous';

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    isVisible: boolean;
  }>({ type: 'info', message: '', isVisible: false });

  const { addToCart } = useCart();
  const { data: products } = useProducts();

  const categories = useMemo(
    () => ['Tous', ...Array.from(new Set(products.map((product) => product.category)))],
    [products]
  );

  const filtered = useMemo(
    () => products.filter((product) => selected === 'Tous' || product.category === selected),
    [products, selected]
  );

  const selectCategory = (category: string) => {
    if (category === 'Tous') setSearchParams({});
    else setSearchParams({ categorie: category });
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 'M');
    setNotification({ type: 'success', message: `${product.name} ajouté au panier.`, isVisible: true });
  };

  return (
    <div className="bg-graphite">
      <Notification
        {...notification}
        onClose={() => setNotification((current) => ({ ...current, isVisible: false }))}
      />

      <PageHero
        kicker="Store officiel"
        title="Boutique"
        description="Maillots, accessoires et collections officielles de l'ASC Cambérène."
      />

      <section className="border-b border-white/10 bg-charcoal">
        <div className="site-container flex flex-wrap items-center gap-2 py-5">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => selectCategory(category)}
              aria-pressed={selected === category}
              className={`rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${
                selected === category
                  ? 'bg-club-yellow text-black'
                  : 'bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
          <span className="ml-auto text-xs uppercase tracking-[0.18em] text-white/40">
            {filtered.length} produit{filtered.length > 1 ? 's' : ''}
          </span>
        </div>
      </section>

      <section className="band-green py-12">
        <div className="site-container">
          {filtered.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product) => (
                <article
                  key={String(product.id)}
                  className="group flex flex-col overflow-hidden rounded-[20px] border border-white/10 bg-black/25 transition-colors hover:border-club-yellow/50"
                >
                  <Link to={`/shop/${product.id}`} className="relative block overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className="h-60 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 chip bg-club-yellow text-black">{product.type}</span>
                    {!product.inStock && (
                      <span className="absolute right-3 top-3 chip bg-black/70 text-white/70">Épuisé</span>
                    )}
                  </Link>

                  <div className="relative flex flex-1 flex-col p-4">
                    <span
                      className="absolute inset-x-0 top-0 block h-[2px]"
                      style={{ background: 'linear-gradient(90deg, var(--club-yellow) 60%, var(--club-green))' }}
                    />
                    <p className="text-xs font-extrabold uppercase text-club-yellow">{product.category}</p>
                    <h2 className="mt-1 line-clamp-2 text-base font-extrabold uppercase leading-tight text-white">
                      {product.name}
                    </h2>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                      <span className="text-lg font-extrabold text-white">{formatCFA(product.price)}</span>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.inStock}
                        className="btn-yellow px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ShoppingCart size={14} />
                        Ajouter
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="panel p-12 text-center">
              <h2 className="text-xl font-extrabold uppercase text-white">Aucun produit</h2>
              <p className="mt-2 text-sm text-white/60">Cette catégorie est vide pour le moment.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Shop;
