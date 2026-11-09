import React, { useState } from 'react';
import { Check, Crown, Sparkles, Star, Ticket, Users } from 'lucide-react';
import { formatCFA } from '../lib/currency';
import PageHero from '../components/ui/PageHero';

interface Plan {
  id: 'virage' | 'tribune' | 'vip';
  name: string;
  price: number;
  originalPrice: number;
  description: string;
  features: string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'virage',
    name: 'Supporter',
    price: 15000,
    originalPrice: 20000,
    description: 'Pour les supporters passionnés',
    features: [
      'Accès à tous les matchs à domicile',
      'Place dans le virage animé',
      'Réduction boutique 10 %',
      'Lettre d’information exclusive',
      'Accès prioritaire à la billetterie',
      'Badge supporter officiel',
    ],
  },
  {
    id: 'tribune',
    name: 'Premium',
    price: 35000,
    originalPrice: 45000,
    description: 'Le meilleur rapport qualité-prix',
    features: [
      'Accès à tous les matchs à domicile',
      'Place en tribune couverte',
      'Réduction boutique 15 %',
      'Accès au salon d’avant-match',
      'Contenus exclusifs',
      'Rencontres avec les joueurs',
      'Kit supporter premium',
      'Parking préférentiel',
    ],
    popular: true,
  },
  {
    id: 'vip',
    name: 'Élite VIP',
    price: 100000,
    originalPrice: 125000,
    description: "L'expérience complète",
    features: [
      'Accès à tous les matchs à domicile',
      'Places VIP avec service dédié',
      'Réduction boutique 25 %',
      'Salon VIP et restauration',
      'Parking VIP réservé',
      'Rencontres privilégiées avec l’équipe',
      'Cadeaux exclusifs',
      'Invitations aux événements privés',
    ],
  },
];

const PLAN_ICONS = { virage: Users, tribune: Star, vip: Crown } as const;

const STADIUM_SECTIONS = [
  { id: 'virage-sud', name: 'Virage Sud', type: 'virage', available: 150, description: 'Ambiance électrique garantie' },
  { id: 'virage-nord', name: 'Virage Nord', type: 'virage', available: 120, description: "Au cœur de l'action" },
  { id: 'tribune-est', name: 'Tribune Est', type: 'tribune', available: 80, description: 'Vue panoramique' },
  { id: 'tribune-ouest', name: 'Tribune Ouest', type: 'tribune', available: 95, description: 'Sièges premium et services' },
  { id: 'vip-central', name: 'Loge VIP centrale', type: 'vip', available: 25, description: 'Position privilégiée sur le terrain' },
  { id: 'vip-lateral', name: 'Salon VIP latéral', type: 'vip', available: 30, description: 'Services de luxe inclus' },
];

const BENEFITS = [
  { icon: Ticket, title: 'Accès garanti', description: 'Une place réservée pour tous les matchs à domicile.' },
  { icon: Users, title: 'Communauté', description: 'Rejoignez la famille des supporters du club.' },
  { icon: Sparkles, title: 'Expériences', description: 'Rencontres avec les joueurs et événements réservés.' },
  { icon: Crown, title: 'Avantages', description: 'Réductions, priorités et services exclusifs.' },
];

const PAYMENT_METHODS = [
  { value: 'card', label: 'Carte bancaire' },
  { value: 'mobile', label: 'Mobile money (Orange Money, Wave)' },
  { value: 'installments', label: 'Paiement en trois fois' },
];

