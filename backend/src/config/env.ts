import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env');
const envFileFound = fs.existsSync(envPath);

dotenv.config();

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `${name} est absent de l'environnement.\n`
      + (envFileFound
        ? `  ${envPath} a été lu, mais ne définit pas ${name}.`
        : `  Aucun fichier ${envPath}.\n`
          + '  Le créer à partir de backend/.env.example, ou lancer la commande'
          + ' depuis le dossier backend/ —\n'
          + '  sous Docker, la configuration vient de l\'environnement du'
          + ' conteneur : y exécuter la commande.')
    );
  }
  return value;
};

const isProduction = process.env.NODE_ENV === 'production';

const secret = (name: string): string => {
  const value = required(name);

  if (isProduction && value.startsWith('changez')) {
    throw new Error(`${name} a gardé sa valeur d'exemple : la changer avant de déployer.`);
  }
  return value;
};

export const config = {
  port: Number(process.env.PORT ?? 4100),
  isProduction,

  trustProxy: Number(process.env.TRUST_PROXY ?? 0),
  mongoUri: required('MONGODB_URI'),
  jwt: {
    accessSecret: secret('JWT_ACCESS_SECRET'),
    refreshSecret: secret('JWT_REFRESH_SECRET'),
    accessTtl: process.env.JWT_ACCESS_TTL ?? '2h',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
  },

  siteUrl: (process.env.SITE_URL ?? process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')[0]
    .trim()
    .replace(/\/+$/, ''),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  upload: {
    dir: path.resolve(__dirname, '../..', process.env.UPLOAD_DIR ?? 'uploads'),
    maxBytes: Number(process.env.UPLOAD_MAX_BYTES ?? 150 * 1024 * 1024),
  },
  /**
   * Passerelle PayTech, pour les dons.
   *
   * Facultative, contrairement aux secrets des jetons : sans clés, le site
   * démarre et la page des dons annonce qu'ils ne sont pas encore ouverts. Un
   * serveur qui refuserait de démarrer faute de passerelle priverait tout le
   * site pour une seule page.
   *
   * `env` vaut `test` tant que le compte marchand n'est pas activé : PayTech
   * simule alors le paiement, et rien n'est débité.
   */
  paytech: {
    apiKey: process.env.PAYTECH_API_KEY?.trim() ?? '',
    apiSecret: process.env.PAYTECH_API_SECRET?.trim() ?? '',
    env: process.env.PAYTECH_ENV?.trim() === 'prod' ? ('prod' as const) : ('test' as const),
  },
};

export default config;
