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

/**
 * Base URL for the backend.
 * Empty string in local dev → relative paths → Vite proxy handles it.
 * Full URL in production    → absolute requests to the deployed backend.
 */
export const BACKEND_URL = rawBackendUrl;

/**
 * Build a full URL for REST API calls.
 * Works for both relative (/api/...) and absolute (https://...) bases.
 */
export function getApiUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return BACKEND_URL ? `${BACKEND_URL}${normalized}` : normalized;
}

/** Pre-built URL for text-to-sign REST endpoint */
export const TEXT_TO_SIGN_API_URL = getApiUrl('/api/text-to-sign');

/**
 * Socket.IO connection URL.
 *
 * Local dev  → '' (empty) lets socket.io-client connect to the same origin,
 *              which the Vite proxy then tunnels to the backend.
 * Production → full backend origin so the socket connects directly.
 */
export const SOCKET_URL = BACKEND_URL || window.location.origin;

/**
 * Dedicated namespace for sign-language socket.
 * socket.io-client accepts '<origin>/namespace' or just '/namespace' (same-origin).
 */
export const SIGN_LANGUAGE_SOCKET_URL = BACKEND_URL
  ? `${BACKEND_URL}/sign-language`
  : window.location.origin;
