import { siteApi } from '../../lib/api';
import { formatMonthYear } from '../../lib/dates';
import { siteMediaUrl } from './media';

export interface PotmNominee {
  id: string;
  name: string;
  photo: string;
  number: number;
  line: string;
  position: string;
}

export interface PotmCurrentNominee extends PotmNominee {
  votes: number;
  percent: number;
}

export interface PotmCurrent {
  id: string;
  month: string;
  title: string;
  status: 'open' | 'closed';
  nominees: PotmCurrentNominee[];
  totalVotes: number;
  resultsRevealed: boolean;
  myVote: string | null;
  winner: string | null;
}

export interface PotmAdmin {
  id: string;
  month: string;
  title: string;
  status: 'open' | 'closed';
  totalVotes: number;
  results: (PotmNominee & { votes: number; percent: number })[];
}

const withPhoto = <T extends PotmNominee>(nominee: T): T => ({ ...nominee, photo: siteMediaUrl(nominee.photo) });

export const getCurrentPotm = async (signal?: AbortSignal): Promise<PotmCurrent | null> => {
  const response = await siteApi.get<{ data: PotmCurrent | null }>('/player-of-month/current', { auth: true, signal });
  return response.data ? { ...response.data, nominees: response.data.nominees.map(withPhoto) } : null;
};

export const votePotm = async (pollId: string, player: string): Promise<void> => {
  await siteApi.post(`/player-of-month/${pollId}/vote`, { player }, { auth: true });
};

export const listPotm = async (signal?: AbortSignal): Promise<PotmAdmin[]> => {
  const response = await siteApi.get<{ data: PotmAdmin[] }>('/player-of-month', { auth: true, signal });
  return response.data.map((poll) => ({ ...poll, results: poll.results.map(withPhoto) }));
};

export const createPotm = (payload: { month: string; title: string; nominees: string[]; status: 'open' | 'closed' }) =>
  siteApi.post('/player-of-month', payload, { auth: true });

export const updatePotm = (id: string, payload: Partial<{ title: string; nominees: string[]; status: 'open' | 'closed' }>) =>
  siteApi.put(`/player-of-month/${id}`, payload, { auth: true });

export const deletePotm = (id: string) => siteApi.del(`/player-of-month/${id}`, { auth: true });

export const monthName = (month: string): string => {
  const label = formatMonthYear(`${month}-15`);
  return label.charAt(0).toUpperCase() + label.slice(1);
};
