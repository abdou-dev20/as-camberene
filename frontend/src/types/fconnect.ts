export interface FcPagination {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
  pages?: number;
}

export interface FcDataResponse<T> {
  success: boolean;
  data: T;
  pagination?: FcPagination;
  message?: string;
}

export interface FcMatchesResponse {
  success: boolean;
  matches: FcMatch[];
  pagination?: FcPagination;
}

export interface FcClub {
  id: string;
  user_id: string;
  name: string;
  founded_year?: number;
  description?: string;
  logo_url?: string;
  cover_photo_url?: string;
  club_type?: 'amateur' | 'semi-professional' | 'professional' | 'academy';
  address?: string;
  city?: string;
  country?: string;
  website_url?: string;
  contact_email?: string;
  contact_phone?: string;
  members_count: number;
  followers_count: number;
  is_verified: boolean;
  age: number | null;
  created_at: string;
  updated_at: string;
}

export type FcTeamCategory =
  | 'senior' | 'u23' | 'u19' | 'u17' | 'u15' | 'u13' | 'u11'
  | 'veterans' | 'women' | 'other';

export type FcMemberRole =
  | 'player' | 'coach' | 'analyst' | 'set_piece_coach' | 'scout' | 'staff'
  | 'medical' | 'admin' | 'treasurer' | 'registrar' | 'communication'
  | 'adherent' | 'parent';

export type FcMemberStatus = 'active' | 'inactive' | 'suspended' | 'trial' | 'injured' | 'loaned';

export interface FcTeamPlayerRef {
  id: string;
  first_name: string;
  last_name: string;
  jersey_number?: number;
  position?: string;
  profile_picture_url?: string;
  date_of_birth?: string;
  status?: FcMemberStatus;
}

export interface FcTeamStaffRef {
  id: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string;
  role: FcMemberRole;
}

export interface FcTeam {
  id: string;
  club_id: string;
  name: string;
  category?: FcTeamCategory;
  level?: 'amateur' | 'regional' | 'national' | 'professional' | 'elite';
  season: string;
  gender?: 'male' | 'female' | 'mixed';
  manager_id?: FcTeamStaffRef | string | null;
  assistant_coaches?: Array<FcTeamStaffRef | string>;
  players: Array<FcTeamPlayerRef | string>;
  description?: string;
  logo_url?: string;
  home_stadium?: string;
  primary_color?: string;
  secondary_color?: string;
  league_name?: string;
  division?: string;
  matches_played?: number;
  matches_won?: number;
  matches_drawn?: number;
  matches_lost?: number;
  goals_for?: number;
  goals_against?: number;
  status: 'active' | 'inactive' | 'disbanded';
  playersCount?: number;
  points?: number;
  goalDifference?: number;
  winRate?: number;
  created_at: string;
  updated_at: string;
}

export type FcMatchStatus =
  | 'scheduled' | 'live' | 'halftime' | 'finished' | 'postponed' | 'cancelled';

export type FcMatchType = 'friendly' | 'league' | 'cup' | 'tournament' | 'training';

export interface FcMatchTeamRef {
  id: string;
  name: string;
  logo?: string;
  clubId?: string;
}

export interface FcMatch {
  id?: string;
  _id: string;
  homeTeam: FcMatchTeamRef;
  awayTeam: FcMatchTeamRef;
  date: string;
  time: string;
  venue: { name: string; city?: string; address?: string; capacity?: number };
  status: FcMatchStatus;
  type: FcMatchType;
  competition?: { id: string; name: string; round?: string };
  score: { home: number; away: number; homeHalftime?: number; awayHalftime?: number };
  attendance?: number;
  createdAt?: string;
  updatedAt?: string;
}
