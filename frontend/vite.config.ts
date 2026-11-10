import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

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
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: { proxy },
  };
});
