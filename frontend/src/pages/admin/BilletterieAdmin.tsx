import React, { useCallback, useMemo, useState } from 'react';
import { Phone, Search, Ticket, Users } from 'lucide-react';
import {
  deleteReservation,
  listReservations,
  updateReservation,
} from '../../services/site/tickets.service';
import useApiResource from '../../hooks/useApiResource';
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminFeedback';
import { ApiError } from '../../lib/api';
import {
  RESERVATION_STATUSES,
  RESERVATION_STATUS_LABELS,
  ReservationStatus,
  TicketReservation,
} from '../../types';
import AdminConfirmDelete from '../../components/admin/AdminConfirmDelete';
import { formatDayMonth } from '../../lib/dates';

const STATUS_STYLES: Record<ReservationStatus, string> = {
  nouvelle: 'bg-club-yellow/20 text-club-yellow',
  confirmee: 'bg-green-500/20 text-green-300',
  honoree: 'bg-white/10 text-white/60',
  annulee: 'bg-red-500/20 text-red-300',
};

const BilletterieAdmin: React.FC = () => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<ApiError | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<{ id: string; value: string } | null>(null);

  const { data: reservations, loading, error, reload } = useApiResource<TicketReservation[]>(
    (signal) => listReservations({}, signal),
    []
  );

  const run = useCallback(
    async (operation: () => Promise<unknown>) => {
      setSaving(true);
      setActionError(null);
      try {
        await operation();
        reload();
        return true;
      } catch (cause) {
        setActionError(
          cause instanceof ApiError ? cause : new ApiError(0, 'Opération impossible.')
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [reload]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return reservations.filter((reservation) => {
      const matchesQuery =
        !needle ||
        reservation.name.toLowerCase().includes(needle) ||
        reservation.phone.includes(needle) ||
        reservation.reference.toLowerCase().includes(needle) ||
        (reservation.match?.opponent ?? '').toLowerCase().includes(needle);
      return matchesQuery && (!statusFilter || reservation.status === statusFilter);
    });
  }, [reservations, query, statusFilter]);

  const groups = useMemo(() => {
    const byMatch = new Map<string, { label: string; date: string; rows: TicketReservation[] }>();

    filtered.forEach((reservation) => {
      const match = reservation.match;

      const key = match?.id ? String(match.id) : 'sans-match';
      const label = match
        ? match.venue === 'Domicile'
          ? `ASC Cambérène — ${match.opponent}`
          : `${match.opponent} — ASC Cambérène`
        : 'Rencontre supprimée';

      if (!byMatch.has(key)) byMatch.set(key, { label, date: match?.date ?? '', rows: [] });
      byMatch.get(key)!.rows.push(reservation);
    });

    return [...byMatch.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  const totals = useMemo(() => {
    const active = reservations.filter((r) => r.status !== 'annulee');
    return {
      toHandle: reservations.filter((r) => r.status === 'nouvelle').length,
      seats: active.reduce((sum, r) => sum + r.seats, 0),
    };
  }, [reservations]);

  const saveNote = async (reservation: TicketReservation) => {
    if (!noteDraft || noteDraft.id !== reservation.id) return;
    const value = noteDraft.value;
    setNoteDraft(null);
    if (value === reservation.note) return;
    await run(() => updateReservation(reservation.id, { note: value }));
  };

  const confirmRemoval = async () => {
    if (!confirmDelete) return;
    if (await run(() => deleteReservation(confirmDelete))) setConfirmDelete(null);
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-white">
            <Ticket size={20} className="text-club-yellow" />
            Billetterie
          </h2>
          <p className="text-sm text-white/60">
            {totals.toHandle} à traiter · {totals.seats} place(s) réservée(s)
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <label htmlFor="ticket-search" className="sr-only">Rechercher une réservation</label>
            <input
              id="ticket-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nom, téléphone, référence…"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-xs text-white placeholder-white/40 outline-none focus:border-club-yellow"
            />
          </div>
          <label htmlFor="ticket-status" className="sr-only">Filtrer par état</label>
          <select
            id="ticket-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-club-yellow"
          >
            <option value="">Toutes</option>
            {RESERVATION_STATUSES.map((status) => (
              <option key={status} value={status} className="bg-graphite">
                {RESERVATION_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <AdminError error={error ?? actionError} onRetry={reload} />

      {loading ? (
        <AdminLoading label="Chargement des réservations…" />
      ) : groups.length === 0 ? (
        <AdminEmpty
          label={
            reservations.length === 0
              ? 'Aucune réservation pour le moment'
              : 'Aucune réservation ne correspond à la recherche'
          }
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => {
            const seats = group.rows
              .filter((row) => row.status !== 'annulee')
              .reduce((sum, row) => sum + row.seats, 0);

            return (
              <section key={group.label + group.date}>
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-white">
                    {group.label}
                    <span className="ml-2 font-normal normal-case text-white/40">
                      {formatDayMonth(group.date, '—')}
                    </span>
                  </h3>
                  <p className="flex items-center gap-1.5 text-xs text-club-yellow">
                    <Users size={13} />
                    {seats} place(s) · {group.rows.length} réservation(s)
                  </p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
                  <table className="min-w-full text-sm">
                    <thead className="text-xs uppercase tracking-wide text-white/60">
                      <tr>
                        <th className="px-4 py-3 text-left">Référence</th>
                        <th className="px-4 py-3 text-left">Supporter</th>
                        <th className="px-4 py-3 text-left">Places</th>
                        <th className="px-4 py-3 text-left">Note interne</th>
                        <th className="px-4 py-3 text-left">État</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/70">
                      {group.rows.map((reservation) => (
                        <tr key={reservation.id} className="hover:bg-white/5">
                          <td className="whitespace-nowrap px-4 py-3">
                            <p className="font-mono text-xs font-semibold text-club-yellow">
                              {reservation.reference}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-white">{reservation.name}</p>
                            <a
                              href={`tel:${reservation.phone.replace(/\s/g, '')}`}
                              className="flex items-center gap-1 text-[11px] text-white/50 hover:text-club-yellow"
                            >
                              <Phone size={11} />
                              {reservation.phone}
                            </a>
                            {reservation.message && (
                              <p className="mt-1 line-clamp-2 text-[11px] italic text-white/40">
                                « {reservation.message} »
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-lg font-extrabold text-white">
                            {reservation.seats}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              value={
                                noteDraft?.id === reservation.id ? noteDraft.value : reservation.note
                              }
                              onChange={(event) =>
                                setNoteDraft({ id: reservation.id, value: event.target.value })
                              }
                              onBlur={() => saveNote(reservation)}
                              placeholder="Rappelé le…"
                              aria-label={`Note sur la réservation ${reservation.reference}`}
                              className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none focus:border-club-yellow"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <label htmlFor={`status-${reservation.id}`} className="sr-only">
                              État de la réservation {reservation.reference}
                            </label>
                            <select
                              id={`status-${reservation.id}`}
                              value={reservation.status}
                              disabled={saving}
                              onChange={(event) =>
                                run(() =>
                                  updateReservation(reservation.id, {
                                    status: event.target.value as ReservationStatus,
                                  })
                                )
                              }
                              className={`rounded-full px-2 py-1 text-[10px] font-semibold outline-none ${STATUS_STYLES[reservation.status]}`}
                            >
                              {RESERVATION_STATUSES.map((status) => (
                                <option key={status} value={status} className="bg-graphite text-white">
                                  {RESERVATION_STATUS_LABELS[status]}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(reservation.id)}
                              className="rounded-full bg-red-500/30 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/40"
                            >
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {confirmDelete && (
        <AdminConfirmDelete
          title="Supprimer la réservation"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmRemoval}
          saving={saving}
        >
          Le supporter n’en sera pas averti. Pour garder la trace d’un désistement, préférez l’état « Annulée ».
        </AdminConfirmDelete>
      )}
    </div>
  );
};

export default BilletterieAdmin;
