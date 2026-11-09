import { siteApi } from '../../lib/api';
import { SiteSettings, withDefaults } from '../../data/siteSettings';
import { siteMediaUrl } from './media';

interface SettingsResponse {
  success: boolean;
  data: Partial<SiteSettings> | null;
}

export const getSiteSettings = async (signal?: AbortSignal): Promise<SiteSettings> => {
  const response = await siteApi.get<SettingsResponse>('/settings', { signal });
  return withDefaults(response.data);
};

export const saveSiteSettings = async (settings: SiteSettings): Promise<SiteSettings> => {
  const response = await siteApi.put<SettingsResponse>('/settings', settings, { auth: true });
  return withDefaults(response.data);
};

export const settingsImage = (value: string): string => siteMediaUrl(value);
