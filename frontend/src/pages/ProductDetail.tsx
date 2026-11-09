import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, Minus, Plus, RotateCcw, Shield, ShoppingCart, Truck } from 'lucide-react';
import { useProductRecord, useProducts } from '../hooks/useContent';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCFA } from '../lib/currency';
import { FREE_SHIPPING_THRESHOLD } from '../lib/shipping';
import { useCart } from '../hooks/useCart';
import Notification from '../components/Notification';
import ArticleCard from '../components/ui/ArticleCard';
import Rail from '../components/ui/Rail';
import SectionHeader from '../components/ui/SectionHeader';

const TABS = [
  { id: 'description', label: 'Description' },
  { id: 'caracteristiques', label: 'Caractéristiques' },
  { id: 'livraison', label: 'Livraison & retours' },
] as const;

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('description');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    isVisible: boolean;
  }>({ type: 'info', message: '', isVisible: false });

  const { addToCart } = useCart();
  const { product, loading } = useProductRecord(id);
  const { data: products } = useProducts();

  const related = useMemo(
    () => products.filter((entry) => String(entry.id) !== String(id)).slice(0, 8),
    [products, id]
  );

  if (loading && !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-graphite">
        <LoadingSpinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-graphite px-4">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-extrabold uppercase text-white">Produit introuvable</h1>
          <Link to="/shop" className="btn-yellow">Retour à la boutique</Link>
        </div>
      </div>
    );
  }

  const gallery = product.images?.length ? product.images : [product.image];

  const handleAddToCart = () => {
    if (!selectedSize) {
      setNotification({ type: 'error', message: 'Veuillez sélectionner une taille.', isVisible: true });
      return;
    }
    addToCart(product, selectedSize, quantity);
    setNotification({ type: 'success', message: `${product.name} ajouté au panier.`, isVisible: true });
  };

  return (
    <div className="bg-graphite">
      <Notification
        {...notification}
        onClose={() => setNotification((current) => ({ ...current, isVisible: false }))}
      />

      <div className="border-b border-white/10 bg-charcoal pt-24">
        <div className="site-container py-5">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase text-white/70 transition-colors hover:text-club-yellow"
          >
            <ArrowLeft size={16} />
            Retour à la boutique
          </Link>
          <nav aria-label="Fil d'Ariane" className="mt-3">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-white/50">
              <li><Link to="/" className="hover:text-club-yellow">Accueil</Link></li>
              <li aria-hidden>/</li>
              <li><Link to="/shop" className="hover:text-club-yellow">Boutique</Link></li>
              <li aria-hidden>/</li>
              <li className="text-white">{product.name}</li>
            </ol>
          </nav>
        </div>
      </div>

      <section className="band-charcoal py-12">
        <div className="site-container grid gap-10 lg:grid-cols-2">
          <div>
            <div className="overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.04]">
              <img
                src={gallery[selectedImage]}
                alt={product.name}
                className="h-[420px] w-full object-cover md:h-[500px]"
              />
            </div>

            {gallery.length > 1 && (
              <div className="mt-4 flex gap-3">
                {gallery.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    aria-label={`Voir l'image ${index + 1}`}
                    className={`h-20 w-20 overflow-hidden rounded-2xl border-2 transition-colors ${
                      index === selectedImage ? 'border-club-yellow' : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-club-yellow">
              {product.category} · {product.type}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold uppercase text-white md:text-5xl">{product.name}</h1>
            <p className="mt-4 text-3xl font-extrabold text-club-yellow">{formatCFA(product.price)}</p>

            <p className="mt-2 text-sm">
              {product.inStock ? (
                <span className="font-bold uppercase text-club-yellow">En stock</span>
              ) : (
                <span className="font-bold uppercase text-red-400">Épuisé</span>
              )}
            </p>

            <div className="mt-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-white/50">Taille</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    aria-pressed={selectedSize === size}
                    className={`min-w-[56px] rounded-full px-4 py-2.5 text-sm font-bold uppercase transition-colors ${
                      selectedSize === size
                        ? 'bg-club-yellow text-black'
                        : 'bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-full border border-white/15 bg-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  disabled={quantity <= 1}
                  aria-label="Diminuer la quantité"
                  className="px-4 py-3 text-white/70 transition-colors hover:text-white disabled:opacity-30"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-bold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((current) => current + 1)}
                  aria-label="Augmenter la quantité"
                  className="px-4 py-3 text-white/70 transition-colors hover:text-white"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="btn-yellow flex-1 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ShoppingCart size={16} />
                Ajouter au panier
              </button>

              <button
                type="button"
                onClick={() => setWishlisted(!wishlisted)}
                aria-pressed={wishlisted}
                aria-label="Ajouter aux favoris"
                className={`rounded-full border-2 p-3 transition-colors ${
                  wishlisted
                    ? 'border-club-yellow bg-club-yellow text-black'
                    : 'border-white/20 text-white hover:border-white'
                }`}
              >
                <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            <ul className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Truck, label: `Livraison offerte dès ${formatCFA(FREE_SHIPPING_THRESHOLD)}` },
                { icon: Shield, label: 'Produit officiel du club' },
                { icon: RotateCcw, label: 'Retours sous 14 jours' },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="panel flex items-center gap-3 p-4 text-xs text-white/70">
                  <Icon size={18} className="shrink-0 text-club-yellow" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="band-graphite py-12">
        <div className="site-container">
          <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={activeTab === tab.id}
                className={`rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${
                  activeTab === tab.id
                    ? 'bg-club-yellow text-black'
                    : 'bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-w-3xl pt-8 leading-relaxed text-white/75">
            {activeTab === 'description' && <p>{product.description}</p>}

            {activeTab === 'caracteristiques' && (
              <dl className="grid gap-4 sm:grid-cols-2">
                {[
                  { term: 'Catégorie', value: product.category },
                  { term: 'Déclinaison', value: product.type },
                  { term: 'Tailles disponibles', value: product.sizes.join(', ') },
                  { term: 'Disponibilité', value: product.inStock ? 'En stock' : 'Épuisé' },
                ].map((item) => (
                  <div key={item.term} className="panel p-4">
                    <dt className="text-xs uppercase tracking-[0.18em] text-white/50">{item.term}</dt>
                    <dd className="mt-1 font-bold text-white">{item.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {activeTab === 'livraison' && (
              <div className="space-y-3">
                <p>
                  Expédition depuis Dakar sous 48 heures ouvrées. Livraison offerte à partir de{' '}
                  {formatCFA(FREE_SHIPPING_THRESHOLD)} d'achat.
                </p>
                <p>
                  Retour possible sous 14 jours, article non porté et étiquette d'origine conservée.
                  Les frais de retour sont à la charge de l'acheteur.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="band-green py-8">
          <div className="site-container">
            <SectionHeader title="Vous aimerez aussi" linkLabel="Toute la boutique" linkTo="/shop" className="mb-8" />
            <Rail>
              {related.map((entry) => (
                <ArticleCard
                  key={String(entry.id)}
                  to={`/shop/${entry.id}`}
                  image={entry.image}
                  kicker={entry.type}
                  title={entry.name}
                  note={formatCFA(entry.price)}
                />
              ))}
            </Rail>
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
