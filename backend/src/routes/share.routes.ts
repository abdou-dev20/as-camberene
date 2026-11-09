import { Router } from 'express';
import Article from '../models/Article.model';
import Match from '../models/Match.model';
import { handler } from '../lib/http';
import config from '../config/env';

const router = Router();

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const absoluteImage = (value: string | undefined): string => {
  const trimmed = value?.trim();
  if (!trimmed) return `${config.siteUrl}/assets/img/asc-camberene-equipe-2025.webp`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${config.siteUrl}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
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
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
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
      image: absoluteImage(article.image),
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
