export const ROLES = ['superadmin', 'admin', 'journalist', 'shop-admin', 'subscriber'] as const;
export type UserRole = (typeof ROLES)[number];

export const PERMISSIONS = [
  'users:manage',
  'articles:write',
  'products:write',
  'orders:manage',
  'legends:write',
  'history:write',
  'players:write',
  'hero:write',
  'matches:write',
  'gallery:write',
  'settings:write',
  'comments:moderate',
  'media:upload',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const EDITORIAL: Permission[] = [
  'articles:write',
  'gallery:write',
  'legends:write',
  'history:write',
  'comments:moderate',
  'media:upload',
];

const MATRIX: Record<UserRole, Permission[]> = {
  superadmin: [...PERMISSIONS],
  admin: [
    ...EDITORIAL,
    'products:write',
    'orders:manage',
    'players:write',
    'hero:write',
    'matches:write',
    'settings:write',
  ],
  journalist: [...EDITORIAL],
  'shop-admin': ['products:write', 'orders:manage', 'media:upload'],
  subscriber: [],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Super administrateur',
  admin: 'Administrateur',
  journalist: 'Journaliste',
  'shop-admin': 'Responsable boutique',
  subscriber: 'Supporter',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  superadmin: "Tout le site, plus la gestion des comptes de l'administration.",
  admin: 'Tout le contenu, la boutique et les commandes. Ne gère pas les comptes.',
  journalist: 'Actualités, légendes, histoire et modération des commentaires.',
  'shop-admin': 'Catalogue de la boutique et suivi des commandes.',
  subscriber: "Compte supporter : aucun accès à l'administration.",
};

export const permissionsOf = (role: UserRole): Permission[] => MATRIX[role] ?? [];

export const isStaffRole = (role: UserRole): boolean => role !== 'subscriber';

export const ASSIGNABLE_ROLES: UserRole[] = [...ROLES];
