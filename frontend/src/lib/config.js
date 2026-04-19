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

/**
 * Socket URL for the chat namespace.
 */
export function getChatSocketUrl() {
  return BASE_URL;
}

/**
 * Generic socket URL (same server).
 */
export function getSocketUrl() {
  return BASE_URL;
}
