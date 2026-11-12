import { SITE_ORIGIN } from '../../config/env';

export const siteMediaUrl = (value: string | undefined | null, fallback = ''): string => {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;

  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;

  // /uploads/ : images sur le disque de l'API ; /media/ : images sur RustFS,
  // servies elles aussi par l'API.
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/media/')) return `${SITE_ORIGIN}${trimmed}`;

  return trimmed;
};
