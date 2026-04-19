import { defineConfig, loadEnv } from 'vite';
import react    from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const backendOrigin =
    env.VITE_DEV_PROXY_TARGET ||
    env.VITE_BACKEND_URL ||
    'http://localhost:5000';

  const useDevHttps =
    env.VITE_DEV_HTTPS === '1' ||
    env.VITE_DEV_HTTPS === 'true' ||
    env.VITE_DEV_HTTPS === 'yes';

  return {
    plugins: [
      tailwind(),          // Tailwind v4 — must come before react()
      react(),
      ...(useDevHttps ? [basicSsl()] : []),
    ],

    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: false,
      https: useDevHttps ? {} : undefined,
      proxy: {
        '/api': { target: backendOrigin, changeOrigin: true, secure: false },
        '/socket.io': { target: backendOrigin, changeOrigin: true, ws: true, secure: false },
      },
    },

    define: {
      __BACKEND_URL__: JSON.stringify(env.VITE_BACKEND_URL || ''),
    },
  };
});
