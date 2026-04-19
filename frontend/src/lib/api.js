/**
 * frontend/src/lib/api.js
 * Thin wrapper around fetch that:
 *  - Builds the full URL via getApiUrl()
 *  - Attaches the Bearer token from localStorage automatically
 *  - Throws a structured error for non-2xx responses
 */
import { getApiUrl } from './config';

function getToken() {
  return localStorage.getItem('token') || '';
}

function authHeaders(extra = {}) {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra
  };
}

async function handleResponse(res) {
  let body;
  try {
    body = await res.json();
  } catch {
    body = {};
  }
  if (!res.ok) {
    const message = body?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export const api = {
  get(path) {
    return fetch(getApiUrl(path), {
      method: 'GET',
      headers: authHeaders()
    }).then(handleResponse);
  },

  post(path, data) {
    return fetch(getApiUrl(path), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data ?? {})
    }).then(handleResponse);
  },

  patch(path, data) {
    return fetch(getApiUrl(path), {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data ?? {})
    }).then(handleResponse);
  },

  delete(path) {
    return fetch(getApiUrl(path), {
      method: 'DELETE',
      headers: authHeaders()
    }).then(handleResponse);
  }
};
