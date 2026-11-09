import Joi from 'joi';
import { POTM_STATUSES } from '../models/PlayerOfMonth.model';

const objectId = Joi.string().hex().length(24);

export const createPotmSchema = Joi.object({
  month: Joi.string()
    .pattern(/^\d{4}-(0[1-9]|1[0-2])$/)
    .required()
    .messages({ 'string.pattern.base': 'Le mois doit être au format AAAA-MM' }),
  title: Joi.string().trim().allow('').max(150).default(''),
  nominees: Joi.array().items(objectId).min(2).max(12).unique().required().messages({
    'array.min': 'Nommez au moins deux joueurs',
  }),
  status: Joi.string().valid(...POTM_STATUSES).default('open'),
});

export const updatePotmSchema = Joi.object({
  title: Joi.string().trim().allow('').max(150),
  nominees: Joi.array().items(objectId).min(2).max(12).unique().messages({
    'array.min': 'Nommez au moins deux joueurs',
  }),
  status: Joi.string().valid(...POTM_STATUSES),
}).min(1);

export const voteSchema = Joi.object({
  player: objectId.required(),
});
