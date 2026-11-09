import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  /*
    Relais facultatif du serveur de développement vers une API déjà lancée —
    la pile Docker sur :8080, par exemple — quand on ne veut pas démarrer
    « npm run dev » depuis backend/. Activé seulement si DEV_API_TARGET est défini
    (dans .env.development.local, ignoré par git) ; le site appelle alors
    son propre domaine, ce qui évite aussi tout souci de CORS.
  */
  const target = env.DEV_API_TARGET;
  const proxy = target
    ? {
        '/api': { target, changeOrigin: true },
        '/uploads': { target, changeOrigin: true },
      }
    : undefined;

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: { proxy },
  };
});