const Subscriptions: React.FC = () => {
  const [planId, setPlanId] = useState<Plan['id'] | ''>('');
  const [seatId, setSeatId] = useState('');
  const [payment, setPayment] = useState(PAYMENT_METHODS[0].value);

  const selectedPlan = PLANS.find((plan) => plan.id === planId);
  const availableSections = STADIUM_SECTIONS.filter((section) => section.type === planId);

  const selectPlan = (id: Plan['id']) => {
    setPlanId(id);
    setSeatId('');
  };

  return (
    <div className="bg-graphite">
      <PageHero
        kicker="Saison 2025-2026"
        title="Abonnements"
        description="Prenez votre place au stade municipal de Cambérène pour toute la saison."
      />

      <section className="border-b border-white/10 bg-charcoal">
        <div className="site-container grid gap-5 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="panel p-6">
              <Icon size={26} className="text-club-yellow" />
              <h2 className="mt-4 text-lg font-extrabold uppercase text-white">{title}</h2>
              <p className="mt-1 text-sm text-white/60">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="band-green py-12">
        <div className="site-container">
          <h2 className="section-title mb-8">Choisissez votre formule</h2>

          <div className="grid gap-5 lg:grid-cols-3">
            {PLANS.map((plan) => {
              const Icon = PLAN_ICONS[plan.id];
              const isSelected = planId === plan.id;
              return (
                <article
                  key={plan.id}
                  className={`relative flex flex-col rounded-[20px] border-2 bg-black/25 p-6 transition-colors ${
                    isSelected ? 'border-club-yellow' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-6 chip bg-club-yellow text-black">Le plus choisi</span>
                  )}

                  <Icon size={32} className="text-club-yellow" />
                  <h3 className="mt-4 text-2xl font-extrabold uppercase text-white">{plan.name}</h3>
                  <p className="mt-1 text-sm text-white/60">{plan.description}</p>

                  <p className="mt-5 flex items-baseline gap-3">
                    <span className="text-3xl font-extrabold text-club-yellow">{formatCFA(plan.price)}</span>
                    <span className="text-sm text-white/40 line-through">{formatCFA(plan.originalPrice)}</span>
                  </p>
                  <p className="text-xs uppercase tracking-wide text-white/50">Pour la saison</p>

                  <ul className="mt-6 flex-1 space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-white/80">
                        <Check size={15} className="mt-0.5 shrink-0 text-club-yellow" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => selectPlan(plan.id)}
                    className={`mt-6 w-full ${isSelected ? 'btn-green' : 'btn-yellow'}`}
                  >
                    {isSelected ? 'Formule sélectionnée' : 'Choisir cette formule'}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {selectedPlan && (
        <section className="band-charcoal py-12">
          <div className="site-container">
            <h2 className="section-title mb-2">Choisissez votre emplacement</h2>
            <p className="mb-8 text-sm text-white/60">
              Formule {selectedPlan.name} · {formatCFA(selectedPlan.price)}
            </p>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {availableSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setSeatId(section.id)}
                  aria-pressed={seatId === section.id}
                  className={`rounded-[20px] border-2 p-6 text-left transition-colors ${
                    seatId === section.id
                      ? 'border-club-yellow bg-club-yellow/10'
                      : 'border-white/10 bg-white/[0.04] hover:border-white/30'
                  }`}
                >
                  <h3 className="text-lg font-extrabold uppercase text-white">{section.name}</h3>
                  <p className="mt-1 text-sm text-white/60">{section.description}</p>
                  <p className="mt-4 text-xs font-bold uppercase tracking-wide text-club-yellow">
                    {section.available} places disponibles
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {selectedPlan && seatId && (
        <section className="band-graphite py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="section-title mb-2">Vos coordonnées</h2>
            <p className="mb-8 text-sm text-white/60">
              {selectedPlan.name} · {STADIUM_SECTIONS.find((section) => section.id === seatId)?.name}
            </p>

            <form
              onSubmit={(event) => event.preventDefault()}
              className="panel grid gap-4 p-6 sm:grid-cols-2"
            >
              {[
                { id: 'firstname', label: 'Prénom', type: 'text', autoComplete: 'given-name' },
                { id: 'lastname', label: 'Nom', type: 'text', autoComplete: 'family-name' },
                { id: 'sub-email', label: 'Adresse e-mail', type: 'email', autoComplete: 'email' },
                { id: 'sub-phone', label: 'Téléphone', type: 'tel', autoComplete: 'tel' },
              ].map((field) => (
                <div key={field.id}>
                  <label htmlFor={field.id} className="mb-2 block text-xs font-bold uppercase tracking-wide text-white/50">
                    {field.label}
                  </label>
                  <input
                    id={field.id}
                    type={field.type}
                    required
                    autoComplete={field.autoComplete}
                    className="field"
                  />
                </div>
              ))}

              <div className="sm:col-span-2">
                <label htmlFor="sub-address" className="mb-2 block text-xs font-bold uppercase tracking-wide text-white/50">
                  Adresse
                </label>
                <input id="sub-address" type="text" autoComplete="street-address" className="field" />
              </div>

              <fieldset className="sm:col-span-2">
                <legend className="mb-3 text-xs font-bold uppercase tracking-wide text-white/50">
                  Moyen de paiement
                </legend>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map((method) => (
                    <label
                      key={method.value}
                      className="flex cursor-pointer items-center gap-3 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-sm text-white/80 transition-colors hover:border-white/30"
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.value}
                        checked={payment === method.value}
                        onChange={(event) => setPayment(event.target.value)}
                        className="accent-club-yellow"
                      />
                      {method.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <button type="submit" className="btn-yellow sm:col-span-2">
                Finaliser l'abonnement · {formatCFA(selectedPlan.price)}
              </button>

              <p className="text-center text-[11px] text-white/40 sm:col-span-2">
                Le paiement en ligne n'est pas encore actif : un conseiller du club vous rappelle pour
                finaliser la souscription.
              </p>
            </form>
          </div>
        </section>
      )}
    </div>
  );
};

export default Subscriptions;
