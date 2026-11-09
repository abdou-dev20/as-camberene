import React, { useCallback, useMemo, useState } from 'react';
import { HandHeart, Phone, Search } from 'lucide-react';
import { listDonations, updateDonation } from '../../services/site/donations.service';
import useApiResource from '../../hooks/useApiResource';
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminFeedback';
import { ApiError } from '../../lib/api';
import { formatCFA } from '../../lib/currency';
import {
  DONATION_STATUSES,
  DONATION_STATUS_LABELS,
  Donation,
  DonationStatus,
} from '../../types';

const STATUS_STYLES: Record<DonationStatus, string> = {
  en_attente: 'bg-club-yellow/20 text-club-yellow',
  payee: 'bg-green-500/20 text-green-300',
  annulee: 'bg-white/10 text-white/60',
  echouee: 'bg-red-500/20 text-red-300',
};

const formatDateTime = (value?: string): string =>
  value
    ? new Date(value).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

/**
 * Dons reçus par PayTech.
 *
 * Le statut se met à jour seul, sur la notification de PayTech. Le sélecteur
 * ne sert qu'au rattrapage : un paiement constaté dans le tableau de bord
 * PayTech dont la notification se serait perdue.
 */
const DonsAdmin: React.FC = () => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<ApiError | null>(null);
  const [noteDraft, setNoteDraft] = useState<{ id: string; value: string } | null>(null);

  const { data: donations, loading, error, reload } = useApiResource<Donation[]>(
    (signal) => listDonations(signal),
    []
  );

  const run = useCallback(
    async (operation: () => Promise<unknown>) => {
      setSaving(true);
      setActionError(null);
      try {
        await operation();
        reload();
      } catch (cause) {
        setActionError(cause instanceof ApiError ? cause : new ApiError(0, 'Opération impossible.'));
      } finally {
        setSaving(false);
      }
    },
    [reload]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return donations.filter((donation) => {
      const matchesQuery =
        !needle ||
        donation.name.toLowerCase().includes(needle) ||
        (donation.phone ?? '').includes(needle) ||
        (donation.email ?? '').toLowerCase().includes(needle) ||
        donation.reference.toLowerCase().includes(needle);
      return matchesQuery && (!statusFilter || donation.status === statusFilter);
    });
  }, [donations, query, statusFilter]);

  const totals = useMemo(() => {
    const paid = donations.filter((d) => d.status === 'payee');
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const amountOf = (d: Donation) => d.paidAmount ?? d.amount;
    return {
      count: paid.length,
      total: paid.reduce((sum, d) => sum + amountOf(d), 0),
      month: paid
        .filter((d) => d.paidAt && new Date(d.paidAt) >= monthStart)
        .reduce((sum, d) => sum + amountOf(d), 0),
    };
  }, [donations]);

  const saveNote = async (donation: Donation) => {
    if (!noteDraft || noteDraft.id !== donation.id) return;
    const value = noteDraft.value;
    setNoteDraft(null);
    if (value === donation.note) return;
    await run(() => updateDonation(donation.id, { note: value }));
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-white">
            <HandHeart size={20} className="text-club-yellow" />
            Dons
          </h2>
          <p className="text-sm text-white/60">Paiements reçus par PayTech</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <label htmlFor="don-search" className="sr-only">Rechercher un don</label>
            <input
              id="don-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nom, téléphone, référence…"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-xs text-white placeholder-white/40 outline-none focus:border-club-yellow"
            />
          </div>
          <label htmlFor="don-status" className="sr-only">Filtrer par état</label>
          <select
            id="don-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-club-yellow"
          >
            <option value="">Tous</option>
            {DONATION_STATUSES.map((status) => (
              <option key={status} value={status} className="bg-graphite">
                {DONATION_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Total collecté', value: formatCFA(totals.total) },
          { label: 'Ce mois-ci', value: formatCFA(totals.month) },
          { label: 'Dons payés', value: String(totals.count) },
        ].map((tile) => (
          <div key={tile.label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-xs uppercase tracking-wide text-white/50">{tile.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-white">{tile.value}</p>
          </div>
        ))}
      </div>

      <AdminError error={error ?? actionError} onRetry={reload} />

      {loading ? (
        <AdminLoading label="Chargement des dons…" />
      ) : filtered.length === 0 ? (
        <AdminEmpty
          label={donations.length === 0 ? 'Aucun don pour le moment' : 'Aucun don ne correspond à la recherche'}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-white/60">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Donateur</th>
                <th className="px-4 py-3 text-right">Montant</th>
                <th className="px-4 py-3 text-left">Moyen</th>
                <th className="px-4 py-3 text-left">Note interne</th>
                <th className="px-4 py-3 text-left">État</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/70">
              {filtered.map((donation) => (
                <tr key={donation.id} className="hover:bg-white/5">
                  <td className="whitespace-nowrap px-4 py-3">
                    <p className="text-xs">{formatDateTime(donation.paidAt ?? donation.created_at)}</p>
                    <p className="font-mono text-[11px] font-semibold text-club-yellow">{donation.reference}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">
                      {donation.name}
                      {donation.anonymous && (
                        <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">
                          anonyme
                        </span>
                      )}
                    </p>
                    {donation.phone && (
                      <a
                        href={`tel:${donation.phone.replace(/\s/g, '')}`}
                        className="flex items-center gap-1 text-[11px] text-white/50 hover:text-club-yellow"
                      >
                        <Phone size={11} />
                        {donation.phone}
                      </a>
                    )}
                    {donation.email && <p className="text-[11px] text-white/50">{donation.email}</p>}
                    {donation.message && (
                      <p className="mt-1 line-clamp-2 text-[11px] italic text-white/40">« {donation.message} »</p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-extrabold text-white">
                    {formatCFA(donation.paidAmount ?? donation.amount)}
                  </td>
                  <td className="px-4 py-3 text-xs">{donation.paymentMethod || '—'}</td>
                  <td className="px-4 py-3">
                    <input
                      value={noteDraft?.id === donation.id ? noteDraft.value : donation.note}
                      onChange={(event) => setNoteDraft({ id: donation.id, value: event.target.value })}
                      onBlur={() => saveNote(donation)}
                      placeholder="Remercié le…"
                      aria-label={`Note sur le don ${donation.reference}`}
                      className="w-full min-w-[140px] rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none focus:border-club-yellow"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <label htmlFor={`don-status-${donation.id}`} className="sr-only">
                      État du don {donation.reference}
                    </label>
                    <select
                      id={`don-status-${donation.id}`}
                      value={donation.status}
                      disabled={saving}
                      onChange={(event) =>
                        run(() => updateDonation(donation.id, { status: event.target.value as DonationStatus }))
                      }
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold outline-none ${STATUS_STYLES[donation.status]}`}
                    >
                      {DONATION_STATUSES.map((status) => (
                        <option key={status} value={status} className="bg-graphite text-white">
                          {DONATION_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DonsAdmin;
