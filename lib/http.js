import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from '../config/environments.js';
import { endpoints } from './endpoints.js';
import { authHeaders } from './auth.js';

/**
 * GET /health with standard checks and tags.
 * @param {import('k6/http').RefinedParams<import('k6/http').ResponseType>} [params]
 */
export function getHealth(params = {}) {
  const res = http.get(`${BASE_URL}${endpoints.health}`, {
    tags: { endpoint: 'health', name: 'GET /health' },
    ...params,
  });

  check(res, {
    'health status 200': (r) => r.status === 200,
    'health responds quickly': (r) => r.timings.duration < 1000,
  });

  return res;
}

/**
 * GET /api/users with optional auth.
 * @param {string|null} [token]
 * @param {import('k6/http').RefinedParams<import('k6/http').ResponseType>} [params]
 */
export function getUsers(token = null, params = {}) {
  const headers = token ? authHeaders(token) : { 'Content-Type': 'application/json' };

  const res = http.get(`${BASE_URL}${endpoints.users.list}`, {
    headers,
    tags: { endpoint: 'users', name: 'GET /api/users' },
    ...params,
  });

  check(res, {
    'users status 200': (r) => r.status === 200,
    'users has array': (r) => {
      try {
        const body = r.json();
        return Array.isArray(body.users) && body.users.length > 0;
      } catch {
        return false;
      }
    },
    'users responds within 2s': (r) => r.timings.duration < 2000,
  });

  return res;
}

/**
 * GET static HTML page (web shell).
 * @param {string} path
 * @param {import('k6/http').RefinedParams<import('k6/http').ResponseType>} [params]
 */
export function getStaticPage(path, params = {}) {
  const res = http.get(`${BASE_URL}${path}`, {
    tags: { endpoint: 'static', name: `GET ${path}` },
    ...params,
  });

  check(res, {
    'static page status 200': (r) => r.status === 200,
    'static page has html': (r) => (r.headers['Content-Type'] || '').includes('text/html'),
  });

  return res;
}

/**
 * GET error simulation endpoint — expects specific status.
 * @param {'404'|'422'} type
 */
export function getErrorSimulation(type) {
  const path = type === '404' ? endpoints.errors.notFound : endpoints.errors.validation;
  const expectedStatus = type === '404' ? 404 : 422;

  const res = http.get(`${BASE_URL}${path}`, {
    tags: { endpoint: 'errors', name: `GET ${path}` },
  });

  check(res, {
    [`error ${expectedStatus} status`]: (r) => r.status === expectedStatus,
  });

  return res;
}

/**
 * Weighted random pick from items.
 * @template T
 * @param {Array<{ weight: number, fn: () => T }>} items
 * @returns {T}
 */
export function weightedPick(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;

  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) {
      return item.fn();
    }
  }

  return items[items.length - 1].fn();
}

/**
 * Think time between iterations — simulates user pause.
 * @param {number} minSeconds
 * @param {number} maxSeconds
 */
export function thinkTime(minSeconds = 1, maxSeconds = 3) {
  const seconds = minSeconds + Math.random() * (maxSeconds - minSeconds);
  return seconds;
}
