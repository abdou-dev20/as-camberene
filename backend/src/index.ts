import config from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import createApp from './app';

const start = async (): Promise<void> => {
  await connectDatabase();
  console.log('MongoDB connecté');

  const server = createApp().listen(config.port, () => {
    console.log(`API du site ASC Cambérène sur http://localhost:${config.port}`);
    console.log(`Origines autorisées : ${config.corsOrigins.join(', ')}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n${signal} reçu, arrêt en cours…`);
    server.close();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
};

start().catch((error) => {
  console.error('Démarrage impossible :', error instanceof Error ? error.message : error);
  process.exit(1);
});
