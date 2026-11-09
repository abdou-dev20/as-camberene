import { Router } from 'express';
import SiteSettings from '../models/SiteSettings.model';
import { handler } from '../lib/http';
import { authenticate, requirePermission } from '../middlewares/auth';
import { siteSettingsSchema } from '../validators/settings';

const router = Router();

router.get(
  '/',
  handler(async (_req, res) => {
    const settings = await SiteSettings.findOne({ key: 'site' }).lean();
    res.json({ success: true, data: settings?.content ?? null });
  })
);

router.put(
  '/',
  authenticate,
  requirePermission('settings:write'),
  handler(async (req, res) => {
    const content = await siteSettingsSchema.validateAsync(req.body, { stripUnknown: true });
    const settings = await SiteSettings.findOneAndUpdate(
      { key: 'site' },
      { content },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    res.json({ success: true, data: settings?.content ?? content });
  })
);

export default router;
