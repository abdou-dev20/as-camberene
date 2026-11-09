import mongoose from 'mongoose';
import Player from '../models/Player.model';

interface ScorerLike {
  player?: mongoose.Types.ObjectId | string | null;
  side?: string;
  assistPlayer?: mongoose.Types.ObjectId | string | null;
}

interface MatchLike {
  status?: string;
  scorers?: ScorerLike[];
}

type Tally = Map<string, { goals: number; assists: number }>;

export const tallyOf = (match: MatchLike | null | undefined): Tally => {
  const tally: Tally = new Map();
  if (!match || match.status !== 'Terminé') return tally;

  const add = (id: ScorerLike['player'], key: 'goals' | 'assists') => {
    if (!id) return;
    const entry = tally.get(String(id)) ?? { goals: 0, assists: 0 };
    entry[key] += 1;
    tally.set(String(id), entry);
  };

  (match.scorers ?? []).forEach((scorer) => {
    if (scorer.side !== 'club') return;
    add(scorer.player, 'goals');
    add(scorer.assistPlayer, 'assists');
  });
  return tally;
};

const increment = (field: string, delta: number) => ({
  $max: [0, { $add: [{ $ifNull: [`$${field}`, 0] }, delta] }],
});

export const syncMatchStats = async (before: MatchLike | null, after: MatchLike | null): Promise<void> => {
  const old = tallyOf(before);
  const next = tallyOf(after);
  const ids = new Set([...old.keys(), ...next.keys()]);

  await Promise.all(
    [...ids].map((id) => {
      const goals = (next.get(id)?.goals ?? 0) - (old.get(id)?.goals ?? 0);
      const assists = (next.get(id)?.assists ?? 0) - (old.get(id)?.assists ?? 0);
      if (goals === 0 && assists === 0) return null;
      if (!mongoose.isValidObjectId(id)) return null;
      return Player.updateOne({ _id: id }, [
        {
          $set: {
            'stats.goals': increment('stats.goals', goals),
            'stats.assists': increment('stats.assists', assists),
          },
        },
      ]);
    })
  );
};
