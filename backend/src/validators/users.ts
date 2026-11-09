import Joi from 'joi';
import { ASSIGNABLE_ROLES } from '../lib/roles';

const password = Joi.string().min(10).max(128).messages({
  'string.min': 'Le mot de passe doit contenir au moins 10 caractères',
});

export const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'any.required': 'Nom requis',
  }),
  email: Joi.string().email().max(255).required().messages({
    'string.email': 'Email invalide',
    'any.required': 'Email requis',
  }),
  role: Joi.string()
    .valid(...ASSIGNABLE_ROLES)
    .required()
    .messages({ 'any.only': 'Profil inconnu', 'any.required': 'Profil requis' }),

  password: password.optional(),
  is_active: Joi.boolean().default(true),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  role: Joi.string()
    .valid(...ASSIGNABLE_ROLES)
    .messages({ 'any.only': 'Profil inconnu' }),
  is_active: Joi.boolean(),
})
  .min(1)
  .messages({ 'object.min': 'Aucune modification fournie' });

export const resetPasswordSchema = Joi.object({
  password: password.optional(),
});
