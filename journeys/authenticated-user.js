/**
 * User journey — authenticated session: login → users → dashboard page.
 * Run: npm run test:journey:auth
 */
import { sleep, group } from 'k6';
import { Trend } from 'k6/metrics';
import { TAGS } from '../config/environments.js';
import { getProfile } from '../config/profiles.js';
import { getThresholds } from '../config/thresholds.js';
import { login } from '../lib/auth.js';
import { endpoints } from '../lib/endpoints.js';
import { getUsers, getStaticPage } from '../lib/http.js';
import { handleSummary } from '../lib/summary.js';

export { handleSummary };

const journeyDuration = new Trend('journey_duration', true);

const profile = getProfile(__ENV.K6_PROFILE || 'load');

export const options = {
  scenarios: {
    authenticated_journey: {
      executor: 'ramping-vus',
      ...profile,
      tags: { test_type: TAGS.journey, suite: 'authenticated-user' },
    },
  },
  thresholds: getThresholds('load'),
};

export default function authenticatedUserJourney() {
  const start = Date.now();
  let token = null;

  group('01_login', () => {
    token = login();
    sleep(0.3);
  });

  group('02_fetch_users', () => {
    getUsers(token);
    sleep(0.5);
  });

  group('03_browse_dashboard', () => {
    getStaticPage(endpoints.web.dashboard);
    sleep(0.5);
  });

  group('04_browse_team', () => {
    getStaticPage(endpoints.web.team);
    sleep(0.5);
  });

  journeyDuration.add(Date.now() - start);
}
