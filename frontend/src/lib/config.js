/**
 * frontend/src/lib/config.js
 * Central place for all environment-based URLs.
 */

const RAW_API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Strip trailing slash
export const BASE_URL = RAW_API.replace(/\/$/, '');
export const API_BASE = `${BASE_URL}/api`;

/**
 * Build a full API endpoint URL.
 * @param {string} path - e.g. '/auth/login'
 */
export function getApiUrl(path) {
  const normalised = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalised}`;
}

/** Socket URLs */
export function getChatSocketUrl()  { return BASE_URL; }
export function getSocketUrl()      { return BASE_URL; }

/**
 * Legacy / AI camera exports — kept for backward compatibility
 * with AICamera.jsx, InlineCameraPanel.jsx, useAICamera.js, useVoiceToSign.js
 */
export const TEXT_TO_SIGN_API_URL    = `${API_BASE}/speech/text-to-signs`;
export const SIGN_LANGUAGE_SOCKET_URL = BASE_URL;
