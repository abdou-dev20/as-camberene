import { NextFunction, Request, Response } from 'express';
import { describeRequest, normalizePath, recordActivity, requestAuditContext } from '../lib/audit';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const auditTrail = (req: Request, res: Response, next: NextFunction): void => {
  if (!MUTATING_METHODS.has(req.method)) return next();

  const path = normalizePath(req.originalUrl);
  if (path.startsWith('/auth') || path.startsWith('/track')) return next();

  res.on('finish', () => {
    const context = requestAuditContext(req);
    const actor = req.actor ?? (req.auth ? { id: req.auth.userId, role: req.auth.role } : undefined);

    if (!actor && !context.visitorId) return;

    const described = describeRequest(req.method, req.originalUrl);
    const failed = res.statusCode >= 400;

    void recordActivity({
      actor,
      ...context,
      action: described.action,
      category: described.category,
      description: failed ? `${described.description} (échec)` : described.description,
      status: res.statusCode,
      targetType: described.targetType,
      targetId: described.targetId,
    });
  });

  next();
};
