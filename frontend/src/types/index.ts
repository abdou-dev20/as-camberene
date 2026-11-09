import type { Permission, UserRole } from '../lib/roles';

export type { Permission, UserRole };

export type EntityId = string | number;

export type PlayerTeam = string;

export const PLAYER_TEAM_LABELS: Record<string, string> = {
  'equipe-a': 'Équipe A',
  'equipe-u19': 'U19',
  'equipe-u17': 'U17',
  'equipe-u15': 'U15',
  'equipe-u12': 'U12',
};

export const PLAYER_LINES = ['Gardien', 'Défenseur', 'Milieu', 'Attaquant'] as const;
export type PlayerLine = (typeof PLAYER_LINES)[number];

export const PLAYER_KINDS = ['player', 'staff'] as const;
export type PlayerKind = (typeof PLAYER_KINDS)[number];

export const PLAYER_STATUSES = ['actif', 'blessé', 'suspendu', 'prêté', 'inactif'] as const;
export type PlayerStatus = (typeof PLAYER_STATUSES)[number];

export const STRONG_FEET = ['droit', 'gauche', 'les deux'] as const;
export type StrongFoot = (typeof STRONG_FEET)[number];

export interface TeamMember {
  id: string;
  kind: PlayerKind;
  name: string;
  team: PlayerTeam;
  number: number;
  line: PlayerLine;
  position: string;
  role: string;
  photo: string;
  status: PlayerStatus;
  birthDate: string | null;
  age: number;
  nationality: string;
  height: number;
  weight: number;
  strongFoot: StrongFoot | '';
  stats: { matches: number; goals: number; assists: number; yellowCards: number; redCards: number };
  biography: string;
  joinedYear: number;
  rank: number;
  isVisible: boolean;
  isFeatured?: boolean;
}

