import { SeedMatch } from './types';

const day = (offset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

export const seedMatches: SeedMatch[] = [
  {
    opponent: 'ASC Jaraaf',
    date: day(-21),
    time: '17:00',
    venue: 'Extérieur',
    competition: 'Ligue 1 Sénégal',
    result: { home: 1, away: 2 },
    status: 'Terminé',
  },
  {
    opponent: 'Casa Sports',
    date: day(-14),
    time: '16:30',
    venue: 'Domicile',
    competition: 'Ligue 1 Sénégal',
    result: { home: 2, away: 0 },
    status: 'Terminé',
  },
  {
    opponent: 'Génération Foot',
    date: day(-7),
    time: '17:00',
    venue: 'Extérieur',
    competition: 'Ligue 1 Sénégal',
    result: { home: 1, away: 1 },
    status: 'Terminé',
  },
  {
    opponent: 'Diambars FC',
    date: day(6),
    time: '17:00',
    venue: 'Domicile',
    competition: 'Ligue 1 Sénégal',
    status: 'À venir',
  },
  {
    opponent: 'US Gorée',
    date: day(13),
    time: '16:00',
    venue: 'Extérieur',
    competition: 'Ligue 1 Sénégal',
    status: 'À venir',
  },
  {
    opponent: 'Teungueth FC',
    date: day(20),
    time: '17:30',
    venue: 'Domicile',
    competition: 'Coupe du Sénégal',
    status: 'À venir',
  },
];
