/**
 * Images stockées sur RustFS, servies par l'API sous /media/images/….
 *
 * Le bucket est privé : le navigateur ne lui parle jamais. Les clés portent un
 * UUID et ne sont jamais réécrites — une image modifiée est une nouvelle clé —
 * d'où un cache d'un an : après le premier affichage, le navigateur (et tout
 * cache intermédiaire) ne redemande plus rien à l'API.
 */
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { Router } from 'express';
import { S3ServiceException } from '@aws-sdk/client-s3';
import { handler, notFound } from '../lib/http';
import { contentTypeOf, getImage, isImageKey, isS3Enabled } from '../lib/storage';

const router = Router();

const statusOf = (error: unknown): number | undefined =>
  error instanceof S3ServiceException ? error.$metadata.httpStatusCode : undefined;

router.get(
  /^\/(images\/.+)$/,
  handler(async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!isS3Enabled() || !isImageKey(key)) throw notFound('Image introuvable');

    let object;
    try {
      object = await getImage(key, req.get('if-none-match'));
    } catch (error) {
      const status = statusOf(error);
      if (status === 304) {
        res.status(304).end();
        return;
      }
      if (status === 404) throw notFound('Image introuvable');
      throw error;
    }

    const body = object.Body as Readable | undefined;
    if (!body) throw notFound('Image introuvable');

    res.set({
      // Le type vient de l'extension de la clé, que l'API a choisie elle-même
      // après avoir vérifié le contenu : rien de ce que le bucket renvoie ne
      // peut faire passer l'image pour une page HTML.
      'Content-Type': contentTypeOf(key),
      'Cache-Control': 'public, max-age=31536000, immutable',
      ...(object.ContentLength !== undefined ? { 'Content-Length': String(object.ContentLength) } : {}),
      ...(object.ETag ? { ETag: object.ETag } : {}),
      ...(object.LastModified ? { 'Last-Modified': object.LastModified.toUTCString() } : {}),
    });

    if (req.method === 'HEAD') {
      body.destroy();
      res.end();
      return;
    }

    try {
      await pipeline(body, res);
    } catch (error) {
      // Une fois l'image commencée, plus de réponse d'erreur possible : le
      // visiteur a quitté la page, ou RustFS a coupé. On ferme simplement.
      if (!res.headersSent) throw error;
      res.destroy();
    }
  })
);

export default router;
