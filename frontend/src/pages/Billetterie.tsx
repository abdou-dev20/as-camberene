import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, MapPin, Ticket } from 'lucide-react';
import { useMatches } from '../hooks/useContent';
import { reserveTickets, ReservationConfirmation } from '../services/site/tickets.service';
import { ApiError } from '../lib/api';
import { handleImageError } from '../lib/imagePlaceholder';
import { formatLongDateNoYear } from '../lib/dates';
import PageHero from '../components/ui/PageHero';
import ShareButtons from '../components/ui/ShareButtons';
import ticketHero from '../../assets/img/asc-camberene-equipe-2025.webp';

const Billetterie: React.FC = () => {
  const [params] = useSearchParams();
  const { data: matches, loading } = useMatches();

  const upcoming = useMemo(
    () => matches.filter((match) => match.status !== 'Terminé'),
    [matches]
  );

  const requested = params.get('match');
  const [selected, setSelected] = useState<string>('');
  const matchId = selected || (requested && upcoming.some((m) => String(m.id) === requested)
    ? requested
    : String(upcoming[0]?.id ?? ''));

  const [form, setForm] = useState({ name: '', phone: '', email: '', seats: '2', message: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>('');
  const [confirmation, setConfirmation] = useState<ReservationConfirmation | null>(null);

  const match = upcoming.find((entry) => String(entry.id) === matchId);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!matchId) return;

    setSending(true);
    setError('');
    try {
      const { confirmation: result } = await reserveTickets({
        match: matchId,
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        seats: Number(form.seats),
        message: form.message,
      });
      setConfirmation(result);
      setForm({ name: '', phone: '', email: '', seats: '2', message: '' });
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.fullMessage
          : "La réservation n'a pas pu être enregistrée. Réessayez dans un instant."
      );
    } finally {
      setSending(false);
    }
  };

  const field =
    'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-club-yellow';

  return (
    <div className="bg-graphite">
      <PageHero
        kicker="Billetterie"
        title="Réservez vos places"
        description="Retenez vos places pour les prochaines rencontres, réglez au guichet le jour du match."
        image={ticketHero}
      />

      <section className="site-container grid gap-8 py-12 lg:grid-cols-[1fr_400px]">
        <div>
          <h2 className="mb-4 text-lg font-extrabold uppercase text-white">Prochaines rencontres</h2>

          {loading ? (
            <p className="panel p-6 text-sm text-white/60">Chargement du calendrier…</p>
          ) : upcoming.length === 0 ? (
            <p className="panel p-6 text-sm text-white/60">
              Aucune rencontre programmée pour le moment. Revenez bientôt.
            </p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((entry) => {
                const active = String(entry.id) === matchId;
                return (
                  <button
                    key={String(entry.id)}
                    type="button"
                    onClick={() => setSelected(String(entry.id))}
                    aria-pressed={active}
                    className={`panel flex w-full items-center gap-4 p-4 text-left transition ${
                      active ? 'border-club-yellow/60 bg-club-yellow/5' : 'hover:border-white/20'
                    }`}
                  >
                    {entry.image && (
                      <img
                        src={entry.image}
                        alt=""
                        onError={handleImageError}
                        className="hidden h-14 w-14 shrink-0 rounded-lg border border-white/10 object-cover sm:block"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-extrabold uppercase text-white">
                        {entry.venue === 'Domicile'
                          ? `ASC Cambérène — ${entry.opponent}`
                          : `${entry.opponent} — ASC Cambérène`}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} />
                          {formatLongDateNoYear(entry.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={13} />
                          {entry.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={13} />
                          {entry.venue}
                        </span>
                      </p>
                    </div>
                    {active && <Ticket size={18} className="shrink-0 text-club-yellow" />}
                  </button>
                );
              })}
            </div>
          )}

          {match && (
            <div className="mt-6 border-t border-white/10 pt-6">
              <ShareButtons
                title={
                  match.venue === 'Domicile'
                    ? `ASC Cambérène — ${match.opponent}`
                    : `${match.opponent} — ASC Cambérène`
                }
                url={
                  typeof window !== 'undefined'
                    ? `${window.location.origin}/billetterie?match=${match.id}`
                    : undefined
                }
                label="Partager la rencontre"
              />
            </div>
          )}
        </div>

        <div className="panel h-fit p-6">
          {confirmation ? (
            <div className="text-center">
              <CheckCircle2 size={40} className="mx-auto mb-3 text-club-yellow" />
              <h2 className="text-lg font-extrabold uppercase text-white">Places retenues</h2>
              <p className="mt-2 text-sm text-white/70">
                {confirmation.seats} place(s) pour {confirmation.match.opponent}, le{' '}
                {formatLongDateNoYear(confirmation.match.date)} à {confirmation.match.time}.
              </p>
              <p className="mt-4 text-xs uppercase tracking-wide text-white/50">
                Référence à présenter au guichet
              </p>
              <p className="mt-1 font-mono text-2xl font-extrabold text-club-yellow">
                {confirmation.reference}
              </p>
              <p className="mt-4 text-xs text-white/50">
                Notez-la ou faites-en une capture. Le règlement se fait au stade, le jour du match.
              </p>
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                className="mt-6 rounded-full bg-white/10 px-5 py-2 text-xs font-semibold text-white hover:bg-white/20"
              >
                Réserver pour un autre match
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4 text-sm">
              <div>
                <h2 className="text-lg font-extrabold uppercase text-white">Votre réservation</h2>
                <p className="mt-1 text-xs text-white/60">
                  {match
                    ? `Pour ${match.venue === 'Domicile' ? `ASC Cambérène — ${match.opponent}` : `${match.opponent} — ASC Cambérène`}`
                    : 'Choisissez une rencontre dans la liste'}
                </p>
              </div>

              <div>
                <label htmlFor="ticket-name" className="mb-1 block text-xs text-white/60">Nom complet</label>
                <input
                  id="ticket-name"
                  required
                  value={form.name}
                  onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
                  className={field}
                />
              </div>

              <div>
                <label htmlFor="ticket-phone" className="mb-1 block text-xs text-white/60">Téléphone</label>
                <input
                  id="ticket-phone"
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setForm((f) => ({ ...f, phone: event.target.value }))}
                  placeholder="7X XX XX XX"
                  className={field}
                />
              </div>

              <div>
                <label htmlFor="ticket-email" className="mb-1 block text-xs text-white/60">
                  Email <span className="text-white/30">— facultatif</span>
                </label>
                <input
                  id="ticket-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((f) => ({ ...f, email: event.target.value }))}
                  className={field}
                />
              </div>

              <div>
                <label htmlFor="ticket-seats" className="mb-1 block text-xs text-white/60">
                  Nombre de places
                </label>
                <input
                  id="ticket-seats"
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={form.seats}
                  onChange={(event) => setForm((f) => ({ ...f, seats: event.target.value }))}
                  className={field}
                />
                <p className="mt-1 text-[11px] text-white/40">
                  Au-delà de 20 places, contactez directement le club.
                </p>
              </div>

              <textarea
                value={form.message}
                onChange={(event) => setForm((f) => ({ ...f, message: event.target.value }))}
                placeholder="Un mot pour le club — facultatif"
                rows={2}
                className={`${field} resize-none`}
              />

              {error && (
                <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={sending || !matchId}
                className="btn-yellow w-full justify-center disabled:opacity-60"
              >
                {sending ? 'Envoi…' : 'Retenir mes places'}
              </button>

              <p className="text-center text-[11px] text-white/40">
                Aucun paiement en ligne : vous réglez au guichet le jour du match.
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default Billetterie;
