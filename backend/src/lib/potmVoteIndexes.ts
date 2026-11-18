import { PlayerOfMonthVote } from '../models/PlayerOfMonth.model';

export const ensurePotmVoteIndexes = async (): Promise<void> => {
  const indexes = await PlayerOfMonthVote.collection.indexes();
  if (indexes.some((index) => index.name === 'poll_1_user_1')) {
    await PlayerOfMonthVote.collection.dropIndex('poll_1_user_1');
  }
  await PlayerOfMonthVote.createIndexes();
};
