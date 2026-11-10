import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from './config/env';
import routes from './routes';
import { errorHandler, routeNotFound } from './middlewares/errors';

export const createApp = (): Application => {
  const app = express();

  if (config.trustProxy > 0) app.set('trust proxy', config.trustProxy);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const localhostOrigin = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

  app.use(
    cors({
      origin: (origin, done) => {
        if (!origin) return done(null, true);

        const allowed =
          config.corsOrigins.includes(origin) ||
          (!config.isProduction && localhostOrigin.test(origin));

        done(null, allowed);
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(config.isProduction ? 'combined' : 'dev'));

  // Une page publique coûte une dizaine de lectures, et au Sénégal beaucoup de
  // visiteurs mobiles partagent la même adresse IP (CGNAT) : les lectures ont
  // donc un plafond large, les écritures gardent le plafond serré.
  const tooMany = { success: false, message: 'Trop de requêtes, réessayez plus tard.' };
  const isRead = (req: express.Request) => req.method === 'GET' || req.method === 'HEAD';
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 3000,
      skip: (req) => !isRead(req),
      standardHeaders: true,
      legacyHeaders: false,
      message: tooMany,
    })
  );
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      skip: isRead,
      standardHeaders: true,
      legacyHeaders: false,
      message: tooMany,
    })
  );

  app.get('/health', (_req, res) => {
    res.json({ success: true, service: 'asc-camberene-api', timestamp: new Date().toISOString() });
  });

  app.use('/uploads', express.static(config.upload.dir, { maxAge: '30d', index: false }));
  app.use('/api', routes);

  app.use(routeNotFound);
  app.use(errorHandler);

  return app;
};

export default createApp;
