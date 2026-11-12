/**
 * Images téléversées sur RustFS (compatible S3).
 *
 * Le bucket reste privé : les clés S3 ne quittent jamais le serveur, et c'est
 * l'API qui relit les images pour les servir sous /media/… (voir
 * routes/media.routes.ts). La base n'enregistre donc qu'un chemin court et
 * stable — /media/images/2026-11-12/<uuid>.jpg — et jamais une URL signée,
 * qui expirerait.
 */
import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import {
  GetObjectCommand,
  GetObjectCommandOutput,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import config from '../config/env';

/** Formats acceptés, et l'extension que porte la clé de chacun. */
export const IMAGE_TYPES = new Map<string, string>([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/avif', '.avif'],
  ['image/gif', '.gif'],
]);

const TYPE_OF_EXTENSION = new Map([...IMAGE_TYPES].map(([type, extension]) => [extension, type]));

/** Préfixe public : ce que la base enregistre, et ce que l'API sert. */
export const MEDIA_PATH = '/media/';

// Seules les clés que l'API a elle-même produites sont servies : un chemin
// arbitraire ne peut pas aller lire ailleurs dans le bucket.
const IMAGE_KEY =
  /^images\/\d{4}-\d{2}-\d{2}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|avif|gif)$/;

export const isImageKey = (key: string): boolean => IMAGE_KEY.test(key);

export const contentTypeOf = (key: string): string =>
  TYPE_OF_EXTENSION.get(key.slice(key.lastIndexOf('.'))) ?? 'application/octet-stream';

export const isS3Enabled = (): boolean => config.s3 !== null;

let client: S3Client | null = null;

const s3 = (): { client: S3Client; bucket: string } => {
  const settings = config.s3;
  if (!settings) throw new Error('Stockage S3 non configuré');

  client ??= new S3Client({
    endpoint: settings.endpoint,
    region: settings.region,
    // RustFS adresse les buckets dans le chemin, pas dans le nom d'hôte.
    forcePathStyle: true,
    credentials: {
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey,
    },
    // Les sommes de contrôle ajoutées par défaut aux versions récentes du SDK
    // ne sont pas comprises de tous les services compatibles S3.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    maxAttempts: 3,
  });

  return { client, bucket: settings.bucket };
};

/** Envoie un fichier déjà validé et renvoie sa clé dans le bucket. */
export const putImage = async (filePath: string, contentType: string): Promise<string> => {
  const extension = IMAGE_TYPES.get(contentType);
  if (!extension) throw new Error(`Format non pris en charge : ${contentType}`);

  const { client: s3Client, bucket } = s3();
  const size = (await stat(filePath)).size;
  const key = `images/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extension}`;
  const body = createReadStream(filePath);

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentLength: size,
        ContentType: contentType,
      })
    );
  } finally {
    body.destroy();
  }

  return key;
};

export const getImage = (key: string, ifNoneMatch?: string): Promise<GetObjectCommandOutput> => {
  const { client: s3Client, bucket } = s3();
  return s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key, IfNoneMatch: ifNoneMatch }));
};
