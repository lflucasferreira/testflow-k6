import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, DEMO_EMAIL, DEMO_PASSWORD } from '../config/environments.js';
import { endpoints } from './endpoints.js';

/**
 * Authenticate via POST /api/auth/login and return bearer token.
 * @param {import('k6/http').RefinedParams<import('k6/http').ResponseType>} [params]
 * @returns {string|null}
 */
export function login(params = {}) {
  const payload = JSON.stringify({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  const res = http.post(`${BASE_URL}${endpoints.auth.login}`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'auth_login', name: 'POST /api/auth/login' },
    ...params,
  });

  const ok = check(res, {
    'login status 200': (r) => r.status === 200,
    'login has token': (r) => {
      try {
        const body = r.json();
        return typeof body.token === 'string' && body.token.length > 0;
      } catch {
        return false;
      }
    },
  });

  if (!ok) {
    return null;
  }

  return res.json('token');
}

/**
 * Build Authorization header from bearer token.
 * @param {string} token
 * @returns {Record<string, string>}
 */
export function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Setup helper for scenarios that need a shared token per VU iteration.
 * @returns {{ token: string|null }}
 */
export function setupAuth() {
  const token = login();
  return { token };
}
