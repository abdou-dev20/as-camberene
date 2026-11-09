import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().max(255).required().messages({
    'string.email': 'Email invalide',
    'any.required': 'Email requis',
  }),
  password: Joi.string().max(128).required().messages({
    'any.required': 'Mot de passe requis',
  }),
});

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'any.required': 'Nom requis',
  }),
  email: Joi.string().email().max(255).required().messages({
    'string.email': 'Email invalide',
    'any.required': 'Email requis',
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
    'any.required': 'Mot de passe requis',
  }),
  favorite: Joi.string().trim().max(120).allow('', null),
});

export const refreshSchema = Joi.object({
  refresh_token: Joi.string().required().messages({
    'any.required': 'Jeton de rafraîchissement requis',
  }),
});
