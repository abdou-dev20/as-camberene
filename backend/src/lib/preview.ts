import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import sharp from 'sharp';
import config from '../config/env';
import { getImage, isS3Enabled } from './storage';

/**
 * Aperçu de partage : WhatsApp refuse les images de 600 Ko et plus, alors
 * qu'une photo d'article peut peser plusieurs mégaoctets. On ne sert donc
 * jamais l'original aux réseaux : cette route en fabrique un JPEG de la taille
 * d'une carte (1200 × 630), mis en cache le temps du processus.
 */
const WIDTH = 1200;
const HEIGHT = 630;
const CACHE_LIMIT = 64;

const cache = new Map<string, Buffer>();

export const previewVersion = (image: string): string =>
  createHash('sha1').update(image).digest('hex').slice(0, 10);

const readAll = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

const sourceOf = async (image: string): Promise<Buffer | null> => {
  if (image.startsWith('/media/')) {
    if (!isS3Enabled()) return null;
    const object = await getImage(image.slice('/media/'.length));
    return object.Body ? readAll(object.Body as Readable) : null;
  }

  if (image.startsWith('/uploads/')) {
    const name = image.slice('/uploads/'.length);
    if (!/^[A-Za-z0-9._-]+$/.test(name)) return null;
    return readAll(createReadStream(path.join(config.upload.dir, name)));
  }

  return null;
};

export const buildPreview = async (image: string): Promise<Buffer | null> => {
  const cached = cache.get(image);
  if (cached) return cached;

  try {
    const source = await sourceOf(image);
    if (!source) return null;

    const body = await sharp(source)
      .rotate()
      .resize({
        width: WIDTH,
        height: HEIGHT,
        fit: 'cover',
        position: 'centre',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();

    if (cache.size >= CACHE_LIMIT) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }
    cache.set(image, body);

    return body;
  } catch {
    return null;
  }
};
