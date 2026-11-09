import React, { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import useEditableResource from '../../hooks/useEditableResource';
import { useTeams } from '../../hooks/useContent';
import { teamMembers as teamMembersApi, TeamMemberRecord } from '../../services/site/content.service';
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminFeedback';
import { ApiError } from '../../lib/api';
import { IMAGE_PLACEHOLDER, handleImageError } from '../../lib/imagePlaceholder';
import { PLAYER_TEAM_LABELS, TeamMember } from '../../types';

type Stats = TeamMember['stats'];
type StatKey = keyof Stats;

const STAT_COLUMNS: { key: StatKey; label: string; short: string }[] = [
  { key: 'matches', label: 'Matchs joués', short: 'MJ' },
  { key: 'goals', label: 'Buts', short: 'Buts' },
  { key: 'assists', label: 'Passes décisives', short: 'Passes' },
];

const LINE_ORDER = ['Gardien', 'Défenseur', 'Milieu', 'Attaquant'];

const statsOf = (member: TeamMemberRecord): Stats => ({
  matches: member.stats?.matches ?? 0,
  goals: member.stats?.goals ?? 0,
  assists: member.stats?.assists ?? 0,
  yellowCards: member.stats?.yellowCards ?? 0,
  redCards: member.stats?.redCards ?? 0,
});

const sameStats = (a: Stats, b: Stats) => STAT_COLUMNS.every(({ key }) => a[key] === b[key]);

const StatistiquesAdmin: React.FC = () => {
  const { data: teams } = useTeams();
  const { items: members, loading, error, reload } = useEditableResource<TeamMemberRecord>(teamMembersApi, {
    kind: 'player',
    limit: 100,
  });

  const [team, setTeam] = useState('');
  const [drafts, setDrafts] = useState<Record<string, Stats>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<ApiError | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  useEffect(() => {
    if (team || teams.length === 0) return;
    const withPlayers = teams.find((entry) => members.some((member) => member.team === entry.slug));
    setTeam((withPlayers ?? teams[0]).slug);
  }, [teams, members, team]);

  const teamName = (slug: string) =>
    teams.find((entry) => entry.slug === slug)?.name ?? PLAYER_TEAM_LABELS[slug] ?? slug;

  const players = useMemo(
    () =>
      members
        .filter((member) => member.team === team)
        .sort(
          (a, b) =>
            LINE_ORDER.indexOf(a.line) - LINE_ORDER.indexOf(b.line) ||
            (a.number || 99) - (b.number || 99) ||
            a.name.localeCompare(b.name)
        ),
    [members, team]
  );

  const valueOf = (member: TeamMemberRecord): Stats => drafts[member.id] ?? statsOf(member);

  const changed = players.filter((member) => drafts[member.id] && !sameStats(drafts[member.id], statsOf(member)));

  const edit = (member: TeamMemberRecord, key: StatKey, raw: string) => {
    const parsed = Math.floor(Number(raw));
    const value = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    setSavedCount(null);
    setDrafts((current) => ({ ...current, [member.id]: { ...valueOf(member), [key]: value } }));
  };

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    let done = 0;
    try {
      for (const member of changed) {
        await teamMembersApi.update(member.id, { stats: drafts[member.id] });
        done += 1;
      }
      setDrafts({});
      setSavedCount(done);
    } catch (cause) {
      setSaveError(cause instanceof ApiError ? cause : new ApiError(0, 'Enregistrement impossible.'));
    } finally {
      setSaving(false);
      reload();
    }
  };

  const switchTeam = (slug: string) => {
    if (changed.length > 0 && !window.confirm('Des modifications ne sont pas enregistrées. Changer d’équipe quand même ?')) return;
    setDrafts({});
    setSavedCount(null);
    setTeam(slug);
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="mb-1 text-2xl font-bold text-white">Statistiques</h2>
          <p className="text-sm text-white/60">
            Tous les joueurs de l’effectif, équipe par équipe. Visible sur la page de l’équipe.
            <br />
            Les buts et passes décisives saisis dans les feuilles de match (onglet Calendrier) s’ajoutent ici automatiquement.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={team}
            onChange={(e) => switchTeam(e.target.value)}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:border-club-yellow focus:outline-none"
          >
            {teams.map((entry) => (
              <option key={entry.slug} value={entry.slug} className="bg-black">
                {entry.name} ({members.filter((member) => member.team === entry.slug).length})
              </option>
            ))}
          </select>
          <button
            onClick={() => void save()}
            disabled={saving || changed.length === 0}
            className="flex items-center justify-center gap-2 rounded-full bg-club-yellow px-5 py-2.5 text-xs font-semibold text-black shadow disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? 'Enregistrement…' : changed.length > 0 ? `Enregistrer (${changed.length})` : 'Enregistré'}
          </button>
        </div>
      </div>

      <AdminError error={error ?? saveError} onRetry={reload} />
      {savedCount !== null && savedCount > 0 && (
        <p className="mb-4 rounded-lg bg-green-500/15 px-4 py-2 text-xs text-green-300">
          {savedCount} joueur{savedCount > 1 ? 's' : ''} mis à jour.
        </p>
      )}

      {loading ? (
        <AdminLoading label="Chargement de l’effectif…" />
      ) : players.length === 0 ? (
        <AdminEmpty label={`Aucun joueur dans ${teamName(team)}. Ajoutez-en depuis l’onglet Effectif.`} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-white/60">
              <tr>
                <th className="px-4 py-3 text-left">Joueur</th>
                {STAT_COLUMNS.map((column) => (
                  <th key={column.key} className="px-2 py-3 text-center" title={column.label}>
                    {column.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/80">
              {players.map((member) => {
                const stats = valueOf(member);
                const dirty = changed.includes(member);
                return (
                  <tr key={member.id} className={dirty ? 'bg-club-yellow/[0.06]' : 'hover:bg-white/5'}>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.photo || IMAGE_PLACEHOLDER}
                          onError={handleImageError}
                          alt=""
                          className="h-9 w-9 rounded-full border border-white/10 object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">
                            {member.number > 0 && <span className="mr-1.5 text-club-yellow">{member.number}</span>}
                            {member.name}
                          </p>
                          <p className="text-[11px] text-white/40">{member.line}</p>
                        </div>
                      </div>
                    </td>
                    {STAT_COLUMNS.map((column) => (
                      <td key={column.key} className="px-2 py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          aria-label={`${column.label} — ${member.name}`}
                          value={stats[column.key]}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => edit(member, column.key, e.target.value)}
                          className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center text-white outline-none focus:border-club-yellow"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StatistiquesAdmin;
