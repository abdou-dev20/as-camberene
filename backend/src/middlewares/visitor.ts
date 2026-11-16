import { NextFunction, Request, Response } from 'express';
import Visitor from '../models/Visitor.model';
import { normalizePath } from '../lib/audit';

const VISITOR_PATTERN = /^[A-Za-z0-9-]{8,64}$/;
const TOUCH_INTERVAL_MS = 60 * 1000;
const recentlyTouched = new Map<string, number>();

export const touchVisitor = (req: Request, _res: Response, next: NextFunction): void => {
  const path = normalizePath(req.originalUrl);
  if (path.startsWith('/admin') || path.startsWith('/track')) return next();

  const visitorId = req.get('x-visitor-id')?.trim();
  if (!visitorId || !VISITOR_PATTERN.test(visitorId)) return next();

  const now = Date.now();
  if ((recentlyTouched.get(visitorId) ?? 0) > now - TOUCH_INTERVAL_MS) return next();

  if (recentlyTouched.size > 10000) recentlyTouched.clear();
  recentlyTouched.set(visitorId, now);

  void Visitor.updateOne(
    { visitor_id: visitorId },
    {
      $set: { last_seen_at: new Date() },
      $setOnInsert: { first_seen_at: new Date(), page_views: 0 },
    },
    { upsert: true }
  ).catch(() => undefined);

  next();
};
