import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Store, Truck } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { formatCFA } from '../lib/currency';
import { FREE_SHIPPING_THRESHOLD, shippingFor } from '../lib/shipping';
import { ApiError } from '../lib/api';
import { Fulfilment, Order, PaymentMethod } from '../types';
import { FULFILMENT_LABELS, PAYMENT_LABELS, placeOrder } from '../services/site/orders.service';
import PageHero from '../components/ui/PageHero';

const Checkout: React.FC = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();

  const [customer, setCustomer] = useState({
    name: user?.name ?? '',
    phone: '',
    email: user?.email ?? '',
  });
  const [fulfilment, setFulfilment] = useState<Fulfilment>('retrait');
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('a_la_remise');
  const [note, setNote] = useState('');

  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState<Order | null>(null);

  const subtotal = useMemo(() => getCartTotal(), [getCartTotal]);
  const shipping = shippingFor(subtotal, fulfilment);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    setError('');

    try {
      const order = await placeOrder({
        customer: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email || undefined,
        },
        items: cart.map((item) => ({
          product_id: String(item.product.id),
          size: item.size,
          quantity: item.quantity,
        })),
        fulfilment,
        address: fulfilment === 'livraison' ? address : undefined,
        payment_method: payment,
        note: note || undefined,
      });

      clearCart();
      setPlaced(order);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.fullMessage : "Commande non enregistrée.");
    } finally {
      setSending(false);
    }
  };

  if (placed) {
    return (
      <div className="band-green flex min-h-screen items-center justify-center px-4 py-32">
        <div className="w-full max-w-lg rounded-[20px] border border-white/10 bg-graphite p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-club-yellow text-black">
            <Check size={32} />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold uppercase text-white">Commande enregistrée</h1>
          <p className="mt-3 text-sm text-white/70">
            Le club vous rappelle au <span className="font-bold text-white">{placed.customer.phone}</span> pour
            convenir de la remise.
          </p>

          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-white/50">Votre référence</p>
          <p className="mt-1 font-mono text-3xl font-extrabold text-club-yellow">{placed.reference}</p>

          <dl className="mt-8 space-y-2 text-left text-sm">
            <div className="flex justify-between">
              <dt className="text-white/60">Sous-total</dt>
              <dd className="font-bold">{formatCFA(placed.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/60">{FULFILMENT_LABELS[placed.fulfilment]}</dt>
              <dd className="font-bold">
                {placed.shipping === 0 ? 'Offert' : formatCFA(placed.shipping)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 text-base">
              <dt className="font-extrabold uppercase">À régler</dt>
              <dd className="font-extrabold text-club-yellow">{formatCFA(placed.total)}</dd>
            </div>
          </dl>

          <p className="mt-4 text-xs text-white/40">
            Règlement {PAYMENT_LABELS[placed.payment_method].toLowerCase()}. Aucun paiement n'a été
            prélevé en ligne.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/shop" className="btn-yellow">Retour à la boutique</Link>
            <Link to="/" className="btn-ghost">Accueil</Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="band-green flex min-h-screen items-center justify-center px-6 py-32 text-center">
        <div className="max-w-md">
          <h1 className="text-3xl font-extrabold uppercase text-white">Panier vide</h1>
          <p className="mt-3 text-sm text-white/70">
            Ajoutez des articles à votre panier avant de passer commande.
          </p>
          <Link to="/shop" className="btn-yellow mt-8">Aller à la boutique</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-graphite">
      <PageHero
        kicker="Boutique officielle"
        title="Votre commande"
        description="Le club vous rappelle pour convenir de la remise. Aucun paiement en ligne."
      />

      <div className="site-container grid gap-8 py-12 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submit} className="space-y-6">
          <section className="panel p-6">
            <h2 className="mb-5 text-lg font-extrabold uppercase text-white">Vos coordonnées</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="order-name" className="mb-2 block text-xs font-bold uppercase tracking-wide text-white/50">
                  Nom complet
                </label>
                <input
                  id="order-name"
                  required
                  minLength={2}
                  autoComplete="name"
                  value={customer.name}
                  onChange={(event) => setCustomer({ ...customer, name: event.target.value })}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="order-phone" className="mb-2 block text-xs font-bold uppercase tracking-wide text-white/50">
                  Téléphone
                </label>
                <input
                  id="order-phone"
                  required
                  type="tel"
                  minLength={6}
                  autoComplete="tel"
                  placeholder="7X XX XX XX"
                  value={customer.phone}
                  onChange={(event) => setCustomer({ ...customer, phone: event.target.value })}
                  className="field"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="order-email" className="mb-2 block text-xs font-bold uppercase tracking-wide text-white/50">
                  E-mail <span className="text-white/30">— facultatif</span>
                </label>
                <input
                  id="order-email"
                  type="email"
                  autoComplete="email"
                  value={customer.email}
                  onChange={(event) => setCustomer({ ...customer, email: event.target.value })}
                  className="field"
                />
              </div>
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="mb-5 text-lg font-extrabold uppercase text-white">Remise</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                { value: 'retrait' as Fulfilment, icon: Store, hint: 'Gratuit, au stade' },
                { value: 'livraison' as Fulfilment, icon: Truck, hint: `Offerte dès ${formatCFA(FREE_SHIPPING_THRESHOLD)}` },
              ]).map(({ value, icon: Icon, hint }) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-colors ${
                    fulfilment === value ? 'border-club-yellow bg-club-yellow/10' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="fulfilment"
                    checked={fulfilment === value}
                    onChange={() => setFulfilment(value)}
                    className="sr-only"
                  />
                  <Icon size={20} className="mt-0.5 shrink-0 text-club-yellow" />
                  <span>
                    <span className="block text-sm font-bold uppercase text-white">
                      {FULFILMENT_LABELS[value]}
                    </span>
                    <span className="block text-xs text-white/50">{hint}</span>
                  </span>
                </label>
              ))}
            </div>

            {fulfilment === 'livraison' && (
              <div className="mt-4">
                <label htmlFor="order-address" className="mb-2 block text-xs font-bold uppercase tracking-wide text-white/50">
                  Adresse de livraison
                </label>
                <input
                  id="order-address"
                  required
                  minLength={5}
                  autoComplete="street-address"
                  placeholder="Quartier, rue, repère"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className="field"
                />
              </div>
            )}
          </section>

          <section className="panel p-6">
            <h2 className="mb-5 text-lg font-extrabold uppercase text-white">Règlement</h2>
            <div className="space-y-2">
              {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((method) => (
                <label
                  key={method}
                  className="flex cursor-pointer items-center gap-3 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-sm text-white/80 transition-colors hover:border-white/30"
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={payment === method}
                    onChange={() => setPayment(method)}
                    className="accent-club-yellow"
                  />
                  {PAYMENT_LABELS[method]}
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs text-white/40">
              Aucun prélèvement en ligne : le club constate le règlement au moment de la remise.
            </p>

            <label htmlFor="order-note" className="mb-2 mt-5 block text-xs font-bold uppercase tracking-wide text-white/50">
              Précision <span className="text-white/30">— facultatif</span>
            </label>
            <textarea
              id="order-note"
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Disponibilités, floquage souhaité…"
              className="w-full resize-none rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-club-yellow"
            />
          </section>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={sending} className="btn-yellow disabled:opacity-50">
              {sending ? 'Enregistrement…' : 'Valider la commande'}
            </button>
            <Link to="/cart" className="btn-ghost">
              <ArrowLeft size={16} />
              Retour au panier
            </Link>
          </div>
        </form>

        <aside className="panel sticky top-28 h-fit space-y-5 p-6">
          <h2 className="text-lg font-extrabold uppercase text-white">Votre panier</h2>

          <ul className="space-y-3">
            {cart.map((item) => (
              <li key={`${item.product.id}-${item.size}`} className="flex gap-3 text-sm">
                <img
                  src={item.product.image}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-bold text-white">{item.product.name}</p>
                  <p className="text-xs text-white/50">
                    Taille {item.size} · ×{item.quantity}
                  </p>
                </div>
                <span className="whitespace-nowrap font-bold">
                  {formatCFA(item.product.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="space-y-2 border-t border-white/10 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-white/60">Sous-total</dt>
              <dd className="font-bold">{formatCFA(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/60">{FULFILMENT_LABELS[fulfilment]}</dt>
              <dd className="font-bold">{shipping === 0 ? 'Offert' : formatCFA(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 text-base">
              <dt className="font-extrabold uppercase">Total</dt>
              <dd className="font-extrabold text-club-yellow">{formatCFA(subtotal + shipping)}</dd>
            </div>
          </dl>

          <p className="text-[11px] leading-relaxed text-white/40">
            Montant indicatif : le club revérifie les prix du catalogue à l'enregistrement.
          </p>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
