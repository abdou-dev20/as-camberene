/**
 * Saisie des dons.
 *
 * Le donateur choisit le montant et dit qui il est ; le statut, lui, ne vient
 * que de PayTech. Il n'est donc pas dans le schéma public : personne ne doit
 * pouvoir créer un don déjà « payé ».
 */

import Joi from 'joi';
import { DONATION_MAX, DONATION_MIN, DONATION_STATUSES } from '../models/Donation.model';

export const createDonationSchema = Joi.object({
  amount: Joi.number().integer().min(DONATION_MIN).max(DONATION_MAX).required().messages({
    'number.min': `Le don minimum est de ${DONATION_MIN} FCFA`,
    'number.max': 'Pour un don de ce montant, contactez directement le club',
    'number.base': 'Indiquer un montant',
    'any.required': 'Indiquer un montant',
  }),
  name: Joi.string().trim().min(2).max(120).required().messages({
    'string.min': 'Indiquer un nom',
    'any.required': 'Nom requis',
  }),
  email: Joi.string().email().max(255).allow('').default(''),
  phone: Joi.string()
    .trim()
    .pattern(/^\+?[\d\s.-]{7,20}$/)
    .allow('')
    .default('')
    .messages({ 'string.pattern.base': 'Numéro de téléphone invalide' }),
  anonymous: Joi.boolean().default(false),
  message: Joi.string().allow('').max(1000).default(''),
});

/**
 * Ce que le club modifie ensuite.
 *
 * Le statut reste modifiable à la main : si une notification de PayTech s'est
 * perdue, le club constate le paiement dans son tableau de bord PayTech et le
 * reporte ici.
 */
export const updateDonationSchema = Joi.object({
  status: Joi.string().valid(...DONATION_STATUSES),
  note: Joi.string().allow('').max(1000),
})
  .min(1)
  .messages({ 'object.min': 'Aucune modification fournie' });
