import { ApiError, siteApi } from '../../lib/api';
import { AuthTokens } from '../../lib/tokens';
import { Permission, UserRole, permissionsOf } from '../../lib/roles';
import { User } from '../../types';

export interface SiteUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  favorite_team?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at?: string;
}

interface AuthPayload {
  user: SiteUser;
  permissions?: Permission[];
  tokens: AuthTokens;
}

interface AuthResponse {
  success: boolean;
  data: AuthPayload;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  favorite?: string;
}

export const toUser = (user: SiteUser, permissions?: Permission[]): User => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  permissions: permissions ?? permissionsOf(user.role),
  favoriteTeam: user.favorite_team,
});

const persist = (payload: AuthPayload): User => {
  siteApi.tokens.set(payload.tokens);
  return toUser(payload.user, payload.permissions);
};

export const login = async (email: string, password: string): Promise<User> => {
  const response = await siteApi.post<AuthResponse>('/auth/login', { email, password });
  return persist(response.data);
};

export const register = async (payload: RegisterPayload): Promise<User> => {
  const response = await siteApi.post<AuthResponse>('/auth/register', payload);
  return persist(response.data);
};

export const getCurrentUser = async (signal?: AbortSignal): Promise<User | null> => {
  if (!siteApi.tokens.getAccess()) return null;

  try {
    const response = await siteApi.get<{
      success: boolean;
      data: { user: SiteUser; permissions?: Permission[] };
    }>('/auth/me', { auth: true, signal });
    return toUser(response.data.user, response.data.permissions);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) siteApi.tokens.clear();
    return null;
  }
};

export const logout = async (): Promise<void> => {
  await siteApi.post('/auth/logout').catch(() => undefined);
  siteApi.tokens.clear();
};
