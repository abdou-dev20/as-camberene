import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { getDonationStatus } from '../services/site/donations.service';
import { formatCFA } from '../lib/currency';
import { DonationStatus } from '../types';
import PageHero from '../components/ui/PageHero';

/** Toutes les trois secondes, pendant une minute : PayTech notifie en général bien avant. */
const POLL_MS = 3000;
const POLL_TRIES = 20;

/**
 * Retour de PayTech après un paiement.
 *
 * Arriver ici ne prouve pas que le don est payé : l'adresse se tape à la main.
 * La page interroge donc le serveur, qui ne marque le don payé que sur la
 * notification signée de PayTech — elle arrive souvent quelques secondes après
 * le navigateur, d'où l'attente.
 */
const DonMerci: React.FC = () => {
  const [params] = useSearchParams();
  const reference = params.get('ref') ?? '';
  const [status, setStatus] = useState<DonationStatus | 'introuvable' | null>(null);
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (!reference) {
      setStatus('introuvable');
      return;
    }

    const controller = new AbortController();
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const result = await getDonationStatus(reference, controller.signal);
        setAmount(result.amount);
        setStatus(result.status);
        if (result.status !== 'en_attente' || ++tries >= POLL_TRIES) return;
      } catch {
        if (controller.signal.aborted) return;
        if (++tries >= POLL_TRIES) {
          setStatus('introuvable');
          return;
        }
      }
      timer = setTimeout(poll, POLL_MS);
    };

    poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [reference]);

  const content = (() => {
    if (status === 'payee') {
      return {
        icon: <CheckCircle2 size={44} className="mx-auto mb-3 text-club-yellow" />,
        title: 'Merci pour votre don !',
        text: `Votre don de ${formatCFA(amount)} a bien été reçu. Tout le club vous remercie pour votre soutien.`,
      };
    }
    if (status === 'annulee' || status === 'echouee') {
      return {
        icon: <XCircle size={44} className="mx-auto mb-3 text-red-300" />,
        title: "Le paiement n'a pas abouti",
        text: "Rien n'a été débité. Vous pouvez recommencer quand vous voulez.",
      };
    }
    if (status === 'introuvable') {
      return {
        icon: <XCircle size={44} className="mx-auto mb-3 text-white/40" />,
        title: 'Don introuvable',
        text: "Nous ne retrouvons pas ce don. Si vous avez été débité, contactez le club avec la référence ci-dessous.",
      };
    }
    return {
      icon: <Clock size={44} className="mx-auto mb-3 animate-pulse text-club-yellow" />,
      title: 'Confirmation en cours…',
      text: "Nous attendons la confirmation de PayTech. Si elle tarde, votre don sera tout de même enregistré dès qu'elle arrivera.",
    };
  })();

  return (
    <div className="bg-graphite">
      <PageHero kicker="Soutenir le club" title="Votre don" />
      <section className="site-container py-12">
        <div className="panel mx-auto max-w-lg p-8 text-center">
          {content.icon}
          <h2 className="text-xl font-extrabold uppercase text-white">{content.title}</h2>
          <p className="mt-3 text-sm text-white/70">{content.text}</p>
          {reference && (
            <>
              <p className="mt-6 text-xs uppercase tracking-wide text-white/50">Référence</p>
              <p className="mt-1 font-mono text-lg font-extrabold text-club-yellow">{reference}</p>
            </>
          )}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/" className="btn-yellow justify-center">Retour à l'accueil</Link>
            {(status === 'annulee' || status === 'echouee') && (
              <Link to="/dons" className="btn-ghost justify-center">Refaire un don</Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DonMerci;
