import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, ScrollText, Search } from 'lucide-react';
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminFeedback';
import { useApiResource } from '../../hooks/useApiResource';
import { formatDateTime } from '../../lib/dates';
import { ROLE_LABELS, UserRole } from '../../lib/roles';
import { ListResponse } from '../../services/site/content.service';
import {
  ACTIVITY_CATEGORIES,
  ActivityCategory,
  ActivityLog,
  listActivityLogs,
} from '../../services/site/logs.service';

const PAGE_SIZE = 25;

const EMPTY: ListResponse<ActivityLog> = {
  success: true,
  data: [],
  pagination: { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 },
};

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  auth: 'Connexions',
  content: 'Contenu',
  accounts: 'Comptes',
  shop: 'Boutique',
  settings: 'Paramètres',
  media: 'Médias',
  visit: 'Visites',
  other: 'Autre',
};

const CATEGORY_BADGE: Record<ActivityCategory, string> = {
  auth: 'bg-club-yellow/15 text-club-yellow',
  content: 'bg-white/10 text-white',
  accounts: 'bg-blue-500/15 text-blue-200',
  shop: 'bg-emerald-500/15 text-emerald-200',
  settings: 'bg-purple-500/15 text-purple-200',
  media: 'bg-orange-500/15 text-orange-200',
  visit: 'bg-cyan-400/15 text-cyan-200',
  other: 'bg-white/5 text-white/50',
};

const ROLE_BADGE: Record<UserRole, string> = {
  superadmin: 'bg-club-yellow text-black',
  admin: 'bg-club-green text-white',
  journalist: 'bg-white/15 text-white',
  'shop-admin': 'bg-white/15 text-white',
  subscriber: 'bg-white/5 text-white/60',
};

type Range = 'today' | 'week' | 'month' | 'all';

const RANGE_LABELS: Record<Range, string> = {
  today: "Aujourd'hui",
  week: '7 derniers jours',
  month: '30 derniers jours',
  all: 'Tout',
};

const rangeStart = (range: Range): string | undefined => {
  const now = new Date();
  if (range === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }
  if (range === 'week') {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return start.toISOString();
  }
  if (range === 'month') {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return start.toISOString();
  }
  return undefined;
};

const Journal: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState<ActivityCategory | ''>('');
  const [range, setRange] = useState<Range>('today');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, loading, error, reload } = useApiResource(
    (signal) =>
      listActivityLogs(
        {
          page,
          limit: PAGE_SIZE,
          search: debouncedSearch,
          category,
          from: rangeStart(range),
        },
        signal
      ),
    EMPTY,
    { deps: [page, debouncedSearch, category, range] }
  );

  const items = data.data;
  const pagination = data.pagination;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-white">
            <ScrollText size={22} className="text-club-yellow" />
            Journal système
            {loading && items.length > 0 && <Loader2 size={15} className="animate-spin text-white/40" />}
          </h2>
          <p className="text-sm text-white/60">
            Historique des connexions et des actions effectuées dans l’administration.
          </p>
        </div>
      </div>

      <AdminError error={error} onRetry={reload} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <label htmlFor="log-search" className="sr-only">Rechercher dans le journal</label>
          <input
            id="log-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un compte, une action…"
            className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-11 pr-4 text-sm text-white placeholder-white/40 outline-none focus:border-club-yellow"
          />
        </div>

        <div>
          <label htmlFor="log-category" className="sr-only">Filtrer par catégorie</label>
          <select
            id="log-category"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value as ActivityCategory | '');
              setPage(1);
            }}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white outline-none focus:border-club-yellow"
          >
            <option value="" className="bg-graphite">Toutes les catégories</option>
            {ACTIVITY_CATEGORIES.map((value) => (
              <option key={value} value={value} className="bg-graphite">
                {CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="log-range" className="sr-only">Filtrer par période</label>
          <select
            id="log-range"
            value={range}
            onChange={(event) => {
              setRange(event.target.value as Range);
              setPage(1);
            }}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white outline-none focus:border-club-yellow"
          >
            {(Object.keys(RANGE_LABELS) as Range[]).map((value) => (
              <option key={value} value={value} className="bg-graphite">
                {RANGE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <AdminLoading label="Chargement du journal…" />
      ) : items.length === 0 ? (
        <AdminEmpty label="Aucune activité ne correspond à ces filtres." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/50">
                <tr>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Compte</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                  <th className="px-5 py-3 font-semibold">Catégorie</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 font-semibold">Contexte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((entry) => (
                  <tr key={entry.id} className="align-top hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-white/60">
                      {formatDateTime(entry.created_at, '—')}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">
                        {entry.actor_name || (entry.visitor_id ? 'Visiteur anonyme' : 'Visiteur')}
                      </p>
                      <p className="text-xs text-white/50">
                        {entry.actor_email ||
                          (entry.visitor_id ? `id ${entry.visitor_id.slice(0, 8)}…` : '—')}
                      </p>
                      {entry.actor_role && (
                        <span
                          className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${ROLE_BADGE[entry.actor_role]}`}
                        >
                          {ROLE_LABELS[entry.actor_role]}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{entry.description}</p>
                      <p className="mt-1 font-mono text-[11px] text-white/40">{entry.action}</p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${CATEGORY_BADGE[entry.category]}`}
                      >
                        {CATEGORY_LABELS[entry.category]}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs">
                      {entry.status === undefined ? (
                        <span className="text-white/40">—</span>
                      ) : (
                        <span className={entry.status >= 400 ? 'text-red-300' : 'text-emerald-300'}>
                          {entry.status}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-xs text-white/50">
                      <span className="font-mono">{entry.ip || '—'}</span>
                      {entry.path && (
                        <p
                          className="mt-1 max-w-[240px] truncate font-mono text-[10px] text-white/30"
                          title={`${entry.method ?? ''} ${entry.path}`}
                        >
                          {entry.method} {entry.path}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/50">
            <span>
              {pagination.total} entrée(s) — page {pagination.page} / {Math.max(1, pagination.totalPages)}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="flex items-center gap-1 rounded-full bg-white/5 px-4 py-2 text-white/70 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft size={14} /> Précédent
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((value) => value + 1)}
                className="flex items-center gap-1 rounded-full bg-white/5 px-4 py-2 text-white/70 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Suivant <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Journal;
