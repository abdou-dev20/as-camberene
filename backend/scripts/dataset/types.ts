export interface SeedComment {
  author: string;
  content: string;
  daysAfter: number;
}

export interface SeedArticle {
  title: string;
  excerpt: string;
  content: string;
  category: 'Matchs' | 'Transferts' | 'Équipe' | 'Club';
  author: string;
  publishedAt: string;
  status: 'draft' | 'published';
  image: string;
  comments?: SeedComment[];
}

export interface SeedProduct {
  name: string;
  price: number;
  category: 'Maillots' | 'Accessoires';
  type: 'Domicile' | 'Extérieur' | 'Third' | 'Autre';
  description: string;
  sizes: string[];
  image: string;
  inStock: boolean;
  isVisible?: boolean;
}

export interface SeedLegend {
  name: string;
  position: string;
  period: string;
  nationality: string;
  photo: string;
  achievements: string[];
  stats: { matches: number; goals: number; assists: number; trophies: number };
  biography: string;
  quote: string;
  jerseyNumber: number;
  era: 'Golden Age' | 'Modern Era' | 'Classic Era';
  isHallOfFame: boolean;
  rank: number;
}

export interface SeedHistoryEvent {
  year: number;
  dateLabel?: string;
  title: string;
  description: string;
  tags: string[];
  phase: string;
}

export interface SeedHeroSlide {
  image?: string;
  youtube?: string;
  kicker: string;
  title: string;
  link: string;
  linkLabel: string;
  rank: number;
}

export interface SeedMatch {
  opponent: string;
  date: string;
  time: string;
  venue: 'Domicile' | 'Extérieur';
  competition: string;
  result?: { home: number; away: number };
  status: 'À venir' | 'En cours' | 'Terminé';
}

export interface SeedGalleryItem {
  image: string;
  title: string;
  description: string;
  category: 'match' | 'entrainement' | 'club';
  date: string;
}

export interface SeedTeam {
  slug: string;
  name: string;
  category: 'senior' | 'youth';
  ageRange: string;
  subtitle: string;
  description: string;
  coach: string;
  training: string;
  stadium: string;
  achievements: string[];
  stats: { wins: number; draws: number; losses: number };
  established: string;
  rank: number;
}
