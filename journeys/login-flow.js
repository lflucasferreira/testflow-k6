/**
 * User journey — login API + static login page (HTTP-only, no browser).
 * Run: npm run test:journey:login
 */
import { sleep, group } from 'k6';
import http from 'k6/http';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL, DEMO_EMAIL, DEMO_PASSWORD, TAGS } from '../config/environments.js';
import { getProfile } from '../config/profiles.js';
import { getThresholds } from '../config/thresholds.js';
import { endpoints } from '../lib/endpoints.js';
import { getStaticPage } from '../lib/http.js';
import { handleSummary } from '../lib/summary.js';

export { handleSummary };

const loginFlowDuration = new Trend('login_flow_duration', true);

const profile = getProfile(__ENV.K6_PROFILE || 'load');

export const options = {
  scenarios: {
    login_flow: {
      executor: 'ramping-vus',
      ...profile,
      tags: { test_type: TAGS.journey, suite: 'login-flow' },
    },
  },
  thresholds: {
    ...getThresholds('load'),
    login_flow_duration: ['p(95)<4000'],
  },
};

export default function loginFlow() {
  const start = Date.now();

  group('01_load_login_page', () => {
    getStaticPage(endpoints.web.login);
    sleep(0.5);
  });

  group('02_api_login', () => {
    const payload = JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    const res = http.post(`${BASE_URL}${endpoints.auth.login}`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'auth_login', name: 'POST /api/auth/login' },
    });

    check(res, {
      'login succeeds': (r) => r.status === 200,
      'token returned': (r) => typeof r.json('token') === 'string',
    });

    sleep(0.3);
  });

  group('03_post_login_navigation', () => {
    getStaticPage(endpoints.web.dashboard);
    sleep(0.5);
  });

  loginFlowDuration.add(Date.now() - start);
}
