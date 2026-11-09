import { connectDatabase, disconnectDatabase, safeMongoUri } from '../src/config/database';
import Match from '../src/models/Match.model';
import Player from '../src/models/Player.model';
import { tallyOf } from '../src/lib/matchStats';

async function main(): Promise<number> {
  console.log(`Base : ${safeMongoUri()}\n`);
  await connectDatabase();

  try {
    const matches = await Match.find({ status: 'Terminé' }).lean();
    const totals = new Map<string, { goals: number; assists: number }>();
    matches.forEach((match) => {
      tallyOf(match).forEach((count, id) => {
        const entry = totals.get(id) ?? { goals: 0, assists: 0 };
        entry.goals += count.goals;
        entry.assists += count.assists;
        totals.set(id, entry);
      });
    });

    const players = await Player.find({ kind: 'player' }).sort('name');
    for (const player of players) {
      const before = { goals: player.stats?.goals ?? 0, assists: player.stats?.assists ?? 0 };
      const after = totals.get(String(player._id)) ?? { goals: 0, assists: 0 };
      await Player.updateOne(
        { _id: player._id },
        { $set: { 'stats.goals': after.goals, 'stats.assists': after.assists } }
      );
      const changed = before.goals !== after.goals || before.assists !== after.assists;
      console.log(
        `${changed ? '[+]' : '[=]'} ${player.name.padEnd(28)} buts ${before.goals} → ${after.goals}   passes ${before.assists} → ${after.assists}`
      );
    }

    const known = new Set(players.map((player) => String(player._id)));
    const orphans = [...totals.keys()].filter((id) => !known.has(id));
    if (orphans.length > 0) {
      console.log(`\n${orphans.length} fiche(s) citée(s) dans des feuilles de match mais absente(s) de l'effectif : ignorée(s).`);
    }

    console.log(`\n${matches.length} match(s) terminé(s) relu(s), ${players.length} joueur(s) recalculé(s).`);
    return 0;
  } finally {
    await disconnectDatabase();
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error('Échec :', error instanceof Error ? error.message : error);
    process.exit(1);
  });
