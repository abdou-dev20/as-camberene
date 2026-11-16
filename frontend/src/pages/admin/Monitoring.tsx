import React, { useEffect } from 'react';
import {
  Activity,
  CalendarClock,
  CalendarDays,
  Eye,
  Radio,
  RefreshCw,
  Users,
} from 'lucide-react';
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminFeedback';
import { useApiResource } from '../../hooks/useApiResource';
import { formatDate, formatDateTime } from '../../lib/dates';
import { ROLE_LABELS } from '../../lib/roles';
import { MonitoringSummary, getMonitoring } from '../../services/site/logs.service';

const EMPTY: MonitoringSummary = {
  generated_at: '',
  counts: { online: 0, today: 0, week: 0, month: 0 },
  visitors: { online: 0, today: 0, week: 0, month: 0 },
  pageviews: { today: 0, week: 0, month: 0 },
  online: [],
  online_visitors: [],
  recent_sessions: [],
  recent_visits: [],
  logins_by_day: [],
};

const relativeTime = (value?: string): string => {
  if (!value) return '—';
  const diff = Date.now() - new Date(value).getTime();
  if (Number.isNaN(diff)) return '—';

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;

  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
};

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

const shortVisitor = (visitorId?: string): string =>
  visitorId ? `Visiteur ${visitorId.slice(0, 8)}…` : 'Visiteur';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint: string;
  accent: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, hint, accent }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
    <div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>
      {icon}
    </div>
    <p className="text-3xl font-bold text-white">{value}</p>
    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/60">{label}</p>
    <p className="mt-1 text-[11px] text-white/35">{hint}</p>
  </div>
);

