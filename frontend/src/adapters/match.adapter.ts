import { CLUB_ID } from '../config/env';
import { Match } from '../types';
import { FcMatch, FcMatchStatus, FcMatchTeamRef } from '../types/fconnect';

const isoDate = (value?: string | null): string => (value ? value.slice(0, 10) : '');

const STATUS_LABELS: Record<FcMatchStatus, Match['status']> = {
  scheduled: 'À venir',
  live: 'En cours',
  halftime: 'En cours',
  finished: 'Terminé',
  postponed: 'À venir',
  cancelled: 'À venir',
};

export interface ApiMatch extends Match {
  fcId: string;
  rawStatus: FcMatchStatus;
  opponentLogo?: string;
  isHome: boolean;
}

const isClubSide = (side: FcMatchTeamRef): boolean => Boolean(CLUB_ID) && side.clubId === CLUB_ID;

export const toMatch = (match: FcMatch): ApiMatch => {
  const playingHome = isClubSide(match.homeTeam) || !isClubSide(match.awayTeam);
  const opponent = playingHome ? match.awayTeam : match.homeTeam;
  const finished = match.status === 'finished';

  return {
    id: match.id ?? match._id ?? '',
    fcId: match.id ?? match._id ?? '',
    opponent: opponent.name,
    opponentLogo: opponent.logo,
    date: isoDate(match.date),
    time: match.time ?? '',
    venue: playingHome ? 'Domicile' : 'Extérieur',
    isHome: playingHome,
    competition: match.competition?.name ?? '',
    result: finished ? { home: match.score.home, away: match.score.away } : undefined,
    status: STATUS_LABELS[match.status] ?? 'À venir',
    rawStatus: match.status,
  };
};

export const toMatches = (matches: FcMatch[]): ApiMatch[] => matches.map(toMatch);
