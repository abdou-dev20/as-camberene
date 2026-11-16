import { Request } from 'express';
import mongoose from 'mongoose';
import ActivityLog, { ActivityCategory } from '../models/ActivityLog.model';
import { UserRole } from './roles';

export interface AuditActor {
  id?: string;
  name?: string;
  email?: string;
  role?: UserRole;
}

export interface ActivityInput {
  actor?: AuditActor;
  visitorId?: string;
  action: string;
  category: ActivityCategory;
  description: string;
  method?: string;
  path?: string;
  status?: number;
  targetType?: string;
  targetId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export const recordActivity = async (input: ActivityInput): Promise<void> => {
  try {
    await ActivityLog.create({
      actor:
        input.actor?.id && mongoose.isValidObjectId(input.actor.id) ? input.actor.id : undefined,
      actor_name: input.actor?.name,
      actor_email: input.actor?.email,
      actor_role: input.actor?.role,
      visitor_id: input.visitorId,
      action: input.action,
      category: input.category,
      description: input.description,
      method: input.method,
      path: input.path,
      status: input.status,
      target_type: input.targetType,
      target_id: input.targetId,
      ip: input.ip,
      user_agent: input.userAgent,
      metadata: input.metadata,
    });
  } catch {
    // Le journal est une trace best-effort : il ne doit jamais casser une action métier.
  }
};

interface ResourceDescriptor {
  key: string;
  label: string;
  category: ActivityCategory;
}

const RESOURCES: Record<string, ResourceDescriptor> = {
  articles: { key: 'articles', label: 'Actualité', category: 'content' },
  legends: { key: 'legends', label: 'Légende', category: 'content' },
  history: { key: 'history', label: 'Événement historique', category: 'content' },
  teams: { key: 'teams', label: 'Équipe', category: 'content' },
  players: { key: 'players', label: 'Joueur', category: 'content' },
  hero: { key: 'hero', label: 'Diapositive du carrousel', category: 'content' },
  matches: { key: 'matches', label: 'Match', category: 'content' },
  'player-of-month': { key: 'player-of-month', label: 'Joueur du mois', category: 'content' },
  gallery: { key: 'gallery', label: 'Média de galerie', category: 'media' },
  albums: { key: 'albums', label: 'Album', category: 'media' },
  uploads: { key: 'uploads', label: 'Fichier', category: 'media' },
  products: { key: 'products', label: 'Produit', category: 'shop' },
  orders: { key: 'orders', label: 'Commande', category: 'shop' },
  tickets: { key: 'tickets', label: 'Réservation', category: 'shop' },
  donations: { key: 'donations', label: 'Don', category: 'shop' },
  settings: { key: 'settings', label: 'Paramètre', category: 'settings' },
  users: { key: 'users', label: 'Compte', category: 'accounts' },
  share: { key: 'share', label: 'Aperçu de partage', category: 'other' },
};

const VERB_LABELS: Record<string, string> = {
  POST: 'Création',
  PUT: 'Mise à jour',
  PATCH: 'Mise à jour',
  DELETE: 'Suppression',
};

export const normalizePath = (originalUrl: string): string =>
  originalUrl.split('?')[0].replace(/^\/api(?=\/|$)/, '');

const describeResource = (segments: string[]): ResourceDescriptor => {
  if (segments[0] === 'articles' && segments[2] === 'comments') {
    return { key: 'comments', label: 'Commentaire', category: 'content' };
  }
  if (segments[0] === 'users' && segments[2] === 'password') {
    return { key: 'user-password', label: 'Mot de passe', category: 'accounts' };
  }
  if (segments[0] === 'auth') {
    return { key: 'auth', label: 'Authentification', category: 'auth' };
  }

  return (
    RESOURCES[segments[0]] ?? {
      key: segments[0] || 'other',
      label: 'Élément',
      category: 'other',
    }
  );
};

export const describeRequest = (
  method: string,
  originalUrl: string
): { action: string; category: ActivityCategory; description: string; targetType: string; targetId?: string } => {
  const path = normalizePath(originalUrl);
  const segments = path.split('/').filter(Boolean);
  const resource = describeResource(segments);
  const targetId = [...segments].reverse().find((segment) => mongoose.isValidObjectId(segment));
  const verb = VERB_LABELS[method] ?? method;

  return {
    action: `${resource.key}.${method.toLowerCase()}`,
    category: resource.category,
    description: `${verb} : ${resource.label.toLowerCase()}`,
    targetType: resource.key,
    targetId,
  };
};

export const requestAuditContext = (
  req: Request
): { method: string; path: string; ip?: string; userAgent?: string; visitorId?: string } => ({
  method: req.method,
  path: normalizePath(req.originalUrl),
  ip: req.ip,
  userAgent: req.get('user-agent')?.slice(0, 300),
  visitorId: req.get('x-visitor-id')?.trim() || undefined,
});