const Monitoring: React.FC = () => {
  const { data, loading, error, reload } = useApiResource((signal) => getMonitoring(signal), EMPTY);

  useEffect(() => {
    const timer = setInterval(reload, 30_000);
    return () => clearInterval(timer);
  }, [reload]);

  const maxLogins = Math.max(1, ...data.logins_by_day.map((point) => point.count));
  const firstDay = data.logins_by_day[0]?.date;
  const lastDay = data.logins_by_day[data.logins_by_day.length - 1]?.date;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-white">
            <Activity size={22} className="text-club-yellow" />
            Monitoring
          </h2>
          <p className="text-sm text-white/60">
            Fréquentation du site et présence des comptes sur la plateforme.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data.generated_at && (
            <span className="text-[11px] text-white/40">
              Mis à jour {relativeTime(data.generated_at)}
            </span>
          )}
          <button
            type="button"
            onClick={reload}
            className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 transition-colors hover:bg-white/10"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      <AdminError error={error} onRetry={reload} />

      {loading && !data.generated_at ? (
        <AdminLoading label="Chargement du monitoring…" />
      ) : (
        <>
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              Visiteurs du site
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={<Radio size={18} />}
                label="En ligne"
                value={data.visitors.online}
                hint="Actifs ces 5 dernières minutes"
                accent="bg-cyan-400/15 text-cyan-200"
              />
              <StatCard
                icon={<Eye size={18} />}
                label="Aujourd'hui"
                value={data.visitors.today}
                hint={`${data.pageviews.today} page(s) vue(s)`}
                accent="bg-club-yellow/15 text-club-yellow"
              />
              <StatCard
                icon={<CalendarDays size={18} />}
                label="Cette semaine"
                value={data.visitors.week}
                hint={`${data.pageviews.week} page(s) vue(s)`}
                accent="bg-blue-400/15 text-blue-200"
              />
              <StatCard
                icon={<CalendarClock size={18} />}
                label="Ce mois"
                value={data.visitors.month}
                hint={`${data.pageviews.month} page(s) vue(s)`}
                accent="bg-purple-400/15 text-purple-200"
              />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              Comptes de l’administration
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={<Users size={18} />}
                label="En ligne"
                value={data.counts.online}
                hint="Actifs ces 5 dernières minutes"
                accent="bg-emerald-400/15 text-emerald-300"
              />
              <StatCard
                icon={<CalendarDays size={18} />}
                label="Aujourd'hui"
                value={data.counts.today}
                hint="Comptes distincts"
                accent="bg-club-yellow/15 text-club-yellow"
              />
              <StatCard
                icon={<CalendarDays size={18} />}
                label="Cette semaine"
                value={data.counts.week}
                hint="Depuis lundi"
                accent="bg-blue-400/15 text-blue-200"
              />
              <StatCard
                icon={<CalendarClock size={18} />}
                label="Ce mois"
                value={data.counts.month}
                hint="Depuis le 1er du mois"
                accent="bg-purple-400/15 text-purple-200"
              />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold text-white">
                  <Eye size={16} className="text-cyan-200" />
                  Visiteurs en ligne
                </h3>
                <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-white/60">
                  {data.online_visitors.length}
                </span>
              </div>

              {data.online_visitors.length === 0 ? (
                <p className="py-10 text-center text-xs text-white/40">
                  Aucun visiteur en ligne pour le moment.
                </p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {data.online_visitors.map((entry) => (
                    <li key={entry.visitor_id} className="flex items-center gap-3 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-200">
                        <Eye size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {entry.last_path || '/'}
                        </p>
                        <p className="truncate text-xs text-white/50">
                          {shortVisitor(entry.visitor_id)} · {entry.page_views} page(s)
                        </p>
                      </div>
                      <div className="shrink-0 text-right text-[11px] text-white/50">
                        <p>{relativeTime(entry.last_seen_at)}</p>
                        <p>{entry.ip || '—'}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold text-white">
                  <Radio size={16} className="text-emerald-300" />
                  Comptes connectés
                </h3>
                <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-white/60">
                  {data.online.length}
                </span>
              </div>

              {data.online.length === 0 ? (
                <p className="py-10 text-center text-xs text-white/40">
                  Personne n’est connecté pour le moment.
                </p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {data.online.map((entry) => (
                    <li key={entry.id} className="flex items-center gap-3 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-bold text-club-yellow">
                        {initials(entry.name || entry.email)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {entry.name || entry.email}
                        </p>
                        <p className="truncate text-xs text-white/50">{entry.email}</p>
                      </div>
                      <div className="shrink-0 text-right text-[11px] text-white/50">
                        <p className="text-white/70">{ROLE_LABELS[entry.role]}</p>
                        <p>
                          {relativeTime(entry.last_seen_at)}
                          {entry.ip ? ` · ${entry.ip}` : ''}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <h3 className="flex items-center gap-2 font-semibold text-white">
              <CalendarDays size={16} className="text-club-yellow" />
              Connexions des comptes sur 14 jours
            </h3>

            {data.logins_by_day.length === 0 ? (
              <p className="py-10 text-center text-xs text-white/40">Aucune connexion enregistrée.</p>
            ) : (
              <>
                <div className="mt-6 flex items-end gap-1.5">
                  {data.logins_by_day.map((point) => (
                    <div
                      key={point.date}
                      className="flex flex-1 flex-col items-center gap-1"
                      title={`${point.date} : ${point.count} connexion(s)`}
                    >
                      <span className="h-3 text-[9px] text-white/40">{point.count || ''}</span>
                      <div
                        className="w-full rounded-t bg-club-yellow/70"
                        style={{
                          height: `${4 + Math.round((point.count / maxLogins) * 96)}px`,
                        }}
                      />
                      <span className="text-[9px] text-white/30">
                        {formatDate(point.date, { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-white/30">
                  <span>{formatDate(firstDay, { day: '2-digit', month: '2-digit' })}</span>
                  <span>{formatDate(lastDay, { day: '2-digit', month: '2-digit' })}</span>
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
              <Eye size={16} className="text-cyan-200" />
              Dernières visites
            </h3>

            {data.recent_visits.length === 0 ? (
              <AdminEmpty label="Aucune visite enregistrée." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-white/40">
                    <tr>
                      <th className="py-2 pr-4 font-semibold">Page</th>
                      <th className="py-2 pr-4 font-semibold">Visiteur</th>
                      <th className="py-2 pr-4 font-semibold">Date</th>
                      <th className="py-2 font-semibold">Adresse IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.recent_visits.map((visit) => (
                      <tr key={visit.id}>
                        <td className="py-3 pr-4">
                          <p className="max-w-[340px] truncate font-semibold text-white">
                            {visit.path || visit.description}
                          </p>
                        </td>
                        <td className="py-3 pr-4 text-xs text-white/60">
                          {visit.actor_name || shortVisitor(visit.visitor_id)}
                        </td>
                        <td className="py-3 pr-4 text-xs text-white/60">
                          {formatDateTime(visit.created_at, '—')}
                        </td>
                        <td className="py-3 text-xs text-white/60">
                          <span className="font-mono">{visit.ip || '—'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
              <Users size={16} className="text-club-yellow" />
              Dernières sessions
            </h3>

            {data.recent_sessions.length === 0 ? (
              <AdminEmpty label="Aucune session enregistrée." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-white/40">
                    <tr>
                      <th className="py-2 pr-4 font-semibold">Utilisateur</th>
                      <th className="py-2 pr-4 font-semibold">Profil</th>
                      <th className="py-2 pr-4 font-semibold">Début</th>
                      <th className="py-2 pr-4 font-semibold">Dernière activité</th>
                      <th className="py-2 font-semibold">État</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.recent_sessions.map((session) => (
                      <tr key={session.session_id}>
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-white">{session.name || session.email}</p>
                          <p className="text-xs text-white/50">{session.email}</p>
                        </td>
                        <td className="py-3 pr-4 text-xs text-white/60">
                          {ROLE_LABELS[session.role]}
                        </td>
                        <td className="py-3 pr-4 text-xs text-white/60">
                          {formatDateTime(session.started_at, '—')}
                        </td>
                        <td className="py-3 pr-4 text-xs text-white/60">
                          {formatDateTime(session.last_seen_at, '—')}
                        </td>
                        <td className="py-3 text-xs">
                          <span
                            className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                              session.ended_at
                                ? 'bg-white/5 text-white/50'
                                : 'bg-emerald-400/15 text-emerald-300'
                            }`}
                          >
                            {session.ended_at ? 'Terminée' : 'En cours'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Monitoring;
