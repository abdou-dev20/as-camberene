import crypto from 'crypto';
import { Router } from 'express';
import SiteUser from '../models/SiteUser.model';
import { handler, notFound } from '../lib/http';
import { HttpError } from '../lib/http';
import { ROLES, ROLE_LABELS, UserRole, permissionsOf } from '../lib/roles';
import { authenticate, requirePermission } from '../middlewares/auth';
import { createUserSchema, resetPasswordSchema, updateUserSchema } from '../validators/users';

const router = Router();

router.use(authenticate, requirePermission('users:manage'));

const generatePassword = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const pick = (length: number) =>
    Array.from(crypto.randomBytes(length))
      .map((byte) => alphabet[byte % alphabet.length])
      .join('');
  return `${pick(4)}-${pick(4)}-${pick(4)}!`;
};

const activeSuperadmins = (exceptId?: string): Promise<number> =>
  SiteUser.countDocuments({
    role: 'superadmin',
    is_active: true,
    ...(exceptId ? { _id: { $ne: exceptId } } : {}),
  });

const guardLastSuperadmin = async (target: { id: string; role: UserRole }): Promise<void> => {
  if (target.role !== 'superadmin') return;
  const remaining = await activeSuperadmins(target.id);
  if (remaining === 0) {
    throw new HttpError(
      409,
      "Ce compte est le dernier super administrateur actif : créez-en un autre avant de le retirer"
    );
  }
};

router.get('/roles', (_req, res) => {
  res.json({
    success: true,
    data: ROLES.map((role) => ({
      value: role,
      label: ROLE_LABELS[role],
      permissions: permissionsOf(role),
    })),
  });
});

router.get(
  '/',
  handler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));

    const query: Record<string, unknown> = {};

    if (typeof req.query.role === 'string' && ROLES.includes(req.query.role as UserRole)) {
      query.role = req.query.role;
    }
    if (req.query.is_active === 'true' || req.query.is_active === 'false') {
      query.is_active = req.query.is_active === 'true';
    }

    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    if (search) {
      const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: pattern }, { email: pattern }];
    }

    const [items, total] = await Promise.all([
      SiteUser.find(query).sort('role name').skip((page - 1) * limit).limit(limit),
      SiteUser.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  })
);

router.post(
  '/',
  handler(async (req, res) => {
    const value = await createUserSchema.validateAsync(req.body, { stripUnknown: true });
    const email = value.email.toLowerCase();

    const existing = await SiteUser.findOne({ email });
    if (existing) throw new HttpError(409, 'Cet email est déjà utilisé');

    const password: string = value.password ?? generatePassword();

    const user = await SiteUser.create({
      name: value.name,
      email,
      password_hash: password, // haché par le hook du modèle
      role: value.role,
      is_active: value.is_active,
      created_by: req.auth!.userId,
    });

    res.status(201).json({
      success: true,
      data: {
        user,

        ...(value.password ? {} : { generated_password: password }),
      },
    });
  })
);

router.put(
  '/:id',
  handler(async (req, res) => {
    const value = await updateUserSchema.validateAsync(req.body, { stripUnknown: true });

    const user = await SiteUser.findById(req.params.id);
    if (!user) throw notFound('Compte introuvable');

    const isSelf = user.id === req.auth!.userId;

    if (isSelf && value.role !== undefined && value.role !== user.role) {
      throw new HttpError(409, 'Vous ne pouvez pas changer votre propre profil');
    }
    if (isSelf && value.is_active === false) {
      throw new HttpError(409, 'Vous ne pouvez pas désactiver votre propre compte');
    }

    const losesSuperadmin =
      (value.role !== undefined && value.role !== 'superadmin') || value.is_active === false;
    if (losesSuperadmin) await guardLastSuperadmin({ id: user.id, role: user.role });

    if (value.name !== undefined) user.name = value.name;
    if (value.role !== undefined) user.role = value.role;
    if (value.is_active !== undefined) user.is_active = value.is_active;
    await user.save();

    res.json({ success: true, data: user });
  })
);

router.post(
  '/:id/password',
  handler(async (req, res) => {
    const value = await resetPasswordSchema.validateAsync(req.body, { stripUnknown: true });

    const user = await SiteUser.findById(req.params.id).select('+password_hash');
    if (!user) throw notFound('Compte introuvable');

    const password: string = value.password ?? generatePassword();
    user.password_hash = password;
    await user.save();

    res.json({
      success: true,
      data: { user, ...(value.password ? {} : { generated_password: password }) },
    });
  })
);

router.delete(
  '/:id',
  handler(async (req, res) => {
    const user = await SiteUser.findById(req.params.id);
    if (!user) throw notFound('Compte introuvable');

    if (user.id === req.auth!.userId) {
      throw new HttpError(409, 'Vous ne pouvez pas supprimer votre propre compte');
    }

    await guardLastSuperadmin({ id: user.id, role: user.role });
    await user.deleteOne();

    res.json({ success: true, message: 'Compte supprimé' });
  })
);

export default router;
