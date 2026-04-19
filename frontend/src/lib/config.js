/**
 * SIGNOVA – frontend/src/lib/config.js
 *
 * Single source of truth for all backend URLs.
 *
 * Dev (local PC)   → leave VITE_BACKEND_URL unset; Vite proxy forwards /api & /socket.io to localhost:5000
 * Dev (mobile/LAN) → set VITE_BACKEND_URL=http://192.168.1.X:5000 in frontend/.env
 * Production       → set VITE_BACKEND_URL=https://your-backend.railway.app in Vercel env vars
 */

const rawBackendUrl = import.meta.env.VITE_BACKEND_URL?.trim().replace(/\/$/, '') ?? '';

export const BACKEND_URL = rawBackendUrl;

export function getApiUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return BACKEND_URL ? `${BACKEND_URL}${normalized}` : normalized;
}

export const TEXT_TO_SIGN_API_URL = getApiUrl('/api/text-to-sign');

/**
 * Socket.IO base URL (no namespace).
 * Empty string → connect to same origin → Vite proxy tunnels to backend.
 */
export const SOCKET_URL = BACKEND_URL || '';

/**
 * Chat namespace URL.
 * socket.io-client: io('http://host/chat') OR io('http://host', { path: '/chat' })
 */
export const CHAT_SOCKET_URL = BACKEND_URL
  ? `${BACKEND_URL}/chat`
  : '/chat';

/**
 * Sign-language namespace URL.
 */
export const SIGN_LANGUAGE_SOCKET_URL = BACKEND_URL
  ? `${BACKEND_URL}/sign-language`
  : '/sign-language';
