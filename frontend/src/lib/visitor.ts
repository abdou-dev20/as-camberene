import { SITE_API_URL } from '../config/env';

const STORAGE_KEY = 'asc_visitor_id';
let memoryId: string | null = null;

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `visitor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
};

export const getVisitorId = (): string => {
  if (memoryId) return memoryId;

  if (typeof window === 'undefined') {
    memoryId = generateId();
    return memoryId;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && stored.length >= 8) {
      memoryId = stored;
      return stored;
    }

    const created = generateId();
    window.localStorage.setItem(STORAGE_KEY, created);
    memoryId = created;
    return created;
  } catch {
    memoryId = generateId();
    return memoryId;
  }
};

let lastTracked: { path: string; at: number } | null = null;

export const trackPageView = (path: string): void => {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  if (lastTracked && lastTracked.path === path && now - lastTracked.at < 2000) return;
  lastTracked = { path, at: now };

  void fetch(`${SITE_API_URL}/track/visit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      visitor_id: getVisitorId(),
      path,
      referrer: document.referrer || undefined,
    }),
    keepalive: true,
  }).catch(() => undefined);
};
