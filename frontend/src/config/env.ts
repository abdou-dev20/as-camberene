const trimSlash = (url: string): string => url.replace(/\/+$/, '');

const rawSiteUrl = import.meta.env.VITE_SITE_API_URL?.trim() || 'http://localhost:4100';
const rawFconnectUrl = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:4000';

export const SITE_ORIGIN = trimSlash(rawSiteUrl);

export const SITE_API_URL = `${SITE_ORIGIN}/api`;

export const FCONNECT_API_URL = `${trimSlash(rawFconnectUrl)}/api`;

export const CLUB_ID = import.meta.env.VITE_CLUB_ID?.trim() || '';

export const isFconnectConfigured = (): boolean => CLUB_ID.length > 0;

export const REQUEST_TIMEOUT_MS = 15_000;
