import { Router } from 'express';
import mongoose from 'mongoose';
import Album from '../models/Album.model';
import GalleryItem from '../models/GalleryItem.model';
import { handler, notFound } from '../lib/http';
import { authenticate, canPreviewDrafts, optionalAuth, requirePermission } from '../middlewares/auth';
import { albumSchema, albumPatchSchema } from '../validators/content';

const router = Router();
const requireWrite = requirePermission('gallery:write');

const scopeFor = (staffPreview: boolean) => (staffPreview ? {} : { isVisible: true });

const shapePhoto = (photo: Record<string, unknown>) => ({
  ...photo,
  id: String(photo._id),
  _id: undefined,
  album: photo.album ? String(photo.album) : null,
  match: photo.match ? String(photo.match) : null,
});

const shapeAlbum = (album: Record<string, unknown>, photoCount: number, photos?: Record<string, unknown>[]) => ({
  id: String(album._id),
  title: album.title ?? '',
  description: album.description ?? '',
  cover: album.cover ?? '',
  category: album.category ?? 'club',
  match: album.match ? String(album.match) : null,
  date: album.date ?? '',
  rank: album.rank ?? 0,
  isVisible: album.isVisible ?? true,
  photoCount,
  created_at: album.created_at,
  updated_at: album.updated_at,
  ...(photos ? { photos: photos.map(shapePhoto) } : {}),
});

const countPhotos = async (albumIds: mongoose.Types.ObjectId[]) => {
  const rows = await GalleryItem.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
    { $match: { album: { $in: albumIds }, isVisible: true } },
    { $group: { _id: '$album', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [String(row._id), row.count]));
};

router.get(
  '/',
  optionalAuth,
  handler(async (req, res) => {
    const query: Record<string, unknown> = { ...scopeFor(canPreviewDrafts(req)) };
    const category = req.query.category;
    if (typeof category === 'string' && category) query.category = category;
    const match = req.query.match;
    if (typeof match === 'string' && match) query.match = match;

    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    if (search) {
      const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ title: pattern }, { description: pattern }];
    }

    const albums = await Album.find(query)
      .sort((req.query.sort as string) || '-rank -date -created_at')
      .limit(100)
      .lean();

    const counts = await countPhotos(albums.map((album) => album._id as mongoose.Types.ObjectId));
    const data = albums.map((album) =>
      shapeAlbum(album as Record<string, unknown>, counts.get(String(album._id)) ?? 0)
    );

    res.json({ success: true, data });
  })
);

router.get(
  '/:id',
  optionalAuth,
  handler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw notFound();
    const album = await Album.findOne({ _id: req.params.id, ...scopeFor(canPreviewDrafts(req)) }).lean();
    if (!album) throw notFound();

    const photos = await GalleryItem.find({
      album: album._id,
      ...(canPreviewDrafts(req) ? {} : { isVisible: true }),
    })
      .sort('-rank created_at')
      .lean();

    res.json({
      success: true,
      data: shapeAlbum(album as Record<string, unknown>, photos.length, photos as Record<string, unknown>[]),
    });
  })
);

router.post(
  '/',
  authenticate,
  requireWrite,
  handler(async (req, res) => {
    const value = await albumSchema.validateAsync(req.body, { stripUnknown: true });
    const created = await Album.create(value);
    res.status(201).json({ success: true, data: shapeAlbum(created.toObject() as unknown as Record<string, unknown>, 0) });
  })
);

router.put(
  '/:id',
  authenticate,
  requireWrite,
  handler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw notFound();
    const value = await albumPatchSchema.validateAsync(req.body, { stripUnknown: true });
    const updated = await Album.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true });
    if (!updated) throw notFound();
    const counts = await countPhotos([updated._id as mongoose.Types.ObjectId]);
    res.json({ success: true, data: shapeAlbum(updated.toObject() as unknown as Record<string, unknown>, counts.get(String(updated._id)) ?? 0) });
  })
);

router.delete(
  '/:id',
  authenticate,
  requireWrite,
  handler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw notFound();
    const deleted = await Album.findByIdAndDelete(req.params.id);
    if (!deleted) throw notFound();
    await GalleryItem.updateMany({ album: deleted._id }, { album: null });
    res.json({ success: true, message: 'Album supprimé' });
  })
);

export default router;
