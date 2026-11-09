import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Router } from 'express';
import multer from 'multer';
import config from '../config/env';
import { HttpError } from '../lib/http';
import { authenticate, requirePermission } from '../middlewares/auth';

const router = Router();

fs.mkdirSync(config.upload.dir, { recursive: true });

const ALLOWED = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/avif', '.avif'],
  ['image/gif', '.gif'],
]);

const storage = multer.diskStorage({
  destination: (_req, _file, done) => done(null, config.upload.dir),
  filename: (_req, file, done) => {
    const extension = ALLOWED.get(file.mimetype) ?? path.extname(file.originalname).toLowerCase();
    done(null, `${crypto.randomBytes(16).toString('hex')}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxBytes, files: 1 },
  fileFilter: (_req, file, done) => {
    if (!ALLOWED.has(file.mimetype)) {
      done(new HttpError(400, 'Format non accepté : JPEG, PNG, WebP, AVIF ou GIF uniquement'));
      return;
    }
    done(null, true);
  },
});

router.post('/', authenticate, requirePermission('media:upload'), upload.single('file'), (req, res) => {
  if (!req.file) throw new HttpError(400, 'Aucun fichier reçu');

  res.status(201).json({
    success: true,
    data: {
      url: `/uploads/${req.file.filename}`,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
  });
});

export default router;
