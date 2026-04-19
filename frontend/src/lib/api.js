/**
 * frontend/src/lib/api.js
 * Smart fetch wrapper with:
 *  - Auto Bearer token
 *  - Auto refresh token rotation on 401
 *  - Multipart (FormData) support
 *  - Structured error throwing
 */
import { getApiUrl } from './config';

const TOKEN_KEY   = 'signova_access_token';
const REFRESH_KEY = 'signova_refresh_token';

export const tokenStorage = {
  getAccess:     () => localStorage.getItem(TOKEN_KEY) || '',
  getRefresh:    () => localStorage.getItem(REFRESH_KEY) || '',
  setAccess:     (t) => localStorage.setItem(TOKEN_KEY, t),
  setRefresh:    (t) => localStorage.setItem(REFRESH_KEY, t),
  clear:         () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(REFRESH_KEY); },
  // Legacy key support (old token key was 'token')
  migrate: () => {
    const legacy = localStorage.getItem('token');
    if (legacy && !localStorage.getItem(TOKEN_KEY)) {
      localStorage.setItem(TOKEN_KEY, legacy);
      localStorage.removeItem('token');
    }
  },
};
tokenStorage.migrate();

let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token = null) {
  refreshQueue.forEach((p) => error ? p.reject(error) : p.resolve(token));
  refreshQueue = [];
}

async function tryRefresh() {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) throw new Error('No refresh token');

  const res = await fetch(getApiUrl('/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    tokenStorage.clear();
    throw new Error('Session expired. Please login again.');
  }

  const data = await res.json();
  tokenStorage.setAccess(data.accessToken);
  tokenStorage.setRefresh(data.refreshToken);
  return data.accessToken;
}

function buildHeaders(extra = {}, isFormData = false) {
  const token = tokenStorage.getAccess();
  return {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function handleResponse(res) {
  let body;
  try { body = await res.json(); } catch { body = {}; }
  if (!res.ok) {
    const err = new Error(body?.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

async function request(path, options = {}, retry = true) {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(getApiUrl(path), {
    ...options,
    headers: buildHeaders(options.headers || {}, isFormData),
  });

  if (res.status === 401 && retry) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((newToken) => {
        return request(path, {
          ...options,
          headers: { ...(options.headers || {}), Authorization: `Bearer ${newToken}` },
        }, false);
      });
    }

    isRefreshing = true;
    try {
      const newToken = await tryRefresh();
      processQueue(null, newToken);
      return request(path, options, false);
    } catch (err) {
      processQueue(err);
      // Trigger global logout event
      window.dispatchEvent(new CustomEvent('signova:logout'));
      throw err;
    } finally {
      isRefreshing = false;
    }
  }

  return handleResponse(res);
}

export const api = {
  get:    (path)        => request(path, { method: 'GET' }),
  post:   (path, data)  => request(path, { method: 'POST',  body: JSON.stringify(data ?? {}) }),
  patch:  (path, data)  => request(path, { method: 'PATCH', body: JSON.stringify(data ?? {}) }),
  delete: (path)        => request(path, { method: 'DELETE' }),

  /** Upload FormData (avatar, audio, etc.) */
  upload: (path, formData, method = 'POST') =>
    request(path, { method, body: formData }),
};
