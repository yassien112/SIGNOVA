import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => {
  // Load env variables for this mode (development / production)
  const env = loadEnv(mode, process.cwd(), '');

  /**
   * Where the Node backend listens in development.
   * Override with VITE_DEV_PROXY_TARGET in frontend/.env if your backend
   * runs on a different port or host.
   *
   * IMPORTANT: this proxy is only active during `npm run dev`.
   * In production (Vercel) the VITE_BACKEND_URL env var is used instead.
   */
  const backendOrigin =
    env.VITE_DEV_PROXY_TARGET ||
    env.VITE_BACKEND_URL ||
    'http://localhost:5000';

  // Set VITE_DEV_HTTPS=1 to enable HTTPS (needed for microphone on phones over LAN)
  const useDevHttps =
    env.VITE_DEV_HTTPS === '1' ||
    env.VITE_DEV_HTTPS === 'true' ||
    env.VITE_DEV_HTTPS === 'yes';

  return {
    plugins: [react(), ...(useDevHttps ? [basicSsl()] : [])],

    server: {
      host: '0.0.0.0',   // listen on LAN + localhost
      port: 3000,
      strictPort: false,
      https: useDevHttps ? {} : undefined,

      proxy: {
        // REST API
        '/api': {
          target: backendOrigin,
          changeOrigin: true,
          secure: false,
        },
        // Socket.IO (HTTP upgrade + WebSocket)
        '/socket.io': {
          target: backendOrigin,
          changeOrigin: true,
          ws: true,
          secure: false,
        },
      },
    },

    // Make VITE_BACKEND_URL available in the built bundle
    define: {
      __BACKEND_URL__: JSON.stringify(env.VITE_BACKEND_URL || ''),
    },
  };
});