export const ARTICLE_CATEGORIES = ['Matchs', 'Transferts', 'Équipe', 'Club'] as const;
export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export const PRODUCT_CATEGORIES = ['Maillots', 'Accessoires'] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_TYPES = ['Domicile', 'Extérieur', 'Third', 'Autre'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const LEGEND_ERAS = ['Golden Age', 'Modern Era', 'Classic Era'] as const;
export type LegendEra = (typeof LEGEND_ERAS)[number];

export interface Article {
  id: EntityId;
  title: string;
  content: string;
  excerpt: string;
  image: string;
  imagePosition?: string;
  category: ArticleCategory;
  publishedAt: string;
  author: string;
  status?: 'draft' | 'published';
  comments: Comment[];
}

export interface Comment {
  id: EntityId;
  author: string;
  content: string;
  timestamp: string;
}

export interface Product {
  id: EntityId;
  name: string;
  price: number;
  category: ProductCategory;
  type: ProductType;
  image: string;
  images: string[];
  description: string;
  sizes: string[];
  inStock: boolean;
  isVisible?: boolean;
}

export const ORDER_STATUSES = ['recue', 'preparee', 'remise', 'annulee'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const FULFILMENTS = ['retrait', 'livraison'] as const;
export type Fulfilment = (typeof FULFILMENTS)[number];

export type PaymentMethod = 'a_la_remise' | 'mobile_money';

export interface OrderItem {
  product?: string;
  name: string;
  unit_price: number;
  size: string;
  quantity: number;
}

export interface Order {
  id: string;
  reference: string;
  customer: { name: string; phone: string; email?: string };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  fulfilment: Fulfilment;
  address?: string;
  payment_method: PaymentMethod;
  status: OrderStatus;
  note?: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

export const GALLERY_CATEGORIES = ['match', 'entrainement', 'club'] as const;
export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

export const GALLERY_CATEGORY_LABELS: Record<GalleryCategory, string> = {
  match: 'Matchs',
  entrainement: 'Entraînements',
  club: 'Vie du club',
};

export interface GalleryItem {
  id: EntityId;
  image: string;
  title: string;
  description: string;
  category: GalleryCategory;
  match?: string | null;
  album?: string | null;
  date?: string;
  rank?: number;
  isVisible?: boolean;
  createdAt?: string;
}

export interface Album {
  id: EntityId;
  title: string;
  description: string;
  cover: string;
  category: GalleryCategory;
  match?: string | null;
  date?: string;
  rank?: number;
  isVisible?: boolean;
  photoCount?: number;
  photos?: GalleryItem[];
  createdAt?: string;
}

export const RESERVATION_STATUSES = ['nouvelle', 'confirmee', 'honoree', 'annulee'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  nouvelle: 'À traiter',
  confirmee: 'Confirmée',
  honoree: 'Retirée au guichet',
  annulee: 'Annulée',
};

export interface TicketReservation {
  id: string;
  reference: string;
  match: Pick<Match, 'id' | 'opponent' | 'date' | 'time' | 'venue' | 'competition' | 'status'> | null;
  name: string;
  phone: string;
  email?: string;
  seats: number;
  status: ReservationStatus;
  message: string;
  note: string;
  created_at?: string;
}

export const TEAM_CATEGORIES = ['senior', 'youth'] as const;
export type TeamCategory = (typeof TEAM_CATEGORIES)[number];

export interface Team {
  id: EntityId;
  slug: string;
  name: string;
  category: TeamCategory;
  ageRange: string;
  subtitle: string;
  description: string;
  coach: string;
  training: string;
  stadium: string;
  achievements: string[];
  stats: { wins: number; draws: number; losses: number };
  established: string;
  image: string;
  rank?: number;
  isVisible?: boolean;
}

export const MATCH_VENUES = ['Domicile', 'Extérieur'] as const;
export type MatchVenue = (typeof MATCH_VENUES)[number];

export const MATCH_STATUSES = ['À venir', 'En cours', 'Terminé'] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const SCORER_SIDES = ['club', 'opponent'] as const;
export type ScorerSide = (typeof SCORER_SIDES)[number];

export interface MatchScorer {
  player?: string | null;
  name: string;
  minute: number;
  side: ScorerSide;
  assistName?: string;
  assistPlayer?: string | null;
}

export interface Match {
  id: EntityId;
  opponent: string;
  date: string;
  time: string;
  venue: MatchVenue;
  competition: string;
  result?: {
    home: number;
    away: number;
  } | null;
  status: MatchStatus;
  scorers?: MatchScorer[];
  liveTime?: string;
  image?: string;
}

export interface Subscription {
  id: number;
  category: 'Tribune' | 'Virage' | 'VIP';
  price: number;
  seat: string;
  benefits: string[];
}

export interface User {
  id: EntityId;
  name: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  subscription?: Subscription;
  favoriteTeam?: string;
}

export interface Legend {
  id: number;
  name: string;
  position: string;
  period: string;
  nationality: string;
  photo: string;
  achievements: string[];
  stats: {
    matches: number;
    goals: number;
    assists: number;
    trophies: number;
  };
  biography: string;
  quote: string;
  jerseyNumber: number;
  era: LegendEra;
  isHallOfFame: boolean;
  rank?: number;
}

export interface HeroSlide {
  id: EntityId;
  image?: string;
  youtube?: string;
  kicker: string;
  title: string;
  link: string;
  linkLabel: string;
  rank?: number;
  isVisible?: boolean;
}

export interface HistoryEvent {
  id: EntityId;
  year: number;
  dateLabel?: string;
  title: string;
  description: string;
  tags?: string[];
  image?: string;
  phase?: string;
}

export const DONATION_STATUSES = ['en_attente', 'payee', 'annulee', 'echouee'] as const;
export type DonationStatus = (typeof DONATION_STATUSES)[number];

export const DONATION_STATUS_LABELS: Record<DonationStatus, string> = {
  en_attente: 'En attente',
  payee: 'Payé',
  annulee: 'Annulé',
  echouee: 'Échoué',
};

/**
 * Don au club, réglé en ligne par PayTech.
 *
 * Le statut ne passe à « payé » que sur la notification signée de PayTech :
 * le retour du donateur sur le site ne prouve rien.
 */
export interface Donation {
  id: string;
  reference: string;
  amount: number;
  paidAmount?: number;
  name: string;
  email?: string;
  phone?: string;
  anonymous: boolean;
  message: string;
  status: DonationStatus;
  paymentMethod?: string;
  paidAt?: string;
  note: string;
  created_at?: string;
}
