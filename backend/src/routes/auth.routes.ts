import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import SiteUser from '../models/SiteUser.model';
import { issueTokens, verify } from '../lib/tokens';
import { permissionsOf } from '../lib/roles';
import { handler, unauthorized } from '../lib/http';
import { authenticate, optionalAuth } from '../middlewares/auth';
import { recordActivity, requestAuditContext } from '../lib/audit';
import { continueSession, endSession, startSession } from '../lib/sessions';
import { loginSchema, refreshSchema, registerSchema } from '../validators/auth';

const router = Router();

/** Ralentit les essais de mots de passe ; une connexion réussie ne compte pas. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion, réessayez dans 15 minutes.',
  },
});

router.post(
  '/register',
  handler(async (req, res) => {
    const value = await registerSchema.validateAsync(req.body, { stripUnknown: true });

    const existing = await SiteUser.findOne({ email: value.email.toLowerCase() });
    if (existing) {
      res.status(409).json({ success: false, message: 'Cet email est déjà utilisé' });
      return;
    }

    const user = await SiteUser.create({
      name: value.name,
      email: value.email.toLowerCase(),
      password_hash: value.password, // haché par le hook du modèle
      favorite_team: value.favorite || undefined,
      role: 'subscriber',
    });

    const context = requestAuditContext(req);
    const sessionId = await startSession(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      { ip: context.ip, userAgent: context.userAgent }
    );

    await recordActivity({
      actor: { id: user.id, name: user.name, email: user.email, role: user.role },
      action: 'auth.register',
      category: 'auth',
      description: 'Création de compte',
      ...context,
      status: 201,
      targetType: 'auth',
      targetId: user.id,
    });

    res.status(201).json({
      success: true,
      data: {
        user,
        permissions: permissionsOf(user.role),
        tokens: issueTokens({ userId: user.id, role: user.role, sessionId }),
      },
    });
  })
);

router.post(
  '/login',
  loginLimiter,
  handler(async (req, res) => {
    const value = await loginSchema.validateAsync(req.body, { stripUnknown: true });
    const email = value.email.toLowerCase().trim();
    const context = requestAuditContext(req);

    const user = await SiteUser.findOne({ email }).select('+password_hash');

    if (!user || !(await user.validatePassword(value.password))) {
      await recordActivity({
        actor: user
          ? { id: user.id, name: user.name, email: user.email, role: user.role }
          : { email },
        action: 'auth.login_failed',
        category: 'auth',
        description: 'Tentative de connexion échouée',
        ...context,
        status: 401,
        targetType: 'auth',
        metadata: { email },
      });
      throw unauthorized('Email ou mot de passe incorrect');
    }

    if (!user.is_active) {
      await recordActivity({
        actor: { id: user.id, name: user.name, email: user.email, role: user.role },
        action: 'auth.login_blocked',
        category: 'auth',
        description: 'Connexion refusée : compte désactivé',
        ...context,
        status: 403,
        targetType: 'auth',
      });
      throw unauthorized('Ce compte est désactivé');
    }

    user.last_login_at = new Date();
    await user.save();

    const sessionId = await startSession(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      { ip: context.ip, userAgent: context.userAgent }
    );

    await recordActivity({
      actor: { id: user.id, name: user.name, email: user.email, role: user.role },
      action: 'auth.login',
      category: 'auth',
      description: 'Connexion réussie',
      ...context,
      status: 200,
      targetType: 'auth',
    });

    res.json({
      success: true,
      data: {
        user,
        permissions: permissionsOf(user.role),
        tokens: issueTokens({ userId: user.id, role: user.role, sessionId }),
      },
    });
  })
);

router.post(
  '/refresh',
  handler(async (req, res) => {
    const value = await refreshSchema.validateAsync(req.body, { stripUnknown: true });
    const payload = verify(value.refresh_token, 'refresh');

    const user = await SiteUser.findById(payload.userId);
    if (!user || !user.is_active) throw unauthorized('Session invalide');

    const context = requestAuditContext(req);
    const sessionId = await continueSession(
      payload.sessionId,
      { id: user.id, name: user.name, email: user.email, role: user.role },
      { ip: context.ip, userAgent: context.userAgent }
    );

    res.json({
      success: true,
      data: {
        user,
        permissions: permissionsOf(user.role),
        tokens: issueTokens({ userId: user.id, role: user.role, sessionId }),
      },
    });
  })
);

router.get(
  '/me',
  authenticate,
  handler(async (req, res) => {
    const user = await SiteUser.findById(req.auth!.userId);
    if (!user || !user.is_active) throw unauthorized('Session invalide');

    res.json({ success: true, data: { user, permissions: permissionsOf(user.role) } });
  })
);

router.post(
  '/logout',
  optionalAuth,
  handler(async (req, res) => {
    if (req.auth) {
      const user = await SiteUser.findById(req.auth.userId).select('name email role');
      await endSession(req.auth.sessionId);

      if (user) {
        await recordActivity({
          actor: { id: user.id, name: user.name, email: user.email, role: user.role },
          action: 'auth.logout',
          category: 'auth',
          description: 'Déconnexion',
          ...requestAuditContext(req),
          status: 200,
          targetType: 'auth',
        });
      }
    }

    res.json({ success: true, message: 'Déconnecté' });
  })
);

export default router;
