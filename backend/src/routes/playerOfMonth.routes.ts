import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import PlayerOfMonth, { PlayerOfMonthVote } from '../models/PlayerOfMonth.model';
import Player from '../models/Player.model';
import { HttpError, handler, notFound } from '../lib/http';
import { authenticate, optionalAuth, requirePermission } from '../middlewares/auth';
import { createPotmSchema, updatePotmSchema, voteSchema } from '../validators/playerOfMonth';

const router = Router();
const requireManage = requirePermission('players:write');

const voteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de votes depuis cet appareil. Réessayez plus tard.',
  },
});

const NOMINEE_FIELDS = 'name photo number line position team';

const STAFF_SHARE = 0.5;

interface VoteTally {
  staff: number;
  supporters: number;
}

const countVotes = async (pollId: mongoose.Types.ObjectId) => {
  const rows = await PlayerOfMonthVote.aggregate<{ _id: mongoose.Types.ObjectId; staff: number; supporters: number }>([
    { $match: { poll: pollId } },
    {
      $lookup: {
        from: 'site_users',
        localField: 'user',
        foreignField: '_id',
        as: 'voter',
      },
    },
    { $unwind: { path: '$voter', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$player',
        supporters: {
          $sum: { $cond: [{ $eq: [{ $ifNull: ['$voter.role', 'subscriber'] }, 'subscriber'] }, 1, 0] },
        },
        staff: {
          $sum: { $cond: [{ $eq: [{ $ifNull: ['$voter.role', 'subscriber'] }, 'subscriber'] }, 0, 1] },
        },
      },
    },
  ]);
  return new Map<string, VoteTally>(
    rows.map((row) => [String(row._id), { staff: row.staff, supporters: row.supporters }])
  );
};

const shapeNominee = (player: { _id: unknown; name?: string; photo?: string; number?: number; line?: string; position?: string }) => ({
  id: String(player._id),
  name: player.name ?? '',
  photo: player.photo ?? '',
  number: player.number ?? 0,
  line: player.line ?? '',
  position: player.position ?? '',
});

const closeOthers = (keepId: mongoose.Types.ObjectId) =>
  PlayerOfMonth.updateMany({ _id: { $ne: keepId }, status: 'open' }, { status: 'closed' });

const assertNomineesExist = async (ids: string[]) => {
  const found = await Player.countDocuments({ _id: { $in: ids }, kind: 'player' });
  if (found !== ids.length) throw new HttpError(400, 'Un joueur nommé ne fait pas partie de l’effectif');
};

router.get(
  '/current',
  optionalAuth,
  handler(async (req, res) => {
    const poll =
      (await PlayerOfMonth.findOne({ status: 'open' }).sort('-month').populate('nominees', NOMINEE_FIELDS).lean()) ??
      (await PlayerOfMonth.findOne({ status: 'closed' }).sort('-month').populate('nominees', NOMINEE_FIELDS).lean());

    if (!poll) return res.json({ success: true, data: null });

    const nominees = (poll.nominees as unknown as Parameters<typeof shapeNominee>[0][]).filter(Boolean).map(shapeNominee);

    const counts = await countVotes(poll._id);
    const totalSupporters = [...counts.values()].reduce((sum, tally) => sum + tally.supporters, 0);
    const totalStaff = [...counts.values()].reduce((sum, tally) => sum + tally.staff, 0);

    const percentOf = (tally: VoteTally | undefined): number => {
      if (!tally) return 0;
      const staffPart = totalStaff > 0 ? STAFF_SHARE * (tally.staff / totalStaff) : 0;
      const supportersPart = totalSupporters > 0 ? (1 - (totalStaff > 0 ? STAFF_SHARE : 0)) * (tally.supporters / totalSupporters) : 0;
      return Math.round((staffPart + supportersPart) * 100);
    };

    let myVote: string | null = null;
    if (req.auth) {
      const vote = await PlayerOfMonthVote.findOne({ poll: poll._id, user: req.auth.userId }).lean();
      myVote = vote ? String(vote.player) : null;
    }

    const revealResults = poll.status !== 'open' || myVote !== null;

        const withVotes = nominees
          .map((nominee) => {
            const tally = counts.get(nominee.id);
            const points = (tally?.supporters ?? 0) + (tally?.staff ?? 0);
            return {
              ...nominee,
              votes: revealResults ? points : 0,
              percent: revealResults ? percentOf(tally) : 0,
            };
          })
          .sort((a, b) => b.percent - a.percent || b.votes - a.votes || a.name.localeCompare(b.name, 'fr'));

    let winner: string | null = null;
    if (poll.status === 'closed') {
      const best = [...counts.entries()].sort(
        (a, b) => percentOf(b[1]) - percentOf(a[1])
      )[0];
      winner = best ? best[0] : null;
    }

    res.json({
      success: true,
      data: {
        id: String(poll._id),
        month: poll.month,
        title: poll.title,
        status: poll.status,
        nominees: withVotes,
        totalVotes: revealResults ? totalSupporters + totalStaff : 0,
        resultsRevealed: revealResults,
        myVote,
        winner,
      },
    });
  })
);

