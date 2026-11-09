import { Router } from 'express';
import Article from '../models/Article.model';
import { handler, notFound } from '../lib/http';
import { authenticate, requirePermission } from '../middlewares/auth';
import { commentSchema } from '../validators/content';

const router = Router({ mergeParams: true });

router.get(
  '/',
  handler(async (req, res) => {
    const article = await Article.findOne({ _id: req.params.articleId, status: 'published' });
    if (!article) throw notFound('Article introuvable');

    res.json({ success: true, data: article.comments });
  })
);

router.post(
  '/',
  handler(async (req, res) => {
    const value = await commentSchema.validateAsync(req.body, { stripUnknown: true });

    const article = await Article.findOne({ _id: req.params.articleId, status: 'published' });
    if (!article) throw notFound('Article introuvable');

    article.comments.push({ ...value, timestamp: new Date() });
    await article.save();

    res.status(201).json({ success: true, data: article.comments[article.comments.length - 1] });
  })
);

router.delete(
  '/:commentId',
  authenticate,
  requirePermission('comments:moderate'),
  handler(async (req, res) => {
    const article = await Article.findById(req.params.articleId);
    if (!article) throw notFound('Article introuvable');

    const before = article.comments.length;
    article.comments = article.comments.filter(
      (comment) => String(comment._id) !== req.params.commentId
    );

    if (article.comments.length === before) throw notFound('Commentaire introuvable');

    await article.save();
    res.json({ success: true, message: 'Commentaire supprimé' });
  })
);

export default router;
