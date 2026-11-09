import { SITE_ORIGIN } from '../../config/env';

export const siteMediaUrl = (value: string | undefined | null, fallback = ''): string => {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;

  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;

  if (trimmed.startsWith('/uploads/')) return `${SITE_ORIGIN}${trimmed}`;

  return trimmed;
};