router.post(
  '/:id/vote',
  voteLimiter,
  authenticate,
  handler(async (req, res) => {
    const { player } = await voteSchema.validateAsync(req.body);
    if (!mongoose.isValidObjectId(req.params.id)) throw notFound();

    const poll = await PlayerOfMonth.findById(req.params.id).lean();
    if (!poll) throw notFound('Élection introuvable');
    if (poll.status !== 'open') throw new HttpError(409, 'Le vote est clos');
    if (!poll.nominees.some((id) => String(id) === player)) {
      throw new HttpError(400, 'Ce joueur n’est pas nommé ce mois-ci');
    }

    try {
      await PlayerOfMonthVote.create({ poll: poll._id, player, user: req.auth!.userId });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) throw new HttpError(409, 'Vous avez déjà voté ce mois-ci');
      throw error;
    }

    res.status(201).json({ success: true, data: { myVote: player } });
  })
);

router.get(
  '/',
  authenticate,
  requireManage,
  handler(async (_req, res) => {
    const polls = await PlayerOfMonth.find().sort('-month').populate('nominees', NOMINEE_FIELDS).lean();

    const data = await Promise.all(
      polls.map(async (poll) => {
        const counts = await countVotes(poll._id);
        const totalSupporters = [...counts.values()].reduce((sum, tally) => sum + tally.supporters, 0);
        const totalStaff = [...counts.values()].reduce((sum, tally) => sum + tally.staff, 0);
        const percentOf = (tally: VoteTally | undefined): number => {
          if (!tally) return 0;
          const staffPart = totalStaff > 0 ? STAFF_SHARE * (tally.staff / totalStaff) : 0;
          const supportersPart = totalSupporters > 0 ? (1 - (totalStaff > 0 ? STAFF_SHARE : 0)) * (tally.supporters / totalSupporters) : 0;
          return Math.round((staffPart + supportersPart) * 100);
        };
        const results = (poll.nominees as unknown as Parameters<typeof shapeNominee>[0][])
          .filter(Boolean)
          .map((nominee) => {
            const tally = counts.get(String(nominee._id));
            return {
              ...shapeNominee(nominee),
              votes: (tally?.supporters ?? 0) + (tally?.staff ?? 0),
              percent: percentOf(tally),
            };
          })
          .sort((a, b) => b.percent - a.percent || b.votes - a.votes || a.name.localeCompare(b.name));
        return {
          id: String(poll._id),
          month: poll.month,
          title: poll.title,
          status: poll.status,
          totalVotes: totalSupporters + totalStaff,
          results,
        };
      })
    );

    res.json({ success: true, data });
  })
);

router.post(
  '/',
  authenticate,
  requireManage,
  handler(async (req, res) => {
    const value = await createPotmSchema.validateAsync(req.body, { stripUnknown: true });
    await assertNomineesExist(value.nominees);
    if (await PlayerOfMonth.exists({ month: value.month })) {
      throw new HttpError(409, 'Une élection existe déjà pour ce mois');
    }
    const poll = await PlayerOfMonth.create(value);
    if (poll.status === 'open') await closeOthers(poll._id);
    res.status(201).json({ success: true, data: { id: String(poll._id) } });
  })
);

router.put(
  '/:id',
  authenticate,
  requireManage,
  handler(async (req, res) => {
    const value = await updatePotmSchema.validateAsync(req.body, { stripUnknown: true });
    if (!mongoose.isValidObjectId(req.params.id)) throw notFound();
    if (value.nominees) await assertNomineesExist(value.nominees);

    const poll = await PlayerOfMonth.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true });
    if (!poll) throw notFound('Élection introuvable');

    if (value.nominees) {
      await PlayerOfMonthVote.deleteMany({ poll: poll._id, player: { $nin: value.nominees } });
    }
    if (poll.status === 'open') await closeOthers(poll._id);

    res.json({ success: true, data: { id: String(poll._id) } });
  })
);

router.delete(
  '/:id',
  authenticate,
  requireManage,
  handler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw notFound();
    const poll = await PlayerOfMonth.findByIdAndDelete(req.params.id);
    if (!poll) throw notFound('Élection introuvable');
    await PlayerOfMonthVote.deleteMany({ poll: poll._id });
    res.json({ success: true, message: 'Supprimé' });
  })
);

export default router;
