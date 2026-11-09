import { useEffect, useState } from 'react';
import { DEFAULT_SITE_SETTINGS, SiteSettings } from '../data/siteSettings';
import { getSiteSettings } from '../services/site/settings.service';

let cache: SiteSettings | null = null;
let inflight: Promise<void> | null = null;
const listeners = new Set<(settings: SiteSettings) => void>();

const broadcast = (settings: SiteSettings) => {
  cache = settings;
  listeners.forEach((listener) => listener(settings));
};

export const publishSiteSettings = broadcast;

export const useSiteSettings = (): SiteSettings => {
  const [settings, setSettings] = useState<SiteSettings>(cache ?? DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    listeners.add(setSettings);
    if (cache) setSettings(cache);
    else if (!inflight) {
      inflight = getSiteSettings()
        .then(broadcast)
        .catch(() => {
          inflight = null;
        });
    }
    return () => {
      listeners.delete(setSettings);
    };
  }, []);

  return settings;
};

export default useSiteSettings;
