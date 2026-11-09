/**
 * Dons en ligne, par PayTech.
 *
 * Le parcours tient en trois temps :
 *
 *   1. le donateur remplit le formulaire ; le serveur crée le don « en
 *      attente », ouvre une session PayTech et renvoie son adresse ;
 *   2. le donateur paie sur la page de PayTech (Wave, Orange Money, carte…) ;
 *   3. PayTech prévient le serveur (IPN) et le don passe « payé » — pendant
 *      que le navigateur revient sur la page de remerciement, qui interroge
 *      le statut jusqu'à le voir changer.
 *
 * Le suivi est réservé à ceux qui tiennent déjà commandes et billets.
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import Donation, {
  DONATION_MAX,
  DONATION_MIN,
  generateDonationReference,
} from '../models/Donation.model';
import config from '../config/env';
import { HttpError, handler, notFound } from '../lib/http';
import { paytechEnabled, requestPayment, verifyNotification } from '../lib/paytech';
import { authenticate, requirePermission } from '../middlewares/auth';
import { createDonationSchema, updateDonationSchema } from '../validators/donations';

const router = Router();

const requireDesk = requirePermission('orders:manage');

/** Même garde que la billetterie : un formulaire public se remplit aussi par robot. */
const donationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de tentatives depuis cet appareil. Réessayez plus tard ou contactez le club.',
  },
});

/* ------------------------------------------------------------------ *
 * Public
 * ------------------------------------------------------------------ */

/** Ce que la page des dons doit savoir avant d'afficher son formulaire. */
router.get('/config', (_req, res) => {
  res.json({
    success: true,
    data: { enabled: paytechEnabled(), min: DONATION_MIN, max: DONATION_MAX },
  });
});

router.post(
  '/',
  donationLimiter,
  handler(async (req, res) => {
    if (!paytechEnabled()) {
      throw new HttpError(503, "Les dons en ligne ne sont pas encore ouverts.");
    }

    const value = await createDonationSchema.validateAsync(req.body, { stripUnknown: true });
    const donation = await Donation.create({ ...value, reference: generateDonationReference() });

    // PayTech n'accepte qu'une adresse de notification en HTTPS : en local,
    // on s'en passe, et le don reste « en attente » — le paiement de test se
    // vérifie alors dans le tableau de bord PayTech.
    const ipnUrl = config.siteUrl.startsWith('https://')
      ? `${config.siteUrl}/api/donations/ipn`
      : undefined;

    try {
      const session = await requestPayment({
        reference: donation.reference,
        amount: donation.amount,
        itemName: 'Don à l’ASC Cambérène',
        commandName: `Don de ${donation.amount} FCFA — ${donation.reference}`,
        successUrl: `${config.siteUrl}/dons/merci?ref=${donation.reference}`,
        cancelUrl: `${config.siteUrl}/dons?annule=${donation.reference}`,
        ipnUrl,
      });

      donation.paytechToken = session.token;
      await donation.save();

      res.status(201).json({
        success: true,
        data: { reference: donation.reference, redirectUrl: session.redirectUrl },
      });
    } catch (cause) {
      // La session n'a pas pu s'ouvrir : le don n'aura jamais de paiement, et
      // le laisser « en attente » le ferait passer pour un don en cours.
      donation.status = 'echouee';
      await donation.save();
      throw cause;
    }
  })
);

/**
 * Notification de PayTech.
 *
 * Elle peut arriver plusieurs fois pour le même paiement : le traitement est
 * donc idempotent, et un don déjà payé ne redescend jamais. Une notification
 * non authentifiée est refusée sans rien toucher.
 */
router.post(
  '/ipn',
  handler(async (req, res) => {
    const payload = (req.body ?? {}) as Record<string, unknown>;

    if (!paytechEnabled() || !verifyNotification(payload)) {
      console.warn('Notification PayTech rejetée : signature invalide', payload.ref_command);
      throw new HttpError(403, 'Notification non authentifiée');
    }

    const donation = await Donation.findOne({ reference: String(payload.ref_command ?? '') });
    if (!donation) throw notFound('Don introuvable');

    const event = String(payload.type_event ?? '');

    if (event === 'sale_complete' && donation.status !== 'payee') {
      // Le montant signé doit être celui demandé : sinon, quelqu'un aurait
      // payé un autre prix pour la même référence.
      if (Number(payload.item_price) !== donation.amount) {
        console.error('Montant PayTech différent du don', donation.reference, payload.item_price);
        throw new HttpError(409, 'Montant incohérent');
      }
      donation.status = 'payee';
      donation.paidAmount = Number(payload.final_item_price ?? payload.item_price);
      donation.paymentMethod = String(payload.payment_method ?? '').slice(0, 60) || undefined;
      donation.paidAt = new Date();
      await donation.save();
    } else if (event === 'sale_canceled' && donation.status === 'en_attente') {
      donation.status = 'annulee';
      await donation.save();
    }

    res.json({ success: true });
  })
);

/**
 * Où en est un don, pour la page de remerciement.
 *
 * La référence suffit : elle est tirée au sort et ne circule qu'entre le
 * donateur et PayTech. On ne rend que ce que la page affiche.
 */
router.get(
  '/status/:reference',
  handler(async (req, res) => {
    const donation = await Donation.findOne({ reference: req.params.reference.toUpperCase() });
    if (!donation) throw notFound('Don introuvable');

    res.json({
      success: true,
      data: {
        reference: donation.reference,
        amount: donation.amount,
        status: donation.status,
      },
    });
  })
);

/* ------------------------------------------------------------------ *
 * Suivi — réservé au club
 * ------------------------------------------------------------------ */
router.get(
  '/',
  authenticate,
  requireDesk,
  handler(async (req, res) => {
    const query: Record<string, unknown> = {};
    if (typeof req.query.status === 'string' && req.query.status) query.status = req.query.status;

    const donations = await Donation.find(query).sort('-created_at').limit(1000);
    res.json({ success: true, data: donations });
  })
);

router.put(
  '/:id',
  authenticate,
  requireDesk,
  handler(async (req, res) => {
    const value = await updateDonationSchema.validateAsync(req.body, { stripUnknown: true });

    const donation = await Donation.findById(req.params.id);
    if (!donation) throw notFound();

    Object.assign(donation, value);
    // Un don pointé payé à la main garde la date du pointage.
    if (value.status === 'payee' && !donation.paidAt) {
      donation.paidAt = new Date();
      donation.paidAmount = donation.paidAmount ?? donation.amount;
    }
    await donation.save();

    res.json({ success: true, data: donation });
  })
);

export default router;
