import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// Match the backend PORT (default 5000). Override if needed, e.g. VITE_DEV_PROXY_TARGET=http://127.0.0.1:5000
const backendOrigin = process.env.VITE_DEV_PROXY_TARGET || 'http://localhost:5000';

// Set VITE_DEV_HTTPS=1 for microphone-friendly HTTPS on phones (self-signed cert; tap "Advanced" → proceed once).
const useDevHttps =
  process.env.VITE_DEV_HTTPS === '1' ||
  process.env.VITE_DEV_HTTPS === 'true' ||
  process.env.VITE_DEV_HTTPS === 'yes';

export default defineConfig({
  plugins: [react(), ...(useDevHttps ? [basicSsl()] : [])],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
    https: useDevHttps ? {} : undefined,
    proxy: {
      '/api': {
        target: backendOrigin,
        changeOrigin: true
      },
      '/socket.io': {
        target: backendOrigin,
        changeOrigin: true,
        ws: true
      }
    }
  }
});
