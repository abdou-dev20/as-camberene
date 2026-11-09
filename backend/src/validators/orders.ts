import Joi from 'joi';
import { FULFILMENTS, ORDER_STATUSES, PAYMENT_METHODS } from '../models/Order.model';

export const createOrderSchema = Joi.object({
  customer: Joi.object({
    name: Joi.string().trim().min(2).max(120).required().messages({
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'any.required': 'Nom requis',
    }),
    phone: Joi.string().trim().min(6).max(40).required().messages({
      'string.min': 'Numéro de téléphone trop court',
      'any.required': 'Téléphone requis',
    }),
    email: Joi.string().email().max(255).allow('', null),
  }).required(),

  items: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.string().hex().length(24).required().messages({
          'string.hex': 'Produit inconnu',
          'any.required': 'Produit requis',
        }),
        size: Joi.string().trim().max(20).allow('').default(''),
        quantity: Joi.number().integer().min(1).max(99).required(),
      })
    )
    .min(1)
    .required()
    .messages({ 'array.min': 'Le panier est vide' }),

  fulfilment: Joi.string().valid(...FULFILMENTS).default('retrait'),
  address: Joi.string().trim().max(300).allow('', null),
  payment_method: Joi.string().valid(...PAYMENT_METHODS).default('a_la_remise'),
  note: Joi.string().trim().max(1000).allow('', null),
})
  .when(Joi.object({ fulfilment: Joi.string().valid('livraison').required() }).unknown(), {
    then: Joi.object({
      address: Joi.string().trim().min(5).max(300).required().messages({
        'any.required': 'Adresse requise pour une livraison',
        'string.min': 'Adresse trop courte',
      }),
    }),
  });

export const updateOrderSchema = Joi.object({
  status: Joi.string().valid(...ORDER_STATUSES),
  note: Joi.string().trim().max(1000).allow(''),
})
  .min(1)
  .messages({ 'object.min': 'Aucune modification fournie' });
