import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HandHeart, Lock, ShieldCheck } from 'lucide-react';
import { getDonationConfig, startDonation } from '../services/site/donations.service';
import useApiResource from '../hooks/useApiResource';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { ApiError } from '../lib/api';
import { formatAmount, formatCFA } from '../lib/currency';
import PageHero from '../components/ui/PageHero';
import heroImage from '../../assets/img/asc-camberene-equipe-2025.webp';

/** Montants proposés d'un clic ; « Autre » ouvre la saisie libre. */
const PRESETS = [2000, 5000, 10000, 25000, 50000];

/** Ce qu'un don finance, pour que le donateur sache où va son argent. */
const CAUSES = [
  { title: 'La formation', text: 'Équipements, déplacements et encadrement des U12 aux U19.' },
  { title: "L'équipe première", text: 'Préparation, matériel et frais de compétition en Ligue.' },
  { title: 'Le stade', text: "Entretien du terrain et accueil des supporters à Cambérène." },
];

/**
 * Faire un don au club.
 *
 * Le paiement se fait sur la page de PayTech — Wave, Orange Money, Free Money
 * ou carte — et jamais sur ce site : il ne voit passer ni numéro de carte ni
 * code. Ce formulaire ne fait que préparer le don et y envoyer le donateur.
 */
