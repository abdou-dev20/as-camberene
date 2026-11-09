import { FcTeam, FcTeamPlayerRef } from '../../types/fconnect';
import { getTeams, TeamFilters } from './teams.service';

const isPopulated = (value: FcTeamPlayerRef | string): value is FcTeamPlayerRef =>
  typeof value === 'object' && value !== null;

const rosterOf = (team: FcTeam): FcTeamPlayerRef[] =>
  (team.players ?? []).filter(isPopulated);

export const getClubRoster = async (
  filters: TeamFilters = {},
  signal?: AbortSignal
): Promise<FcTeamPlayerRef[]> => {
  const teams = await getTeams(filters, signal);

  const byId = new Map<string, FcTeamPlayerRef>();
  for (const team of teams) {
    for (const player of rosterOf(team)) {
      if (!byId.has(player.id)) byId.set(player.id, player);
    }
  }

  return [...byId.values()];
};
