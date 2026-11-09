import { fconnectApi } from '../../lib/api';
import { CLUB_ID } from '../../config/env';
import { FcClub, FcDataResponse } from '../../types/fconnect';

export const getClub = async (signal?: AbortSignal): Promise<FcClub> => {
  const response = await fconnectApi.get<FcDataResponse<FcClub>>(`/clubs/${CLUB_ID}`, { signal });
  return response.data;
};
