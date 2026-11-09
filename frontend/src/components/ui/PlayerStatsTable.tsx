import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { TeamMember } from '../../types';
import { IMAGE_PLACEHOLDER, handleImageError } from '../../lib/imagePlaceholder';

type StatKey = keyof TeamMember['stats'];

const COLUMNS: { key: StatKey; label: string; short: string }[] = [
  { key: 'matches', label: 'Matchs joués', short: 'MJ' },
  { key: 'goals', label: 'Buts', short: 'Buts' },
  { key: 'assists', label: 'Passes décisives', short: 'Passes' },
];

const PlayerStatsTable: React.FC<{ players: TeamMember[] }> = ({ players }) => {
  const [sortKey, setSortKey] = useState<StatKey>('goals');

  const rows = useMemo(
    () =>
      [...players].sort(
        (a, b) =>
          (b.stats?.[sortKey] ?? 0) - (a.stats?.[sortKey] ?? 0) ||
          (b.stats?.matches ?? 0) - (a.stats?.matches ?? 0) ||
          a.name.localeCompare(b.name)
      ),
    [players, sortKey]
  );

  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-white/50">
            <th className="w-10 px-4 py-4 text-left">#</th>
            <th className="px-2 py-4 text-left">Joueur</th>
            {COLUMNS.map((column) => (
              <th key={column.key} className="px-2 py-4 text-center" aria-sort={sortKey === column.key ? 'descending' : undefined}>
                <button
                  type="button"
                  onClick={() => setSortKey(column.key)}
                  title={`Trier par ${column.label.toLowerCase()}`}
                  className={`inline-flex items-center gap-1 font-bold uppercase transition-colors hover:text-white ${
                    sortKey === column.key ? 'text-club-yellow' : ''
                  }`}
                >
                  {column.short}
                  {sortKey === column.key && <ChevronDown size={13} />}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((player, index) => (
            <tr key={player.id} className="transition-colors hover:bg-white/[0.04]">
              <td className="px-4 py-3 font-bold text-white/40">{index + 1}</td>
              <td className="px-2 py-3">
                <div className="flex items-center gap-3">
                  <img
                    src={player.photo || IMAGE_PLACEHOLDER}
                    onError={handleImageError}
                    alt=""
                    loading="lazy"
                    className="h-10 w-10 shrink-0 rounded-full border border-white/10 object-cover object-top"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-extrabold uppercase text-white">{player.name}</p>
                    <p className="text-xs text-white/50">
                      {player.number > 0 && <span className="mr-1.5 font-bold text-club-yellow">N°{player.number}</span>}
                      {player.position || player.line}
                    </p>
                  </div>
                </div>
              </td>
              {COLUMNS.map((column) => {
                const value = player.stats?.[column.key] ?? 0;
                return (
                  <td
                    key={column.key}
                    className={`px-2 py-3 text-center text-base font-extrabold tabular-nums ${
                      value === 0 ? 'text-white/25' : sortKey === column.key ? 'text-club-yellow' : 'text-white'
                    }`}
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PlayerStatsTable;
