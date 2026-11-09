export const HOME_SECTIONS = [
  { key: 'hero', label: 'Carrousel de tête', manage: '/admin/carrousel' },
  { key: 'matchCenter', label: 'Centre de match', manage: '/admin/calendrier' },
  { key: 'news', label: 'Actualités', manage: '/admin/articles' },
  { key: 'facts', label: 'Chiffres du club', manage: '#facts' },
  { key: 'shop', label: 'Boutique officielle', manage: '/admin/produits' },
  { key: 'banner', label: 'Bannière « Effectif »', manage: '#banner' },
  { key: 'legends', label: 'Légendes du club', manage: '/admin/legendes' },
  { key: 'gallery', label: 'Galerie / Nos stars', manage: '/admin/galerie' },
] as const;

export type HomeSectionKey = (typeof HOME_SECTIONS)[number]['key'];

export interface SiteSettings {
  topBar: string;
  socials: { facebook: string; instagram: string; x: string; youtube: string };
  facts: { value: string; label: string }[];
  banner: { image: string; kicker: string; title: string };
  partners: { name: string; logo: string; href: string }[];
  newsletter: { title: string; text: string };
  contact: { address: string; phone: string; email: string };
  footerNote: string;
  homeSections: Record<HomeSectionKey, boolean>;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  topBar: 'Club officiel · Fondé en 1965 · Ligue 1 Sénégal',
  socials: {
    facebook: 'https://www.facebook.com/p/Asc-camb%C3%A9r%C3%A8ne-officiel-100063673796089/',
    instagram: 'https://www.instagram.com/asc.camberene/',
    x: 'https://x.com/asccamberene',
    youtube: 'https://youtube.com/@asccamberene',
  },
  facts: [
    { value: '1965', label: 'Fondation' },
    { value: '8', label: 'Titres nationaux' },
    { value: '25K+', label: 'Supporters' },
    { value: 'L1', label: 'Championnat' },
  ],
  banner: {
    image: '/assets/img/asc-camberene-equipe-2025.webp',
    kicker: 'Effectif 2026',
    title: 'Le groupe qui a ramené le club en Ligue 1',
  },
  partners: [],
  newsletter: {
    title: 'Restez informé',
    text: "Recevez l'actualité du club, les convocations et les offres de la boutique.",
  },
  contact: {
    address: 'Stade Municipal de Cambérène\nCambérène, Dakar, Sénégal',
    phone: '',
    email: 'contact@asccamberene.sn',
  },
  footerNote:
    'ASC Cambérène. Tous droits réservés. Club de football sénégalais, fondé en 1965 par le Khalife Seydina El Hadji Abdoulaye Thiaw Laye.',
  homeSections: {
    hero: true,
    matchCenter: true,
    news: true,
    facts: true,
    shop: true,
    banner: true,
    legends: true,
    gallery: true,
  },
};

export const withDefaults = (stored: Partial<SiteSettings> | null | undefined): SiteSettings => {
  const d = DEFAULT_SITE_SETTINGS;
  if (!stored) return d;
  return {
    topBar: stored.topBar ?? d.topBar,
    socials: { ...d.socials, ...stored.socials },
    facts: stored.facts ?? d.facts,
    banner: { ...d.banner, ...stored.banner },
    partners: stored.partners ?? d.partners,
    newsletter: { ...d.newsletter, ...stored.newsletter },
    contact: { ...d.contact, ...stored.contact },
    footerNote: stored.footerNote ?? d.footerNote,
    homeSections: { ...d.homeSections, ...stored.homeSections },
  };
};
