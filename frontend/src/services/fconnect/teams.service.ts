import { fconnectApi } from '../../lib/api';
import { CLUB_ID } from '../../config/env';
import { FcDataResponse, FcTeam, FcTeamCategory } from '../../types/fconnect';

export interface TeamFilters {
  category?: FcTeamCategory;
  season?: string;
  status?: 'active' | 'inactive' | 'disbanded';
  page?: number;
  limit?: number;
}

export const getTeams = async (
  filters: TeamFilters = {},
  signal?: AbortSignal
): Promise<FcTeam[]> => {
  const response = await fconnectApi.get<FcDataResponse<FcTeam[]>>(`/clubs/${CLUB_ID}/teams`, {
    query: {
      status: filters.status ?? 'active',
      category: filters.category,
      season: filters.season,
      page: filters.page,
      limit: filters.limit ?? 50,
    },
    signal,
  });
  return response.data;
};
