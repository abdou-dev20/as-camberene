import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import TicketReservation, {
  generateReservationReference,
} from '../models/TicketReservation.model';
import Match from '../models/Match.model';
import { HttpError, handler, notFound } from '../lib/http';
import { authenticate, requirePermission } from '../middlewares/auth';
import { createReservationSchema, updateReservationSchema } from '../validators/tickets';

const router = Router();

const requireDesk = requirePermission('orders:manage');

const reservationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de réservations depuis cet appareil. Réessayez plus tard ou appelez le club.',
  },
});

router.post(
  '/',
  reservationLimiter,
  handler(async (req, res) => {
    const value = await createReservationSchema.validateAsync(req.body, { stripUnknown: true });

    const match = await Match.findById(value.match);
    if (!match) throw new HttpError(404, 'Rencontre introuvable');

    if (match.status === 'Terminé') {
      throw new HttpError(409, 'Cette rencontre a déjà eu lieu');
    }

    const reservation = await TicketReservation.create({
      ...value,
      reference: generateReservationReference(),
    });

    res.status(201).json({
      success: true,
      data: {
        reference: reservation.reference,
        seats: reservation.seats,
        match: { opponent: match.opponent, date: match.date, time: match.time, venue: match.venue },
      },
      message: `Réservation enregistrée. Référence à présenter au guichet : ${reservation.reference}`,
    });
  })
);

router.get(
  '/',
  authenticate,
  requireDesk,
  handler(async (req, res) => {
    const query: Record<string, unknown> = {};
    if (typeof req.query.status === 'string' && req.query.status) query.status = req.query.status;
    if (typeof req.query.match === 'string' && req.query.match) query.match = req.query.match;

    const reservations = await TicketReservation.find(query)
      .sort('-created_at')
      .limit(500)
      .populate('match', 'opponent date time venue competition status');

    res.json({ success: true, data: reservations });
  })
);

router.put(
  '/:id',
  authenticate,
  requireDesk,
  handler(async (req, res) => {
    const value = await updateReservationSchema.validateAsync(req.body, { stripUnknown: true });

    const updated = await TicketReservation.findByIdAndUpdate(req.params.id, value, {
      new: true,
      runValidators: true,
    }).populate('match', 'opponent date time venue competition status');

    if (!updated) throw notFound();
    res.json({ success: true, data: updated });
  })
);

router.delete(
  '/:id',
  authenticate,
  requireDesk,
  handler(async (req, res) => {
    const deleted = await TicketReservation.findByIdAndDelete(req.params.id);
    if (!deleted) throw notFound();
    res.json({ success: true, message: 'Réservation supprimée' });
  })
);

export default router;
