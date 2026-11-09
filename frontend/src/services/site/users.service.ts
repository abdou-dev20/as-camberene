import { siteApi } from '../../lib/api';
import { UserRole } from '../../lib/roles';
import { SiteUser } from './auth.service';
import { ListResponse } from './content.service';

export interface UserListParams {
  search?: string;
  role?: UserRole | '';
  is_active?: 'true' | 'false' | '';
  page?: number;
  limit?: number;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  is_active?: boolean;
}

export interface UpdateUserPayload {
  name?: string;
  role?: UserRole;
  is_active?: boolean;
}

interface MutationResponse {
  success: boolean;
  data: { user: SiteUser; generated_password?: string };
}

export const listUsers = async (
  params: UserListParams = {},
  signal?: AbortSignal
): Promise<SiteUser[]> => {
  const response = await siteApi.get<ListResponse<SiteUser>>('/users', {
    query: { ...params },
    auth: true,
    signal,
  });
  return response.data;
};

export const createUser = async (
  payload: CreateUserPayload
): Promise<{ user: SiteUser; generatedPassword?: string }> => {
  const response = await siteApi.post<MutationResponse>('/users', payload, { auth: true });
  return { user: response.data.user, generatedPassword: response.data.generated_password };
};

export const updateUser = async (id: string, payload: UpdateUserPayload): Promise<SiteUser> => {
  const response = await siteApi.put<{ success: boolean; data: SiteUser }>(
    `/users/${id}`,
    payload,
    { auth: true }
  );
  return response.data;
};

export const resetUserPassword = async (
  id: string,
  password?: string
): Promise<{ user: SiteUser; generatedPassword?: string }> => {
  const response = await siteApi.post<MutationResponse>(
    `/users/${id}/password`,
    password ? { password } : {},
    { auth: true }
  );
  return { user: response.data.user, generatedPassword: response.data.generated_password };
};

export const deleteUser = async (id: string): Promise<void> => {
  await siteApi.del(`/users/${id}`, { auth: true });
};
