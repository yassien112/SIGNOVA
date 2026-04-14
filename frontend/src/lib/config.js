const configuredBackendUrl = import.meta.env.VITE_BACKEND_URL?.trim();

/**
 * Empty in dev = same origin as the Vite app (works on phone via http(s)://<YOUR-LAN-IP>:3000 + proxy).
 * Only set VITE_BACKEND_URL for special setups; never use http://localhost:5000 if you open the UI from a phone.
 */
export const BACKEND_URL = configuredBackendUrl || '';

/**
 * Build a URL for REST calls. When VITE_BACKEND_URL is unset, use a relative path so the
 * Vite dev proxy (or same-origin deploy) forwards /api to the backend.
 */
export function getApiUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const base = BACKEND_URL.replace(/\/$/, '');
  return base ? `${base}${normalized}` : normalized;
}

export const TEXT_TO_SIGN_API_URL = getApiUrl('/api/text-to-sign');

export const SIGN_LANGUAGE_SOCKET_URL = BACKEND_URL
  ? `${BACKEND_URL.replace(/\/$/, '')}/sign-language`
  : '/sign-language';