const Dons: React.FC = () => {
  const [params] = useSearchParams();
  const settings = useSiteSettings();
  const cancelled = params.get('annule');

  const { data: config, loading } = useApiResource(
    (signal) => getDonationConfig(signal),
    { enabled: false, min: 500, max: 5_000_000 }
  );

  const [preset, setPreset] = useState<number | null>(PRESETS[1]);
  const [custom, setCustom] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', anonymous: false });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const amount = preset ?? Number(custom.replace(/\D/g, ''));
  const validAmount = amount >= config.min && amount <= config.max;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validAmount) return;

    setSending(true);
    setError('');
    try {
      const { redirectUrl } = await startDonation({
        amount,
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        anonymous: form.anonymous,
        message: form.message,
      });
      // Départ vers PayTech : la page ne revient qu'au retour du paiement.
      window.location.assign(redirectUrl);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.fullMessage
          : "Le paiement n'a pas pu être ouvert. Réessayez dans un instant."
      );
      setSending(false);
    }
  };

  const field =
    'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-club-yellow';

  return (
    <div className="bg-graphite">
      <PageHero
        kicker="Soutenir le club"
        title="Faire un don"
        description="Chaque franc compte pour former les jeunes de Cambérène et porter l'équipe première."
        image={heroImage}
      />

      <section className="site-container grid gap-8 py-12 lg:grid-cols-[1fr_420px]">
        <div>
          <h2 className="mb-4 text-lg font-extrabold uppercase text-white">À quoi sert votre don</h2>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {CAUSES.map((cause) => (
              <div key={cause.title} className="panel p-5">
                <p className="font-extrabold uppercase text-club-yellow">{cause.title}</p>
                <p className="mt-2 text-sm text-white/70">{cause.text}</p>
              </div>
            ))}
          </div>

          <div className="panel mt-6 flex gap-4 p-5 text-sm text-white/70">
            <ShieldCheck size={22} className="shrink-0 text-club-yellow" />
            <p>
              Le paiement se fait sur la page sécurisée de <strong className="text-white">PayTech</strong>,
              par Wave, Orange Money, Free Money ou carte bancaire. Le site du club ne voit jamais vos
              coordonnées de paiement.
            </p>
          </div>

          {settings.contact.phone && (
            <p className="mt-6 text-sm text-white/50">
              Pour un don important, un partenariat ou un don en nature, appelez le club au{' '}
              <a href={`tel:${settings.contact.phone.replace(/\s/g, '')}`} className="text-white hover:text-club-yellow">
                {settings.contact.phone}
              </a>
              .
            </p>
          )}
        </div>

        <div className="panel h-fit p-6">
          {loading ? (
            <p className="text-sm text-white/60">Chargement…</p>
          ) : !config.enabled ? (
            <div className="text-center">
              <HandHeart size={40} className="mx-auto mb-3 text-club-yellow" />
              <h2 className="text-lg font-extrabold uppercase text-white">Bientôt disponible</h2>
              <p className="mt-2 text-sm text-white/70">
                Les dons en ligne ouvrent très prochainement. En attendant, contactez le club pour
                le soutenir.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4 text-sm">
              <h2 className="text-lg font-extrabold uppercase text-white">Votre don</h2>

              {cancelled && (
                <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                  Le paiement a été interrompu, rien n'a été débité. Vous pouvez recommencer quand
                  vous voulez.
                </p>
              )}

              <fieldset>
                <legend className="mb-2 text-xs text-white/60">Montant</legend>
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPreset(value)}
                      aria-pressed={preset === value}
                      className={`rounded-lg border px-2 py-2.5 font-bold transition ${
                        preset === value
                          ? 'border-club-yellow bg-club-yellow text-black'
                          : 'border-white/10 bg-white/5 text-white hover:border-white/30'
                      }`}
                    >
                      {formatAmount(value)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPreset(null)}
                    aria-pressed={preset === null}
                    className={`rounded-lg border px-2 py-2.5 font-bold transition ${
                      preset === null
                        ? 'border-club-yellow bg-club-yellow text-black'
                        : 'border-white/10 bg-white/5 text-white hover:border-white/30'
                    }`}
                  >
                    Autre
                  </button>
                </div>
                {preset === null && (
                  <div className="mt-2">
                    <label htmlFor="don-custom" className="sr-only">Montant libre en FCFA</label>
                    <input
                      id="don-custom"
                      inputMode="numeric"
                      autoFocus
                      value={custom}
                      onChange={(event) => setCustom(event.target.value)}
                      placeholder={`Montant en FCFA (minimum ${formatAmount(config.min)})`}
                      className={field}
                    />
                  </div>
                )}
              </fieldset>

              <div>
                <label htmlFor="don-name" className="mb-1 block text-xs text-white/60">Nom complet</label>
                <input
                  id="don-name"
                  required
                  value={form.name}
                  onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
                  className={field}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="don-phone" className="mb-1 block text-xs text-white/60">
                    Téléphone <span className="text-white/30">— facultatif</span>
                  </label>
                  <input
                    id="don-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) => setForm((f) => ({ ...f, phone: event.target.value }))}
                    placeholder="77 123 45 67"
                    className={field}
                  />
                </div>
                <div>
                  <label htmlFor="don-email" className="mb-1 block text-xs text-white/60">
                    Email <span className="text-white/30">— facultatif</span>
                  </label>
                  <input
                    id="don-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((f) => ({ ...f, email: event.target.value }))}
                    className={field}
                  />
                </div>
              </div>

              <textarea
                value={form.message}
                onChange={(event) => setForm((f) => ({ ...f, message: event.target.value }))}
                placeholder="Un mot pour le club — facultatif"
                aria-label="Message pour le club"
                rows={2}
                className={`${field} resize-none`}
              />

              <label className="flex items-center gap-2 text-xs text-white/70">
                <input
                  type="checkbox"
                  checked={form.anonymous}
                  onChange={(event) => setForm((f) => ({ ...f, anonymous: event.target.checked }))}
                  className="accent-club-yellow"
                />
                Rester anonyme
              </label>

              {error && (
                <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={sending || !validAmount}
                className="btn-yellow w-full justify-center disabled:opacity-60"
              >
                {sending
                  ? 'Ouverture du paiement…'
                  : validAmount
                    ? `Donner ${formatCFA(amount)}`
                    : 'Choisir un montant'}
              </button>

              <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-white/40">
                <Lock size={11} />
                Paiement sécurisé par PayTech
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dons;
