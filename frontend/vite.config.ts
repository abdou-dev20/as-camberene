import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Robots des réseaux : eux seuls reçoivent la page d'aperçu. Les navigateurs
// ordinaires ne revendiquent jamais ces user-agents.
const SHARE_BOTS =
  /(facebookexternalhit|Facebot|WhatsApp|Twitterbot|LinkedInBot|TelegramBot|Slackbot|Discordbot|SkypeUriPreview|redditbot|Pinterest)/i;

// En production, Apache dirige ces robots vers l'API (voir frontend/httpd-site.conf).
// Le serveur de développement doit en faire autant, sinon un lien d'article
// testé en local n'affiche que l'aperçu générique du site.
const sharePreview = (target: string | undefined): Plugin => ({
  name: 'asc-share-preview',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const userAgent = req.headers['user-agent'] ?? '';
      const match = (req.url ?? '').match(/^\/news\/([a-f0-9]{24})(?:[/?]|$)/i);

      if (!target || !match || !SHARE_BOTS.test(userAgent)) {
        next();
        return;
      }

      fetch(`${target}/api/share/article/${match[1]}`)
        .then(async (response) => {
          const body = await response.text();
          res.statusCode = response.status;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(body);
        })
        .catch(() => next());
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  const target = env.DEV_API_TARGET;
  const proxy = target
    ? {
        '/api': { target, changeOrigin: true },
        '/uploads': { target, changeOrigin: true },
      }
    : undefined;

  return {
    plugins: [react(), sharePreview(target)],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: { proxy },
  };
});
