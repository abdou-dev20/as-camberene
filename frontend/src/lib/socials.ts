import { Facebook, Instagram, LucideIcon, Twitter, Youtube } from 'lucide-react';
import { SiteSettings } from '../data/siteSettings';

export interface SocialLink {
  label: string;
  icon: LucideIcon;
  href: string;
}

export const safeHref = (value: string | undefined): string => {
  const href = (value ?? '').trim();
  return /^(https?:\/\/|\/(?!\/))/i.test(href) ? href : '';
};

export const socialLinks = (settings: SiteSettings): SocialLink[] =>
  [
    { label: 'Facebook', icon: Facebook, href: safeHref(settings.socials.facebook) },
    { label: 'Instagram', icon: Instagram, href: safeHref(settings.socials.instagram) },
    { label: 'X', icon: Twitter, href: safeHref(settings.socials.x) },
    { label: 'YouTube', icon: Youtube, href: safeHref(settings.socials.youtube) },
  ].filter((link) => link.href !== '');
