import { Match } from '../types';

export const kickoff = (match: Match): number => new Date(`${match.date}T${match.time || '00:00'}:00`).getTime();

export const isOver = (match: Match): boolean => match.status === 'Terminé';
