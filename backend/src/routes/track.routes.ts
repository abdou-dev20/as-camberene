import { Router } from 'express';
import Joi from 'joi';
import Visitor from '../models/Visitor.model';
import { recordActivity, requestAuditContext } from '../lib/audit';
import { handler } from '../lib/http';
import { optionalAuth } from '../middlewares/auth';

const visitSchema = Joi.object({
  visitor_id: Joi.string().trim().min(8).max(64).required(),
  path: Joi.string().trim().min(1).max(500).required(),
  referrer: Joi.string().trim().max(500).allow('', null),
});

const router = Router();

router.post(
  '/visit',
  optionalAuth,
  handler(async (req, res) => {
    const value = await visitSchema.validateAsync(req.body, { stripUnknown: true });
    const path = value.path.startsWith('/') ? value.path : `/${value.path}`;

    if (path.startsWith('/admin') || path.startsWith('/api') || path.startsWith('/media')) {
      res.status(204).end();
      return;
    }

    const now = new Date();
    const ip = req.ip;
    const userAgent = req.get('user-agent')?.slice(0, 300);

    await Visitor.updateOne(
      { visitor_id: value.visitor_id },
      {
        $set: {
          last_seen_at: now,
          last_path: path.slice(0, 500),
          ip,
          user_agent: userAgent,
          ...(req.auth ? { user: req.auth.userId } : {}),
        },
        $setOnInsert: { first_seen_at: now },
        $inc: { page_views: 1 },
      },
      { upsert: true }
    ).catch(() => undefined);

    await recordActivity({
      actor: req.auth ? { id: req.auth.userId, role: req.auth.role } : undefined,
      ...requestAuditContext(req),
      visitorId: value.visitor_id,
      action: 'visit.page',
      category: 'visit',
      description: `Visite : ${path.slice(0, 180)}`,
      method: 'GET',
      path,
      status: 200,
      targetType: 'page',
      metadata: { referrer: value.referrer || undefined, guest: !req.auth },
    });

    res.status(204).end();
  })
);

export default router;
