import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { formatCFA } from '../lib/currency';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../lib/shipping';

const TAX_RATE = 0.2;

const Cart: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  const totalQuantity = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
  const subTotal = useMemo(() => getCartTotal(), [getCartTotal]);
  const shippingCost = subTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const taxAmount = subTotal * TAX_RATE;
  const total = subTotal + shippingCost + taxAmount;

  if (cart.length === 0) {
    return (
      <div className="band-green flex min-h-screen items-center justify-center px-6 py-32">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-black/25">
            <ShoppingBag size={40} className="text-club-yellow" />
          </div>
          <h1 className="text-3xl font-extrabold uppercase text-white md:text-4xl">Panier vide</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Ajoutez des articles depuis la boutique officielle pour commencer votre commande.
          </p>
          <Link to="/shop" className="btn-yellow mt-8">Aller à la boutique</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-graphite">
      <section className="band-green">
        <div className="site-container pb-10 pt-28">
          <p className="page-hero__kicker">Commande</p>
          <h1 className="page-hero__title">Panier</h1>
          <p className="mt-3 text-sm text-white/70">
            {totalQuantity} article{totalQuantity > 1 ? 's' : ''} · vérifiez et validez votre commande.
          </p>
        </div>
      </section>

      <div className="site-container grid gap-8 py-12 lg:grid-cols-[1fr_360px]">
        <section className="space-y-3">
          {cart.map((item) => (
            <article
              key={`${item.product.id}-${item.size}`}
              className="panel panel-hover flex items-center gap-4 p-4"
            >
              <img
                src={item.product.image}
                alt={item.product.name}
                className="h-20 w-20 shrink-0 rounded-2xl object-cover"
              />

              <div className="min-w-0 flex-1">
                <h2 className="line-clamp-2 text-sm font-extrabold uppercase text-white sm:text-base">
                  {item.product.name}
                </h2>
                <p className="mt-1 flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-white/50">
                  <span>Taille {item.size}</span>
                  <span className="h-1 w-1 rounded-full bg-white/30" />
                  <span className="font-bold text-club-yellow">{formatCFA(item.product.price)}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-full border border-white/15 bg-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    aria-label="Diminuer la quantité"
                    className="px-3 py-2 text-white/70 transition-colors hover:text-white disabled:opacity-30"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                    aria-label="Augmenter la quantité"
                    className="px-3 py-2 text-white/70 transition-colors hover:text-white"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <span className="hidden w-24 text-right text-sm font-extrabold tabular-nums sm:block">
                  {formatCFA(item.product.price * item.quantity)}
                </span>

                <button
                  type="button"
                  onClick={() => removeFromCart(item.product.id, item.size)}
                  aria-label="Retirer du panier"
                  className="text-white/40 transition-colors hover:text-red-400"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </article>
          ))}

          <div className="flex flex-wrap gap-3 pt-3">
            <Link to="/shop" className="btn-ghost">Continuer vos achats</Link>
            <button type="button" onClick={clearCart} className="btn-ghost hover:border-red-400 hover:bg-red-500 hover:text-white">
              Vider le panier
            </button>
          </div>
        </section>

        <aside className="panel sticky top-28 h-fit space-y-6 p-6">
          <div>
            <h2 className="text-lg font-extrabold uppercase text-white">Récapitulatif</h2>
            <p className="mt-1 text-xs text-white/50">Vérifiez les montants avant paiement.</p>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-white/60">Sous-total</dt>
              <dd className="font-bold">{formatCFA(subTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/60">Livraison</dt>
              <dd className="font-bold">{shippingCost === 0 ? 'Offerte' : formatCFA(shippingCost)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/60">TVA (indicative)</dt>
              <dd className="font-bold">{formatCFA(taxAmount)}</dd>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-3 text-base">
              <dt className="font-extrabold uppercase">Total</dt>
              <dd className="font-extrabold text-club-yellow">{formatCFA(total)}</dd>
            </div>
          </dl>

          {shippingCost > 0 ? (
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-club-yellow transition-all"
                  style={{ width: `${Math.min(100, (subTotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-white/50">
                Plus que{' '}
                <span className="font-bold text-white">{formatCFA(FREE_SHIPPING_THRESHOLD - subTotal)}</span>{' '}
                pour la livraison offerte.
              </p>
            </div>
          ) : (
            <p className="text-xs font-bold uppercase text-club-yellow">Livraison offerte</p>
          )}

          <Link to="/commande" className="btn-yellow w-full">Passer la commande</Link>

          <p className="text-[11px] leading-relaxed text-white/40">
            Aucun paiement en ligne : le club vous rappelle pour convenir de la remise et du
            règlement.
          </p>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
