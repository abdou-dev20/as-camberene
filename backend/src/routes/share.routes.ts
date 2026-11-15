import { Router } from 'express';
import Article from '../models/Article.model';
import Match from '../models/Match.model';
import { handler, notFound } from '../lib/http';
import { buildPreview, previewVersion } from '../lib/preview';
import config from '../config/env';

const router = Router();

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const MEDIA_PREFIXES = ['/media/', '/uploads/'];

const absoluteImage = (value: string | undefined): string => {
  const trimmed = value?.trim();
  if (!trimmed) return `${config.siteUrl}/assets/img/asc-camberene-equipe-2025.webp`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = MEDIA_PREFIXES.some((prefix) => trimmed.startsWith(prefix))
    ? config.mediaUrl
    : config.siteUrl;
  return `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
};

const previewUrl = (id: string, image: string): string =>
  `${config.mediaUrl}/api/share/image/article/${id}?v=${previewVersion(image)}`;

const articleImage = (id: string, image: string | undefined): string => {
  const trimmed = image?.trim();
  if (trimmed && MEDIA_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) {
    return previewUrl(id, trimmed);
  }
  return absoluteImage(trimmed);
};

const IMAGE_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
};

const imageType = (url: string): string | undefined => {
  const path = url.split(/[?#]/)[0];
  return IMAGE_TYPES[path.slice(path.lastIndexOf('.')).toLowerCase()];
};

const summarize = (value: string, limit = 200): string => {
  const flat = value.replace(/\s+/g, ' ').trim();
  return flat.length <= limit ? flat : `${flat.slice(0, limit - 1)}…`;
};

interface Preview {
  title: string;
  description: string;
  image: string;
  path: string;
  type: 'article' | 'website';
}

const renderPreview = (preview: Preview): string => {
  const url = `${config.siteUrl}${preview.path}`;
  const title = escapeHtml(preview.title);
  const description = escapeHtml(preview.description);
  const image = escapeHtml(preview.image);
  const type = preview.image.includes('/api/share/image/')
    ? 'image/jpeg'
    : imageType(preview.image);

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:site_name" content="ASC Cambérène" />
    <meta property="og:type" content="${preview.type}" />
    <meta property="og:locale" content="fr_SN" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:alt" content="${title}" />
    ${type ? `<meta property="og:image:type" content="${type}" />` : ''}
    ${preview.image.startsWith('https://') ? `<meta property="og:image:secure_url" content="${image}" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:image:alt" content="${title}" />
    <link rel="canonical" href="${escapeHtml(url)}" />
    <!--
      Un robot s'arrête aux balises ci-dessus. Une personne qui ouvrirait ce
      lien est renvoyée vers la page réelle : la redirection est écrite deux
      fois, car un navigateur sans JavaScript n'a que la balise meta refresh.
    -->
    <meta http-equiv="refresh" content="0; url=${escapeHtml(url)}" />
  </head>
  <body>
    <p>Redirection vers <a href="${escapeHtml(url)}">${title}</a>…</p>
    <script>window.location.replace(${JSON.stringify(url)});</script>
  </body>
</html>`;
};

const fallback = (): Preview => ({
  title: 'ASC Cambérène — Club officiel',
  description: 'Club officiel de football sénégalais, fondé en 1965.',
  image: absoluteImage(undefined),
  path: '/',
  type: 'website',
});

const send = (res: import('express').Response, preview: Preview): void => {
  res.set('Cache-Control', 'public, max-age=300');
  res.type('html').send(renderPreview(preview));
};

router.get(
  '/image/article/:id',
  handler(async (req, res) => {
    const article = await Article.findOne({ _id: req.params.id, status: 'published' }).select('image');
    const image = typeof article?.image === 'string' ? article.image.trim() : '';
    if (!image) throw notFound('Image introuvable');

    const body = await buildPreview(image);
    if (!body) {
      res.redirect(302, absoluteImage(image));
      return;
    }

    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Length': String(body.length),
      'Cache-Control': 'public, max-age=86400',
    });
    res.send(body);
  })
);

router.get(
  '/article/:id',
  handler(async (req, res) => {
    const article = await Article.findOne({ _id: req.params.id, status: 'published' });

    if (!article) {
      send(res, fallback());
      return;
    }

    send(res, {
      title: article.title,
      description: summarize(article.excerpt || article.content || ''),
      image: articleImage(article.id, article.image),
      path: `/news/${article.id}`,
      type: 'article',
    });
  })
);

router.get(
  '/match/:id',
  handler(async (req, res) => {
    const match = await Match.findById(req.params.id);

    if (!match) {
      send(res, fallback());
      return;
    }

    const affiche =
      match.venue === 'Domicile'
        ? `ASC Cambérène — ${match.opponent}`
        : `${match.opponent} — ASC Cambérène`;

    const date = new Date(`${match.date}T12:00:00`).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    const description = match.result
      ? `${affiche} · ${match.result.home} — ${match.result.away} · ${match.competition}`
      : `${date} à ${match.time} · ${match.competition} · ${match.venue}`;

    send(res, {
      title: affiche,
      description,
      image: absoluteImage(match.image),
      path: '/billetterie',
      type: 'website',
    });
  })
);

export default router;
