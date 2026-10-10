import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

/**
 * Default origin of the Vercel development server that executes the
 * serverless functions under `api/`. `vercel dev` serves the API on its own
 * port (3000 by default); Vite alone does not execute `/api/*`. When the
 * dashboard is opened on the Vite port, the proxy below forwards `/api` to the
 * Vercel server so both run on one origin for the browser.
 *
 * Override with `API_PROXY_TARGET` (a server-side, non-`VITE_` variable so it is
 * not exposed to the browser) when `vercel dev` prints another port. This is a
 * dev-server-only setting and never affects the production build.
 */
const DEFAULT_API_PROXY_TARGET = 'http://localhost:3000';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = env.API_PROXY_TARGET || DEFAULT_API_PROXY_TARGET;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
