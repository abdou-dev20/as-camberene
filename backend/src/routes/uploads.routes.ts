import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { open, unlink } from 'fs/promises';
import { Router } from 'express';
import multer from 'multer';
import config from '../config/env';
import { HttpError, handler } from '../lib/http';
import { IMAGE_TYPES, MEDIA_PATH, isS3Enabled, putImage } from '../lib/storage';
import { authenticate, requirePermission } from '../middlewares/auth';

const router = Router();

// Avec RustFS, le fichier ne fait que passer : il attend dans un dossier
// temporaire, hors de UPLOAD_DIR que l'API sert publiquement. Sans RustFS, il
// est écrit directement à sa place définitive, comme avant.
const s3 = isS3Enabled();
const destination = s3 ? path.join(os.tmpdir(), 'asc-uploads') : config.upload.dir;
fs.mkdirSync(destination, { recursive: true });
fs.mkdirSync(config.upload.dir, { recursive: true });

/**
 * Le type annoncé par le navigateur ne prouve rien : les premiers octets
 * doivent correspondre au format. Ce n'est pas une analyse antivirus, mais un
 * fichier quelconque renommé en .jpg ne passe plus.
 */
const hasExpectedSignature = async (filePath: string, mimetype: string): Promise<boolean> => {
  const file = await open(filePath, 'r');
  try {
    const bytes = Buffer.alloc(32);
    const { bytesRead } = await file.read(bytes, 0, bytes.length, 0);
    const head = bytes.subarray(0, bytesRead);

    switch (mimetype) {
      case 'image/jpeg':
        return head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
      case 'image/png':
        return head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
      case 'image/webp':
        return head.toString('ascii', 0, 4) === 'RIFF' && head.toString('ascii', 8, 12) === 'WEBP';
      case 'image/gif':
        return ['GIF87a', 'GIF89a'].includes(head.toString('ascii', 0, 6));
      case 'image/avif':
        return head.toString('ascii', 4, 8) === 'ftyp' && /avif|avis/.test(head.toString('ascii', 8));
      default:
        return false;
    }
  } finally {
    await file.close();
  }
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, done) => done(null, destination),
    // Jamais le nom fourni par le navigateur : l'extension vient du type validé.
    filename: (_req, file, done) =>
      done(null, `${crypto.randomBytes(16).toString('hex')}${IMAGE_TYPES.get(file.mimetype) ?? ''}`),
  }),
  limits: { fileSize: config.upload.maxBytes, files: 1 },
  fileFilter: (_req, file, done) => {
    if (!IMAGE_TYPES.has(file.mimetype)) {
      done(new HttpError(400, 'Format non accepté : JPEG, PNG, WebP, AVIF ou GIF uniquement'));
      return;
    }
    done(null, true);
  },
});

const removeQuietly = (filePath: string): Promise<void> =>
  unlink(filePath).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') console.error('Fichier temporaire impossible à supprimer :', filePath);
  });

router.post(
  '/',
  authenticate,
  requirePermission('media:upload'),
  upload.single('file'),
  handler(async (req, res) => {
    const file = req.file;
    if (!file) throw new HttpError(400, 'Aucun fichier reçu');

    let kept = false;
    try {
      if (!(await hasExpectedSignature(file.path, file.mimetype))) {
        throw new HttpError(400, 'Le contenu du fichier ne correspond pas à son format');
      }

      const url = s3
        ? `${MEDIA_PATH}${await putImage(file.path, file.mimetype)}`
        : `/uploads/${file.filename}`;
      kept = !s3;

      res.status(201).json({
        success: true,
        data: { url, size: file.size, mimetype: file.mimetype },
      });
    } finally {
      // Fichier temporaire après envoi à RustFS, ou fichier refusé : rien ne
      // doit s'accumuler sur le disque, même en cas d'erreur.
      if (!kept) await removeQuietly(file.path);
    }
  })
);

export default router;
