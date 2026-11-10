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
    maxBytes: Number(process.env.UPLOAD_MAX_BYTES ?? 100 * 1024 * 1024),
  },
  /**
   * Compte d'administration créé au démarrage s'il n'existe pas encore (voir
   * lib/defaultAdmin.ts). Facultatif : sans ces variables, rien n'est créé.
   */
  defaultAdmin: {
    email: process.env.DEFAULT_ADMIN_EMAIL?.trim() ?? '',
    password: process.env.DEFAULT_ADMIN_PASSWORD ?? '',
    name: process.env.DEFAULT_ADMIN_NAME?.trim() ?? '',
  },
};

export default config;
