/**
 * Load — sustained auth login throughput.
 * Run: npm run test:load:auth
 */
import { sleep } from 'k6';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL, DEMO_EMAIL, DEMO_PASSWORD, TAGS } from '../../config/environments.js';
import { getProfile } from '../../config/profiles.js';
import { getThresholds } from '../../config/thresholds.js';
import { endpoints } from '../../lib/endpoints.js';
import { handleSummary } from '../../lib/summary.js';

export { handleSummary };

const loginDuration = new Trend('login_duration', true);
const loginErrors = new Rate('login_errors');

const profile = getProfile(__ENV.K6_PROFILE || 'load');

export const options = {
  scenarios: {
    auth_load: {
      executor: 'ramping-vus',
      ...profile,
      tags: { test_type: TAGS.load, suite: 'api-auth' },
    },
  },
  thresholds: {
    ...getThresholds('load'),
    login_duration: ['p(95)<2000'],
    login_errors: ['rate<0.01'],
  },
};

export default function authLoad() {
  const payload = JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD });

  const res = http.post(`${BASE_URL}${endpoints.auth.login}`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'auth_login', name: 'POST /api/auth/login' },
  });

  const ok = check(res, {
    'login 200': (r) => r.status === 200,
    'login token present': (r) => {
      try {
        return typeof r.json('token') === 'string';
      } catch {
        return false;
      }
    },
  });

  loginDuration.add(res.timings.duration);
  loginErrors.add(!ok);

  sleep(1);
}
