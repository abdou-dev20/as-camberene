import { NextFunction, Request, Response } from 'express';
import SiteUser from '../models/SiteUser.model';
import { TokenPayload, verify } from '../lib/tokens';
import { Permission, ROLE_LABELS, isStaffRole, roleCan } from '../lib/roles';
import { forbidden, unauthorized } from '../lib/http';
import { AuditActor } from '../lib/audit';
import { touchSession } from '../lib/sessions';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: TokenPayload;
      actor?: AuditActor;
    }
  }
}

const bearerToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice(7) : null;
};

const verifyOptional = (token: string): TokenPayload | null => {
  try {
    return verify(token, 'access');
  } catch {
    return null;
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const token = bearerToken(req);
  if (!token) return next();

  const payload = verifyOptional(token);
  if (payload) {
    req.auth = payload;
    touchSession(payload.sessionId);
  }
  next();
};

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const token = bearerToken(req);
  if (!token) return next(unauthorized());

  let payload: TokenPayload;
  try {
    payload = verify(token, 'access');
  } catch (error) {
    return next(error);
  }

  SiteUser.findById(payload.userId)
    .select('name email role is_active')
    .then((account) => {
      if (!account || !account.is_active) return next(unauthorized('Session invalide'));

      req.auth = { userId: payload.userId, role: account.role, sessionId: payload.sessionId };
      req.actor = { id: account.id, name: account.name, email: account.email, role: account.role };
      touchSession(payload.sessionId);
      next();
    })
    .catch(next);
};

export const requirePermission =
  (permission: Permission) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) return next(unauthorized());
    if (!roleCan(req.auth.role, permission)) {
      return next(
        forbidden(`Votre profil (${ROLE_LABELS[req.auth.role]}) n'a pas accès à cette rubrique`)
      );
    }
    next();
  };

export const canPreviewDrafts = (req: Request): boolean =>
  Boolean(req.auth && isStaffRole(req.auth.role));
